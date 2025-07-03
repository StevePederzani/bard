// VISUALIZER IS *NOT* READY!!!
'use client'
import { useEffect, useRef, useState, CSSProperties } from 'react'
import type { ReactElement } from 'react'
import { sdk } from '@farcaster/frame-sdk'

type B = {
  x: number
  y: number
  hue: number
  vx: number
  vy: number
  blast: number
  touch: number
  motion: number
}

const BLOB_COUNT = 64

function clamp(v: number, mn: number, mx: number): number {
  return Math.max(mn, Math.min(mx, v))
}

export default function Vibe(): ReactElement {
  const cRef = useRef<HTMLCanvasElement>(null)
  const blobs = useRef<B[]>([])
  const ptr = useRef({ x: 0.5, y: 0.5 })
  const ori = useRef({ x: 0.5, y: 0.5, z: 0 })
  const [initialized, setInitialized] = useState(false)
  const touchHue = useRef(0)
  const touchPower = useRef(0)
  const motionHue = useRef(0)
  const motionPower = useRef(0)

  const initSensors = async () => {
    if (initialized) return
    setInitialized(true)
    const Perm = DeviceMotionEvent as unknown as DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof Perm.requestPermission === 'function') {
      const perm = await Perm.requestPermission().catch(() => 'denied')
      if (perm !== 'granted') return
    }
  }

  useEffect(() => {
    ;(async () => { await sdk.actions.ready() })()
    const c = cRef.current!
    const ctx = c.getContext('2d', { alpha: true })!
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const w = c.clientWidth, h = c.clientHeight
      c.width = w * dpr; c.height = h * dpr
      ctx.resetTransform(); ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    const w = c.clientWidth, h = c.clientHeight
    blobs.current = Array.from({ length: BLOB_COUNT }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: 0, vy: 0, hue: Math.random()*360,
      blast: 0, touch: 0, motion: 0
    }))

    const handlePointer = (e: MouseEvent | TouchEvent) => {
      const X = 'touches' in e ? e.touches[0].clientX : e.clientX
      const Y = 'touches' in e ? e.touches[0].clientY : e.clientY
      ptr.current = { x: X/w, y: Y/h }
      const dx = X - w/2, dy = Y - h/2
      touchHue.current = ((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 360
      touchPower.current = 1
    }

    const handlePointerEnd = () => {
      touchPower.current = 0
    }

    window.addEventListener('mousemove', handlePointer)
    window.addEventListener('touchmove', handlePointer)
    window.addEventListener('mousedown', handlePointer)
    window.addEventListener('touchstart', handlePointer)
    window.addEventListener('mouseup', handlePointerEnd)
    window.addEventListener('touchend', handlePointerEnd)

    window.addEventListener('deviceorientation', ev => {
      ori.current.x = ((ev.gamma ?? 0) + 90) / 180
      ori.current.y = ((ev.beta ?? 0) + 180) / 360
      ori.current.z = (ev.alpha ?? 0) / 360
      const tilt = Math.abs(ev.beta ?? 0) + Math.abs(ev.gamma ?? 0)
      motionPower.current = clamp(tilt, 0, 180) / 180
      motionHue.current = (performance.now() * 0.999) % 360
    })

    let last = performance.now(), raf: ReturnType<typeof setTimeout>
    let fps = 60, nextFrame = 0

    const draw = () => {
      const now = performance.now(), dt = (now - last) * 0.001
      last = now; const t = now * 0.001
      fps = Math.min(144, Math.max(24, 1000 / Math.max(16.67, now - nextFrame)))
      nextFrame = now

      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      ctx.fillRect(0,0,w,h)
      ctx.globalCompositeOperation = 'lighter'
      ctx.filter = 'blur(7px)'

      const px = ptr.current.x * w, py = ptr.current.y * h
      const ox = ori.current.x * w, oy = ori.current.y * h

      for (const b of blobs.current) {
        let power = 0
        let liveHue = b.hue

        if (touchPower.current > 0.01) {
          power = Math.max(power, touchPower.current)
          liveHue = touchHue.current
        }

        if (motionPower.current > 0.2) {
          power = Math.max(power, motionPower.current)
          liveHue = motionHue.current
        }

        const cx = w / 2, cy = h / 2
        let ax = Math.sin((b.y + t*30) * 0.01) * cx * 0.002
        let ay = Math.cos((b.x + t*30) * 0.01) * cy * 0.002
        ax += (px - b.x) * 0.0007 + (ox - b.x) * 0.0004
        ay += (py - b.y) * 0.0007 + (oy - b.y) * 0.0004

        b.vx = (b.vx + ax) * 0.96
        b.vy = (b.vy + ay) * 0.96
        b.x += b.vx * dt * 36
        b.y += b.vy * dt * 36

        if (b.x < 0) b.x += w; else if (b.x > w) b.x -= w
        if (b.y < 0) b.y += h; else if (b.y > h) b.y -= h

        if (power > 0.5) {
          b.blast = Math.min(1, b.blast + 0.19 * power)
          b.hue = liveHue
        } else {
          b.blast = Math.max(0, b.blast - 0.022)
        }

        const r = 3 + 8 * b.blast + 2 * (0.5 + 0.5 * Math.sin(t * 2 + b.hue))
        const col = (b.hue + t * 42 * b.blast) % 360
        ctx.beginPath()
        ctx.fillStyle = `hsla(${col},100%,60%,${0.08 + 0.65 * b.blast})`
        ctx.arc(b.x, b.y, r, 0, 6.283)
        ctx.fill()
      }

      ctx.filter = 'none'
      raf = setTimeout(() => requestAnimationFrame(draw), 1000 / fps)
      if (touchPower.current > 0) touchPower.current = Math.max(0, touchPower.current - 0.08)
      if (motionPower.current > 0) motionPower.current = Math.max(0, motionPower.current - 0.02)
    }

    draw()
    return () => {
      clearTimeout(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handlePointer)
      window.removeEventListener('touchmove', handlePointer)
      window.removeEventListener('mousedown', handlePointer)
      window.removeEventListener('touchstart', handlePointer)
      window.removeEventListener('mouseup', handlePointerEnd)
      window.removeEventListener('touchend', handlePointerEnd)
    }
  }, [initialized])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      {!initialized && (
        <div onClick={initSensors}
          style={{ position:'absolute', inset:0, cursor:'pointer', zIndex:2 }}
        />
      )}
      <canvas ref={cRef} style={style} />
    </div>
  )
}

const style: CSSProperties = {
  position:'absolute', inset:0, width:'100%', height:'115%',
  padding:'0.5rem 2rem 0.5rem 2rem', background:'transparent',
  opacity:0.3, pointerEvents:'none', zIndex:0
}
