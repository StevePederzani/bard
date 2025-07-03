'use client'
import { useEffect, useState, useRef } from 'react'

type Capability = {
  label: string
  supported: boolean
  granted?: 'granted' | 'prompt' | 'denied'
  value?: string | number | boolean | null
}

type FarcasterWindow = Window & {
  farcaster?: { haptics?: { vibrate(): void } }
}
type NavigatorWithDeviceMemory = Navigator & { deviceMemory?: number }
type BatteryManager = {
  level: number
  charging: boolean
  onlevelchange: (() => void) | null
  onchargingchange: (() => void) | null
}

const getGeolocation = (cb: (coords: GeolocationCoordinates) => void) => {
  let watchId = -1
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      pos => cb(pos.coords),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
  }
  return () => {
    if (watchId !== -1) navigator.geolocation.clearWatch(watchId)
  }
}

const getBatteryInfo = async (): Promise<Capability[]> => {
  if (!('getBattery' in navigator)) return []
  try {
    const battery = await (navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }).getBattery!() as BatteryManager
    return [
      {
        label: 'Battery Level',
        supported: true,
        value: Math.round(battery.level * 100),
      },
      {
        label: 'Battery Charging',
        supported: true,
        value: battery.charging,
      },
    ]
  } catch {
    return [
      {
        label: 'Battery Info',
        supported: false,
      },
    ]
  }
}

const getNetworkInfo = (): Capability[] => {
  type NetworkInformation = {
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }
  const nav = navigator as Navigator & { connection?: NetworkInformation }
  if (!nav.connection) return []
  const c = nav.connection
  return [
    {
      label: 'Network Type',
      supported: true,
      value: c.effectiveType || null,
    },
    {
      label: 'Network Downlink (Mbps)',
      supported: 'downlink' in c,
      value: c.downlink || null,
    },
    {
      label: 'Network RTT (ms)',
      supported: 'rtt' in c,
      value: c.rtt || null,
    },
    {
      label: 'Network Save Data',
      supported: 'saveData' in c,
      value: c.saveData || null,
    },
  ]
}

const getScreenInfo = (): Capability[] => [
  {
    label: 'Screen Width',
    supported: true,
    value: window.screen.width,
  },
  {
    label: 'Screen Height',
    supported: true,
    value: window.screen.height,
  },
  {
    label: 'Pixel Ratio',
    supported: true,
    value: window.devicePixelRatio,
  },
  {
    label: 'Screen Orientation Type',
    supported: 'orientation' in screen && 'type' in screen.orientation,
    value: ('orientation' in screen && 'type' in screen.orientation) ? screen.orientation.type : null,
  },
  {
    label: 'Screen Orientation Angle',
    supported: 'orientation' in screen && 'angle' in screen.orientation,
    value: ('orientation' in screen && 'angle' in screen.orientation) ? screen.orientation.angle : null,
  },
]

const getAudioVideoInputCounts = async (): Promise<Capability[]> => {
  if (!('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices)) return []
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return [
      {
        label: 'Audio Input Devices',
        supported: true,
        value: devices.filter(d => d.kind === 'audioinput').length,
      },
      {
        label: 'Video Input Devices',
        supported: true,
        value: devices.filter(d => d.kind === 'videoinput').length,
      },
      {
        label: 'Audio Output Devices',
        supported: true,
        value: devices.filter(d => d.kind === 'audiooutput').length,
      },
    ]
  } catch {
    return []
  }
}

const checkDeviceCapabilities = async (): Promise<Capability[]> => {
  const caps: Capability[] = []

  caps.push({
    label: 'DeviceOrientation',
    supported: 'DeviceOrientationEvent' in window,
  })

  caps.push({
    label: 'DeviceMotion',
    supported: 'DeviceMotionEvent' in window,
  })

  if ('permissions' in navigator) {
    for (const name of ['camera', 'microphone', 'geolocation'] as const) {
      try {
        const status = await navigator.permissions.query({ name })
        caps.push({
          label: `${name[0].toUpperCase() + name.slice(1)} Permission`,
          supported: true,
          granted: status.state,
        })
      } catch {
        caps.push({
          label: `${name[0].toUpperCase() + name.slice(1)} Permission`,
          supported: false,
        })
      }
    }
  }

  type WindowWithWebkitAudioContext = Window & { webkitAudioContext?: typeof AudioContext }
  caps.push({
    label: 'Audio Output',
    supported: typeof AudioContext !== 'undefined' || typeof (window as WindowWithWebkitAudioContext).webkitAudioContext !== 'undefined',
  })

  caps.push({
    label: 'Touch Support',
    supported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  })

  const hasVibrate = typeof navigator.vibrate === 'function'
  const hasFarcasterVibrate = typeof (window as FarcasterWindow).farcaster?.haptics?.vibrate === 'function'
  caps.push({
    label: 'Haptics (Vibration)',
    supported: hasVibrate || hasFarcasterVibrate,
  })

  const dm = (navigator as NavigatorWithDeviceMemory).deviceMemory
  caps.push({
    label: 'Memory (GB)',
    supported: typeof dm === 'number',
    ...(typeof dm === 'number' && { value: dm }),
  })

  const hc = navigator.hardwareConcurrency
  caps.push({
    label: 'Logical CPU Cores',
    supported: typeof hc === 'number',
    ...(typeof hc === 'number' && { value: hc }),
  })

  caps.push({
    label: 'User Agent',
    supported: true,
    value: navigator.userAgent,
  })

  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    const vendor = gl && ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : 'unknown'
    const renderer = gl && ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown'
    caps.push({ label: 'GPU Vendor', supported: true, value: vendor })
    caps.push({ label: 'GPU Renderer', supported: true, value: renderer })
  } catch {
    caps.push({ label: 'GPU Info', supported: false })
  }

  caps.push({
    label: 'Cookie Enabled',
    supported: 'cookieEnabled' in navigator,
    value: navigator.cookieEnabled,
  })

  caps.push({
    label: 'Secure Context',
    supported: 'isSecureContext' in window,
    value: window.isSecureContext,
  })

  caps.push({
    label: 'Languages',
    supported: 'languages' in navigator,
    value: Array.isArray(navigator.languages) ? navigator.languages.join(', ') : navigator.language,
  })

  caps.push({
    label: 'Locale',
    supported: 'language' in navigator,
    value: navigator.language,
  })

  caps.push({
    label: 'Time Zone',
    supported: true,
    value: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  caps.push(...getScreenInfo())
  caps.push(...getNetworkInfo())
  caps.push(...await getAudioVideoInputCounts())
  caps.push(...await getBatteryInfo())

  return caps
}

export default function Inputs() {
  const [caps, setCaps] = useState<Capability[]>([])
  const [geo, setGeo] = useState<Partial<Record<'Latitude' | 'Longitude' | 'Altitude' | 'Accuracy' | 'Speed' | 'Heading', number>>>({})
  const geoStarted = useRef(false)

  useEffect(() => {
    checkDeviceCapabilities().then(setCaps)
  }, [])

  useEffect(() => {
    if (geoStarted.current) return
    geoStarted.current = true
    const stop = getGeolocation(coords => {
      setGeo({
        Latitude: coords.latitude,
        Longitude: coords.longitude,
        Altitude: coords.altitude ?? undefined,
        Accuracy: coords.accuracy,
        Speed: coords.speed ?? undefined,
        Heading: coords.heading ?? undefined,
      })
    })
    return stop
  }, [])

  return (
    <>
      <div className="inputData scrollable">
        <ul>
          {caps.map(({ label, supported, granted, value }) => (
            <li key={label}>
              {label}: {supported ? 'Yes' : 'No'}
              {granted && ` (${granted})`}
              {value !== undefined && value !== null && ` → ${value}`}
            </li>
          ))}
          {'Latitude' in geo && (
            <li>
              Latitude: {geo.Latitude}
            </li>
          )}
          {'Longitude' in geo && (
            <li>
              Longitude: {geo.Longitude}
            </li>
          )}
          {'Altitude' in geo && geo.Altitude !== undefined && (
            <li>
              Altitude (m): {geo.Altitude}
            </li>
          )}
          {'Accuracy' in geo && (
            <li>
              Accuracy (m): {geo.Accuracy}
            </li>
          )}
          {'Speed' in geo && geo.Speed !== undefined && (
            <li>
              Speed (m/s): {geo.Speed}
            </li>
          )}
          {'Heading' in geo && geo.Heading !== undefined && (
            <li>
              Heading (°): {geo.Heading}
            </li>
          )}
        </ul>
      </div>
    </>
  )
}
