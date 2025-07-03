'use client'

import React, { useEffect } from 'react'
import { WagmiProvider, createConfig, cookieStorage, createStorage, http, useConnect } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { MiniKitProvider } from '@coinbase/onchainkit/minikit'
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'
import { coinbaseWallet, injected } from 'wagmi/connectors'
import { sdk } from '@farcaster/frame-sdk'
import { base } from 'wagmi/chains'
import { meta } from '../lib/site'
import '../styles/config.css'

const connectors = [
  miniAppConnector(),
  coinbaseWallet({ appName: meta.manifest.name, appLogoUrl: meta.manifest.icons[0]?.src }),
  injected()
]

const transports = { [base.id]: http() }

const wagmiConfig = createConfig({
  chains: [base],
  connectors,
  transports,
  storage: typeof window !== 'undefined' ? createStorage({ storage: cookieStorage }) : undefined,
  ssr: true
})

const queryClient = new QueryClient()

function AutoConnect() {
  const { connect, connectors, status } = useConnect()
  useEffect(() => {
    sdk.context.then(ctx => {
      if (ctx?.user?.fid) return
      const ua = navigator.userAgent
      const id = ua.includes('Farcaster') ? 'farcasterFrame' : ua.includes('CoinbaseWallet') ? 'coinbaseWallet' : 'injected'
      if (status === 'idle') connect({ connector: connectors.find(c => c.id === id)! })
    })
  }, [connect, connectors, status])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    (async () => {
      try {
        const caps = await sdk.getCapabilities()
        if (Array.isArray(caps) && caps.includes('back')) {
          sdk.back.enableWebNavigation()
        } else {
          sdk.back.disableWebNavigation()
        }
      } catch {
        sdk.back.disableWebNavigation()
      }
    })()
  }, [])
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          projectId={process.env.OCK_PID!}
          apiKey={process.env.OCK_KEY!}
          chain={base}
          config={{
            appearance: {
              name: meta.manifest.name,
              logo: meta.manifest.icons[0]?.src,
              mode: 'auto',
              theme: 'snake'
            }
          }}
        >
          <MiniKitProvider
            projectId={process.env.OCK_PID!}
            apiKey={process.env.OCK_KEY!}
            chain={base}
            config={{
              appearance: {
                name: meta.manifest.name,
                logo: meta.manifest.icons[0]?.src,
                mode: 'auto',
                theme: 'snake'
              }
            }}
          >
            <AutoConnect />
            {children}
          </MiniKitProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
