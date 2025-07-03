'use client'

import { JSX, useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { usePrimaryButton } from '@coinbase/onchainkit/minikit'
import Theremin from './app'

export default function App(): JSX.Element {
  useEffect(() => {
    void (async () => {
      try {
        await sdk.actions.ready({ disableNativeGestures: true })
        await sdk.back.enableWebNavigation()
      } catch {}
    })()
  }, [])

  // Grab the code from app.ozmium for the drawer shelf menu for this.
  // I can probably just put all the buttons under here w/ context conditions for miniapps easier.
  usePrimaryButton(
    { text: '♪ → Share Bard' },
    async () => {
      await sdk.actions.composeCast({
        text: [
          '📲 Uhh, is Farcaster an instrument?',
          '🎵 Yes, yes it is now.',
          '',
          'Try Bard: The Theremini-App!',
        ].join('\n'),
        embeds: ['https://bard.ozmium.org']
      })
    }
  )
  return (<>
    <Theremin />
  </>);
}
