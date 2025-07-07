'use client'

import { useEffect } from 'react'
import { meta, structuredData, embed } from '@/lib/app'
import { Providers } from './config'

import '@/styles/globals.css'
import '@coinbase/onchainkit/styles.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const rc = (event: MouseEvent) => event.preventDefault()
    document.addEventListener('contextmenu', rc)
    return () => document.removeEventListener('contextmenu', rc)
  }, [])

  const { viewport, apple, og, x, canonical } = meta

  return (
    <html lang="en">
      <head>
        <title>{og.site_name}</title>
        <link rel="webmanifest" href="/manifest.webmanifest" />
        <link rel="canonical" href={canonical} />
        <link rel="icon" href={apple.touchIcon} sizes="16x16 32x32" type="image/x-icon" />
        <link rel="apple-touch-icon" href={apple.touchIcon} sizes="180x180" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

        <meta
          name="viewport"
          content={`width=${viewport.width}, initial-scale=${viewport.initialScale}, maximum-scale=${viewport.maximumScale}, user-scalable=${viewport.userScalable}, viewport-fit=${viewport.viewportFit}`}
        />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content={apple.capable} />
        <meta name="apple-mobile-web-app-title" content={apple.title} />
        <meta name="apple-mobile-web-app-status-bar-style" content={apple.statusBarStyle} />

        <meta property="og:type" content={og.type} />
        <meta property="og:site_name" content={og.site_name} />
        <meta property="og:title" content={og.name} />
        <meta property="og:description" content={og.description} />
        <meta property="og:image" content={og.images[0].url} />
        <meta property="og:image:alt" content={og.images[0].alt} />
        <meta property="og:image:width" content={`${og.images[0].width}`} />
        <meta property="og:image:height" content={`${og.images[0].height}`} />
        <meta property="og:url" content={og.url} />
        <meta property="og:locale" content={og.locale} />

        <meta name="twitter:card" content={x.card} />
        <meta name="twitter:site" content={x.site} />
        <meta name="twitter:creator" content={x.creator} />
        <meta name="twitter:title" content={x.title} />
        <meta name="twitter:description" content={x.description} />
        <meta name="twitter:image" content={x.images[0]} />

        <meta name="web3:contract" content={structuredData.founder.ethereumAddress} />
        <meta name="web3:token:name" content={structuredData.name} />
        <meta name="web3:token:symbol" content={structuredData.erc20.tickerSymbol} />

        <meta name="fc:frame" content={JSON.stringify(embed)} />
        <meta name="description" content={og.description} />
      </head>
      <body className="bh-background">
        <Providers>
          <div className="frame-wrapper">
            <div className="frame" />
            <div className="content">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
