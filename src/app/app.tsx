'use client'
import { useEffect, useState, useRef, useCallback, JSX } from 'react'
import Image from 'next/image'
import sdk from '@farcaster/frame-sdk'
import Tips from '@/components/Tips'

const generatePianoFrequencies = (baseFrequency = 110, numNotes = 88) =>
  Array.from({ length: numNotes }, (_, i) => baseFrequency * Math.pow(2, i / 12))

// This will be updated with the new touchscreen code later to be 88 keys and allow touch-bend of pitches.
// Had to remove Vibe vizualizer and "Wammy Bar" effects, they were breaking things ahhhg. :( Re-adding later.
const minFreq = 110
const maxFreq = 1760
const pianoFrequencies = generatePianoFrequencies()
const noteNames = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#']
const getNoteName = (frequency: number) => {
  if (!frequency) return '♪'
  const midi = Math.round(12 * Math.log2(frequency / 440) + 69)
  const name = noteNames[(midi + 3) % 12]
  return `${name}${Math.floor(midi / 12) - 1}`
}

export default function Theremin(): JSX.Element {
  const [isPlaying, setIsPlaying] = useState(false)
  const [pitch, setPitch] = useState(0)
  const prevPitch = useRef(0)
  const [waveform, setWaveform] = useState<'sine'|'square'|'triangle'|'sawtooth'>('sine')
  const audioContextRef = useRef<AudioContext|null>(null)
  const oscillatorRef = useRef<OscillatorNode|null>(null)
  const gainRef = useRef<GainNode|null>(null)
  const vibratoRef = useRef<OscillatorNode|null>(null)
  const [motionSupported, setMotionSupported] = useState(false)
  const [motionChecked, setMotionChecked] = useState(false)
  const volume = 0.05

  const lerp = useCallback((a: number, b: number, t: number) => a + (b - a) * t, [])
  const getClosest = useCallback((f: number) =>
    pianoFrequencies.reduce((p,c) => Math.abs(c - f) < Math.abs(p - f) ? c : p)
  , [])

  const handleOrientation = useCallback(async (e: DeviceOrientationEvent) => {
    const { beta, gamma } = e
    if (beta == null || gamma == null) return
    const t = minFreq + (maxFreq - minFreq) * (Math.max(0, Math.min(135, beta)) / 135)
    const closest = getClosest(t)
    if (oscillatorRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime
      const v = lerp(oscillatorRef.current.frequency.value, closest, 0.05)
      oscillatorRef.current.frequency.setValueAtTime(v, now)
    }
    const speed = Math.abs(Math.sin((gamma/135) * Math.PI)) * 8
    vibratoRef.current?.frequency.setValueAtTime(speed, audioContextRef.current?.currentTime||0)
    if (Math.abs(closest - prevPitch.current) > 0.5) {
      prevPitch.current = closest
      setPitch(closest)
      await sdk.haptics.selectionChanged()
    }
  }, [getClosest, lerp])

  const handleMove = useCallback((x: number, y: number) => {
    if (!audioContextRef.current) return
    const f = getClosest(minFreq + (maxFreq - minFreq) * (1 - y / window.innerHeight))
    const now = audioContextRef.current.currentTime
    const v = lerp(oscillatorRef.current!.frequency.value, f, 0.12)
    oscillatorRef.current!.frequency.setValueAtTime(v, now)
    if (Math.abs(f - prevPitch.current) > 0.5) {
      prevPitch.current = f
      setPitch(f)
      sdk.haptics.selectionChanged()
    }
  }, [getClosest, lerp])

  const handlePointer = useCallback((e: MouseEvent|TouchEvent) => {
    if (!isPlaying) return
    if (audioContextRef.current && audioContextRef.current.state !== 'running') audioContextRef.current.resume()
    let x=0,y=0
    if ('touches' in e && e.touches[0]) { x=e.touches[0].clientX; y=e.touches[0].clientY }
    else if ('clientX' in e) { x=e.clientX; y=e.clientY }
    handleMove(x,y)
  }, [isPlaying, handleMove])

  const updateSettings = useCallback(() => {
    if (!oscillatorRef.current || !gainRef.current) return
    let mult = volume
    if (waveform==='triangle') mult *= 0.5
    if (waveform==='square'||waveform==='sawtooth') mult *= 0.25
    gainRef.current.gain.setValueAtTime(mult, audioContextRef.current?.currentTime||0)
    oscillatorRef.current.type = waveform
  }, [waveform])

  const initAudio = useCallback(async () => {
    const ctx = audioContextRef.current ||= new AudioContext()
    if (ctx.state !== 'running') await ctx.resume()
    oscillatorRef.current?.disconnect()
    gainRef.current?.disconnect()
    vibratoRef.current?.disconnect()
    oscillatorRef.current = ctx.createOscillator()
    gainRef.current = ctx.createGain()
    vibratoRef.current = ctx.createOscillator()
    oscillatorRef.current.type = waveform
    oscillatorRef.current.frequency.setValueAtTime(pitch, ctx.currentTime)
    gainRef.current.gain.setValueAtTime(volume, ctx.currentTime)
    vibratoRef.current.type = 'sine'
    vibratoRef.current.frequency.setValueAtTime(5, ctx.currentTime)
    const vg = ctx.createGain()
    vg.gain.setValueAtTime(30, ctx.currentTime)
    vibratoRef.current.connect(vg)
    vg.connect(oscillatorRef.current.frequency)
    oscillatorRef.current.connect(gainRef.current)
    gainRef.current.connect(ctx.destination)
    oscillatorRef.current.start()
    vibratoRef.current.start()
    gainRef.current.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.4)
    updateSettings()
  }, [waveform, pitch, updateSettings])

  const stopAudio = useCallback(() => {
    if (!oscillatorRef.current||!gainRef.current) return
    const now = audioContextRef.current!.currentTime
    gainRef.current.gain.cancelScheduledValues(now)
    gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now)
    gainRef.current.gain.linearRampToValueAtTime(0, now + 0.4)
    setTimeout(()=>{
      oscillatorRef.current?.stop()
      vibratoRef.current?.stop()
      oscillatorRef.current?.disconnect()
      vibratoRef.current?.disconnect()
      gainRef.current?.disconnect()
    },450)
  },[])

  const toggle = useCallback(
    async (forceStop = false) => {
      if (isPlaying || forceStop) {
        stopAudio()
        setIsPlaying(false)
      } else {
        await initAudio()
        setIsPlaying(true)
      }
    },
    [isPlaying, initAudio, stopAudio]
  )

  useEffect(()=>{
    if (!motionChecked) {
      ;(async()=>{
        let ok=false
        if ('DeviceMotionEvent' in window && 'requestPermission' in DeviceMotionEvent) {
          try { ok = (await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission())==='granted' }catch{}
        } else ok = true
        setMotionSupported(ok)
        setMotionChecked(true)
      })()
    }
  },[motionChecked])

  useEffect(()=>{
    if (motionSupported) window.addEventListener('deviceorientation', handleOrientation)
    return ()=>window.removeEventListener('deviceorientation', handleOrientation)
  },[motionSupported, handleOrientation])

  useEffect(()=>{
    window.addEventListener('mousemove', handlePointer)
    window.addEventListener('touchmove', handlePointer)
    return ()=>{
      window.removeEventListener('mousemove', handlePointer)
      window.removeEventListener('touchmove', handlePointer)
    }
  },[isPlaying, handlePointer])

  useEffect(()=>{ if (isPlaying) updateSettings() },[waveform, isPlaying, updateSettings])

  useEffect(()=>{
    const resumeOnGesture = () => audioContextRef.current?.resume()
    window.addEventListener('touchstart', resumeOnGesture)
    window.addEventListener('click', resumeOnGesture)
    return ()=>{
      window.removeEventListener('touchstart', resumeOnGesture)
      window.removeEventListener('click', resumeOnGesture)
    }
  },[])

  const handleSwap = useCallback(async () => {
    await sdk.actions.swapToken({
      sellToken: 'eip155:8453/native',
      buyToken: 'eip155:8453/erc20:0x148313DCDb7A7111EBEFA4871F6A7fef34833B07',
      sellAmount: '1000000000000000' // === 0.001 ETH
    })
  }, [])

  return (
    <>
      <div className="swap-wrapper">
        <button type="button" className="swap-button" onClick={handleSwap}>
          <span className="sr-only">Swap ETH to OZ</span>
          <Image
            src="/assets/ozmium.gif"
            alt="Swap to Ozmium"
            className="swap-image"
            width={96}
            height={96}
          />
        </button>
      </div>

      <div className="note-frequency-display">
        <h1><strong>{getNoteName(pitch)}</strong></h1>
        <sup>{pitch.toFixed(2)} Hz</sup><br/><br/>
        <label htmlFor="waveform-select"><strong>Waveform Selection</strong></label>
        <select
          id="waveform-select"
          value={waveform}
          onChange={e => {
            toggle(true)
            setWaveform(e.target.value as 'sine' | 'square' | 'triangle' | 'sawtooth')
          }}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
        </select>
        <button type="button" className={`button ${isPlaying?'button--stop':'button--start'}`} onClick={() => toggle()}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <button type="button" className="button button--permission" onClick={()=>setMotionChecked(false)}>
          Check Motion
        </button>
        {/* Eventually swap this in/out with SDK context detection. */}
        <label htmlFor="waveform-select"><strong>Mini-App Buttons</strong></label>
      </div>

      <div className="permission-buttons">
        <button type="button" className="button button--permission" onClick={()=>sdk.actions.addMiniApp()}>
          Add Mini-App
        </button>

        <button type="button" className="button button--permission" onClick={()=>          
            sdk.actions.composeCast({
              text: [
                '📲 Uhh, is Farcaster an instrument?',
                '🎵 Yes, yes it is now.',
                '',
                'Try Bard: The Theremini-App!',
                ].join('\n'),
              embeds: ['https://bard.ozmium.org']
            })      
          }>
          Share a Cast
        </button>

        <button type="button" className="button button--permission" onClick={()=>sdk.actions.viewCast({hash: "0xf7ec571744d1449bd38f75a95200ac1bd68cb68e"})}>
          Andhakara Hype
        </button>

        <button
          type="button"
          className="button button--permission"
          onClick={() =>
            sdk.actions.openUrl(
              'https://www.clanker.world/clanker/0x148313DCDb7A7111EBEFA4871F6A7fef34833B07'
            )
          }
        >
          Ozmium<sub>$OZ </sub>Clanker
        </button>

        <button type="button" className="button button--permission" onClick={()=>sdk.actions.viewToken({token: "eip155:8453/erc20:0x148313DCDb7A7111EBEFA4871F6A7fef34833B07"})}>
          View OZ Token
        </button>

        <button type="button" className="button button--permission" onClick={()=>sdk.actions.viewProfile({fid: 938091})}>
          ozmium.eth
        </button>
      </div>

      <div className="inputData">
        <br/>
        <strong>❓ Having trouble making some noise?</strong><br />
        • Check that your ringer isn{"'"}t off.<br />
        • When in doubt try a hard restart.<br />
        • Yes, more stuff is coming-- soon!<br/><br />
      </div>

      <Tips />

    </>
  )
}
