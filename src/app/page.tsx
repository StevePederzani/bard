'use client'

import { JSX, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
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

return (<>
    <Theremin />
  </>);
}


