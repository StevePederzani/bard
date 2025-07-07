'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { WagmiProvider, createConfig, cookieStorage, createStorage, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { MiniKitProvider, usePrimaryButton } from '@coinbase/onchainkit/minikit'
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'
import { coinbaseWallet, injected } from 'wagmi/connectors'
import { base } from 'wagmi/chains'
import { meta } from '../lib/site'
import sdk from '@farcaster/frame-sdk'

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

export function Providers({ children }: { children: React.ReactNode }) {

  // Menu Toggle
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen(!open);
  usePrimaryButton({
    text: open ? 'Close' : 'Menu',
  }, toggleMenu);
  
  // Adjust Menu
  const [, setMenuHeight] = useState(100);
  const menuRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const startDrag = (e: PointerEvent) => {
    const startY = e.clientY;
    const startHeight = menuRef.current?.getBoundingClientRect().height || 0;
    const onDrag = (moveEvent: PointerEvent) => {
      const newHeight = startHeight - (moveEvent.clientY - startY);
      if (menuRef.current) {
        requestAnimationFrame(() => {
          menuRef.current!.style.height = `${Math.max(newHeight, 90)}px`;
          setMenuHeight(newHeight);
        });
      }
    };
    const stopDrag = () => {
      document.removeEventListener('pointermove', onDrag);
      document.removeEventListener('pointerup', stopDrag);
    };
    document.addEventListener('pointermove', onDrag);
    document.addEventListener('pointerup', stopDrag);
  };
  useEffect(() => {
    const dragElement = dragRef.current;
    if (dragElement) { dragElement.addEventListener('pointerdown', startDrag) }
    return () => { if (dragElement) { dragElement.removeEventListener('pointerdown', startDrag) } }
  }, []);

  // ESC to Close Menu
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false) } };
    document.addEventListener('keydown', handleKeydown);
    return () => { document.removeEventListener('keydown', handleKeydown) };
  }, []);

  const handleSwap = useCallback(async () => {
    await sdk.actions.swapToken({
      sellToken: 'eip155:8453/native',
      buyToken: 'eip155:8453/erc20:0x148313DCDb7A7111EBEFA4871F6A7fef34833B07',
      sellAmount: '1000000000000000'
    })
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

            {children}
            <style jsx global>{`
              .menu,
              .menu * {
              font-family: monospace !important;
              }
            `}</style>
            <div ref={menuRef} className={`menu ${open ? 'open' : 'close'}`}>
              <div ref={dragRef} className="drag-handle" />              
              <div className="menu-main">
              <div className="menu-spacer" aria-hidden="true" />

              <div className="permission-buttons">

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


                <button
                  type="button"
                  className="button button--start"
                  onClick={async () =>
                  await sdk.actions.sendToken({
                    token: 'eip155:8453/native',
                    amount: '1000000000000000',
                    recipientAddress: "0xe5574554d6a4be5Ca39f22990492d756ebC4D6c3",
                    recipientFid: 938091,
                  })
                  }
                >toss a coin<br/>to your builder<br/>o wallet of plenty</button>

                <button type="button" className="button button--permission" onClick={()=>sdk.actions.addMiniApp()}>
                Add Mini-App
                </button>

                <button type="button" className="button button--permission" onClick={async () => {
                await sdk.actions.composeCast({
                  text: [
                  '📲 Uhh, is Farcaster an instrument?',
                  ' Yes, try Bard: The Theremini App 🎵'
                  ].join('\n'),
                  embeds: ['https://bard.ozmium.org']
                  })
                }}  
                >
                Share Bard
                </button>

                <button type="button" className="button button--permission" onClick={()=>sdk.actions.viewCast({hash: "0xf7ec571744d1449bd38f75a95200ac1bd68cb68e"})}>
                Andhakara
                </button>

                <button type="button" className="button button--permission" onClick={()=>sdk.actions.viewProfile({fid: 938091})}>
                Developer
                </button>        
              </div>          
              </div>
            </div>
          </MiniKitProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}