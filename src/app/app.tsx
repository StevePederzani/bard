'use client'
import { useEffect, useState, useRef, useCallback, JSX } from 'react'
import sdk from '@farcaster/frame-sdk'

const generate = (b = 27.5, n = 88) =>
  Array.from({ length: n }, (_, i) => b * 2 ** (i / 12))
const min = 27.5
const max = 4186
const piano = generate()
const names = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#']
const note = (f: number) => {
  if (!f) return '♪'
  const m = Math.round(12 * Math.log2(f / 440) + 69)
  return `${names[(m + 3) % 12]}${Math.floor(m / 12) - 1}`
}

const VIBRATO_DEAD = 15
const VIBRATO_MAX = 8

export default function Theremin(): JSX.Element {
  const [play, setPlay] = useState(false)
  const [p, setP] = useState(0)
  const prev = useRef(0)
  const [wave, setWave] = useState<'sine'|'square'|'triangle'|'sawtooth'>('sine')
  const ctx = useRef<AudioContext|null>(null)
  const osc = useRef<OscillatorNode|null>(null)
  const gain = useRef<GainNode|null>(null)
  const vib = useRef<OscillatorNode|null>(null)
  const [motionOK, setMotionOK] = useState(false)
  const [motionChk, setMotionChk] = useState(false)
  const vol = 0.05

  const lerp = useCallback((a: number, b: number, t: number) => a + (b - a) * t, [])
  const closest = useCallback((f: number) =>
    piano.reduce((x,y) => Math.abs(y - f) < Math.abs(x - f) ? y : x)
  , [])

  const setFreqSmooth = useCallback((t: number, s = 0.05) => {
    if (!osc.current || !ctx.current) return
    const now = ctx.current.currentTime
    const c = osc.current.frequency.value
    osc.current.frequency.setValueAtTime(lerp(c, t, s), now)
  }, [lerp])

  const orient = useCallback(async (e: DeviceOrientationEvent) => {
    const { beta, gamma } = e
    if (beta == null || gamma == null) return
    const targ = closest(min + (max - min) * (Math.max(0, Math.min(135, beta)) / 135))
    setFreqSmooth(targ)
    const g = Math.abs(gamma)
    const sp = g <= VIBRATO_DEAD ? 0 :
      Math.sin(((g - VIBRATO_DEAD) / (135 - VIBRATO_DEAD)) * Math.PI) * VIBRATO_MAX
    vib.current?.frequency.setValueAtTime(sp, ctx.current?.currentTime || 0)
    if (Math.abs(targ - prev.current) > 0.5) {
      prev.current = targ
      setP(targ)
      await sdk.haptics.selectionChanged()
    }
  }, [closest, setFreqSmooth])

  const update = useCallback(() => {
    if (!osc.current || !gain.current) return
    let m = vol
    if (wave === 'triangle') m *= 0.5
    if (wave === 'square' || wave === 'sawtooth') m *= 0.25
    gain.current.gain.setValueAtTime(m, ctx.current?.currentTime || 0)
    osc.current.type = wave
  }, [wave])

  const init = useCallback(async () => {
    const c = ctx.current ||= new AudioContext()
    if (c.state !== 'running') await c.resume()
    osc.current?.disconnect()
    gain.current?.disconnect()
    vib.current?.disconnect()
    osc.current = c.createOscillator()
    gain.current = c.createGain()
    vib.current = c.createOscillator()
    osc.current.type = wave
    osc.current.frequency.setValueAtTime(p, c.currentTime)
    gain.current.gain.setValueAtTime(vol, c.currentTime)
    vib.current.type = 'sine'
    vib.current.frequency.setValueAtTime(5, c.currentTime)
    const vg = c.createGain()
    vg.gain.setValueAtTime(30, c.currentTime)
    vib.current.connect(vg)
    vg.connect(osc.current.frequency)
    osc.current.connect(gain.current)
    gain.current.connect(c.destination)
    osc.current.start()
    vib.current.start()
    gain.current.gain.linearRampToValueAtTime(vol, c.currentTime + 0.4)
    update()
  }, [wave, p, update])

  // Map y to 88 piano notes (0-87), top is highest note, bottom is lowest
  const setFreq = useCallback((t: number, s = 0.12) => {
    if (!osc.current || !ctx.current) return
    const now = ctx.current.currentTime
    const c = osc.current.frequency.value
    osc.current.frequency.setValueAtTime(lerp(c, t, s), now)
  }, [lerp])

  const move = useCallback((x: number, y: number) => {
    if (!ctx.current) return
    // Clamp y to [0, window.innerHeight]
    const clampedY = Math.max(0, Math.min(window.innerHeight, y))
    // Map y to piano note index (0 = top/highest, 87 = bottom/lowest)
    const noteIdx = Math.round((clampedY / window.innerHeight) * (piano.length - 1))
    const f = piano[piano.length - 1 - noteIdx] // invert so top is highest note
    setFreq(f)
    // X controls modulation (vibrato) outside a deadzone in the center
    const deadzone = window.innerWidth * 0.2 // 20% center deadzone
    const center = window.innerWidth / 2
    let mod = 0
    if (Math.abs(x - center) > deadzone / 2) {
      // Map x outside deadzone to modulation amount (max at edges)
      const edgeDist = Math.abs(x - center) - deadzone / 2
      const maxDist = center - deadzone / 2
      mod = Math.min(1, edgeDist / maxDist) * VIBRATO_MAX
    }
    vib.current?.frequency.setValueAtTime(mod, ctx.current?.currentTime || 0)
    if (Math.abs(f - prev.current) > 0.5) {
      prev.current = f
      setP(f)
      sdk.haptics.selectionChanged()
    }
  }, [setFreq, vib])

  const pointer = useCallback((e: MouseEvent|TouchEvent) => {
    if (!play) return
    if (ctx.current && ctx.current.state !== 'running') ctx.current.resume()
    let x = 0, y = 0
    if ('touches' in e && e.touches[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY }
    else if ('clientX' in e) { x = e.clientX; y = e.clientY }
    move(x, y)
  }, [play, move])


  const stop = useCallback(() => {
    if (!osc.current || !gain.current) return
    const now = ctx.current!.currentTime
    gain.current.gain.cancelScheduledValues(now)
    gain.current.gain.setValueAtTime(gain.current.gain.value, now)
    gain.current.gain.linearRampToValueAtTime(0, now + 0.4)
    setTimeout(() => {
      osc.current?.stop()
      vib.current?.stop()
      osc.current?.disconnect()
      vib.current?.disconnect()
      gain.current?.disconnect()
    }, 450)
  }, [])

  const toggle = useCallback(async (f = false) => {
    if (play || f) {
      stop()
      setPlay(false)
    } else {
      await init()
      setPlay(true)
    }
  }, [play, init, stop])

  useEffect(() => {
    if (!motionChk) {
      ;(async () => {
        let ok = false
        if ('DeviceMotionEvent' in window && 'requestPermission' in DeviceMotionEvent) {
          try { ok = (await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()) === 'granted' } catch {}
        } else ok = true
        setMotionOK(ok)
        setMotionChk(true)
      })()
    }
  }, [motionChk])

  useEffect(() => {
    if (motionOK) window.addEventListener('deviceorientation', orient)
    return () => window.removeEventListener('deviceorientation', orient)
  }, [motionOK, orient])

  useEffect(() => {
    window.addEventListener('mousemove', pointer)
    window.addEventListener('touchmove', pointer)
    return () => {
      window.removeEventListener('mousemove', pointer)
      window.removeEventListener('touchmove', pointer)
    }
  }, [play, pointer])

  useEffect(() => { if (play) update() }, [wave, play, update])

  useEffect(() => {
    const resume = () => ctx.current?.resume()
    window.addEventListener('touchstart', resume)
    window.addEventListener('click', resume)
    return () => {
      window.removeEventListener('touchstart', resume)
      window.removeEventListener('click', resume)
    }
  }, [])

  return (
    <>
      <div className="note-frequency-display">
        <h1><strong>{note(p)}</strong></h1>
        <sup>{p.toFixed(2)} Hz</sup>
        <select
          title="waveforms"
          id="waveform-select"
          value={wave}
          onChange={e => { toggle(true); setWave(e.target.value as typeof wave) }}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
        </select>
        {!motionOK && (
          <button
            type="button"
            className="button button--permission"
            onClick={() => setMotionChk(false)}
          >
            Motion
          </button>
        )}
        <button
          type="button"
          className={`button ${play ? 'button--stop' : 'button--start'}`}
          onClick={() => toggle()}
        >
          {play ? 'Stop' : 'Play'}
        </button>
      </div>
    </>
  )
}
