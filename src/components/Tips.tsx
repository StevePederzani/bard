'use client'

import { JSX, useCallback } from 'react'
import Image from 'next/image'
import { sdk } from '@farcaster/frame-sdk'
import '@/styles/tips.css'

export default function Tips(): JSX.Element {
  const handleDonate = useCallback(async () => {
    await sdk.actions.sendToken({
      token: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: '20000', // 2 USDC (6 decimals)
      recipientFid: 938091
    })
  }, [])

  return (
    <div className="tips-container">
      <div>
        <button type="button" className="tips-button" onClick={handleDonate}>
          <span className="sr-only">Donate</span>
          <Image
            src="/assets/tips.png"
            alt="Donate Banner"
            className="tips-image"
            width={512}
            height={512}
          />
        </button>
      </div>
    </div>
  )
}