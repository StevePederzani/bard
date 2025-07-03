export interface AppConfig {
  domain: string
  name: string
  subtitle: string
  description: string
  action: string
  category: string
  tags: readonly string[]
  screenshotCount: number
  screenshotSize: string
  heroSize: string
  iconSizes: readonly number[]
  themeColor: string
  socialLinks: Record<string, string>
  contactEmail: string
  founder: {
    name: string
    alternateName: string
    identifiers: readonly string[]
    sameAs: readonly string[]
    ethereumAddress: string
    foundingDate: string
  }
  erc20: {
    contract: string
    token: string
    symbol: string
    chain: string
    chainId: string
  }
  farcaster: {
    header: string
    payload: string
    signature: string
  }
}

export const siteConfig: AppConfig = {
  domain: process.env.NEXT_PUBLIC_DOMAIN!,
  name: process.env.NEXT_PUBLIC_NAME!,
  subtitle: process.env.NEXT_PUBLIC_SUBTITLE!,
  description: process.env.NEXT_PUBLIC_DESCRIPTION!,
  action: process.env.NEXT_PUBLIC_ACTION!,
  category: process.env.NEXT_PUBLIC_CATEGORY!,
  tags: process.env.NEXT_PUBLIC_TAGS!.split(','),
  screenshotCount: Number(process.env.NEXT_PUBLIC_SCREENSHOT_COUNT!),
  screenshotSize: process.env.NEXT_PUBLIC_SCREENSHOT_SIZE!,
  heroSize: process.env.NEXT_PUBLIC_HERO_SIZE!,
  iconSizes: process.env.NEXT_PUBLIC_ICON_SIZES!.split(',').map(Number),
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR!.replace(/"/g, ''),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL!,
  socialLinks: {
    farcaster: process.env.NEXT_PUBLIC_SOCIAL_FARCASTER!,
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK!,
    x: `https://x.com/${process.env.NEXT_PUBLIC_SOCIAL_X?.replace(/^@/, '')}`,
    discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD!,
  },
  founder: {
    name: process.env.NEXT_PUBLIC_FOUNDER_NAME!,
    alternateName: process.env.NEXT_PUBLIC_FOUNDER_ALTNAME!,
    identifiers: process.env.NEXT_PUBLIC_FOUNDER_IDENTIFIERS!.split(','),
    sameAs: process.env.NEXT_PUBLIC_FOUNDER_SAMEAS!.split(','),
    ethereumAddress: process.env.NEXT_PUBLIC_FOUNDER_ETH!,
    foundingDate: process.env.NEXT_PUBLIC_FOUNDER_DATE!,
  },
  erc20: {
    contract: process.env.NEXT_PUBLIC_ERC20_CONTRACT!,
    token: process.env.NEXT_PUBLIC_ERC20_TOKEN!,
    symbol: process.env.NEXT_PUBLIC_ERC20_SYMBOL!,
    chain: process.env.NEXT_PUBLIC_ERC20_CHAIN!,
    chainId: process.env.NEXT_PUBLIC_ERC20_CHAINID!,
  },
  farcaster: {
    header: process.env.NEXT_PUBLIC_FARCASTER_HEADER!,
    payload: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD!,
    signature: process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE!,
  },
}

const baseUrl = `https://${siteConfig.domain}`
const assetUrl = (path: string) => `${baseUrl}/assets/${path}`

const generateScreenshots = (count: number) =>
  Array.from({ length: count }, (_, i) => assetUrl(`screenshot_${i + 1}.png`))

const generateIcons = (sizes: readonly number[]) =>
  sizes.map(size => ({
    src: assetUrl(`${size}.png`),
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'any',
  }))

export const createAppConfig = () => {
  const screenshots = generateScreenshots(siteConfig.screenshotCount)
  const icons = generateIcons(siteConfig.iconSizes)

  return {
    meta: {
      viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: 'no',
        viewportFit: 'cover',
      },
      manifest: {
        scope: '/',
        start_url: '/',
        dir: 'ltr',
        lang: 'en-US',
        features: ['webgl', 'webgl2', 'webxr'],
        display: 'standalone',
        orientation: 'portrait-primary',
        name: siteConfig.name,
        short_name: siteConfig.subtitle,
        description: siteConfig.description,
        background_color: siteConfig.themeColor,
        theme_color: siteConfig.themeColor,
        categories: siteConfig.tags,
        icons,
        screenshots: screenshots.map(src => ({
          src,
          sizes: siteConfig.screenshotSize,
          type: 'image/png',
        })),
        shortcuts: [
          {
            name: siteConfig.name,
            short_name: siteConfig.subtitle,
            description: siteConfig.description,
            url: '/',
          },
        ],
        prefer_related_applications: false,
      },
      apple: {
        capable: 'yes',
        title: siteConfig.name,
        statusBarStyle: 'black-translucent',
        touchIcon: assetUrl('180.png'),
        splash: assetUrl('200.png'),
      },
      og: {
        type: 'website',
        locale: 'en_US',
        url: baseUrl,
        name: siteConfig.name,
        site_name: `${siteConfig.name}: ${siteConfig.subtitle}`,
        description: siteConfig.description,
        images: [
          {
            url: assetUrl('1280x630.png'),
            width: 1200,
            height: 630,
            alt: `${siteConfig.name}: ${siteConfig.subtitle}`,
          },
        ],
      },
      x: {
        card: 'summary_large_image',
        site: siteConfig.name,
        creator: `@${process.env.NEXT_PUBLIC_SOCIAL_X?.replace(/^@/, '')}`,
        title: siteConfig.subtitle,
        description: siteConfig.description,
        images: [assetUrl('1280x630.png'), ...screenshots],
      },
      canonical: baseUrl,
    },

    structuredData: {
      '@context': 'https://schema.org',
      '@type': ['SoftwareApplication', 'VideoGame', 'WebApplication'],
      '@id': baseUrl,
      name: siteConfig.name,
      url: baseUrl,
      description: siteConfig.description,
      applicationCategory: 'GameApplication',
      applicationSubCategory: 'InteractiveEntertainment',
      applicationSuite: 'Ozmium',
      applicationVersion: '1.0.0',
      softwareVersion: '1.0.0',
      operatingSystem: 'Web Browser',
      screenshot: screenshots.map(url => ({ '@type': 'ImageObject', url })),
      logo: { '@type': 'ImageObject', url: icons[0].src },
      playMode: 'SinglePlayer',
      gamePlatform: 'WebGL',
      potentialAction: {
        '@type': 'ViewAction',
        target: [
          {
            '@type': 'EntryPoint',
            urlTemplate: baseUrl,
            actionPlatform: [
              'http://schema.org/DesktopWebPlatform',
              'http://schema.org/WebApplication',
            ],
            application: {
              '@type': 'SoftwareApplication',
              name: siteConfig.name,
              operatingSystem: 'Web Browser',
            },
          },
        ],
      },
      erc20: {
        '@type': 'DigitalAsset',
        identifier: siteConfig.erc20.contract,
        name: siteConfig.erc20.token,
        tickerSymbol: siteConfig.erc20.symbol,
        network: siteConfig.erc20.chain,
        chainId: siteConfig.erc20.chainId,
        url: `https://basescan.org/token/${siteConfig.erc20.contract.split(':').pop()}`,
      },
      sameAs: Object.values(siteConfig.socialLinks),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: siteConfig.contactEmail,
        },
      ],
      founder: {
        '@type': 'Person',
        name: siteConfig.founder.name,
        alternateName: siteConfig.founder.alternateName,
        identifier: siteConfig.founder.identifiers,
        sameAs: siteConfig.founder.sameAs,
        ethereumAddress: siteConfig.founder.ethereumAddress,
        foundingDate: siteConfig.founder.foundingDate,
      },
    },

    farcaster: {
      accountAssociation: siteConfig.farcaster,
      frame: {
        version: '1',
        name: siteConfig.name,
        subtitle: siteConfig.subtitle,
        tagline: `${siteConfig.name}: ${siteConfig.subtitle}`,
        ogTitle: `${siteConfig.name}: ${siteConfig.subtitle}`,
        tags: siteConfig.tags,
        description: siteConfig.description,
        canonicalDomain: siteConfig.domain,
        primaryCategory: siteConfig.category,
        homeUrl: baseUrl,
        webhookUrl: `${baseUrl}/webhook`,
        castShareUrl: `${baseUrl}/share`,
        requiredChains: ['eip155:8453'],
        iconUrl: icons[0].src,
        ogImageUrl: assetUrl('1280x630.png'),
        heroImageUrl: assetUrl(`${siteConfig.heroSize}.webp`),
        screenshotUrls: screenshots,
        splashImageUrl: assetUrl('200.png'),
        splashBackgroundColor: siteConfig.themeColor,
      },
    },

    embed: {
      version: 'next',
      imageUrl: assetUrl(`${siteConfig.heroSize}.webp`),
      button: {
        title: siteConfig.action,
        action: {
          type: 'launch_frame',
          url: baseUrl,
          name: siteConfig.name,
          splashImageUrl: assetUrl('200.png'),
          splashBackgroundColor: siteConfig.themeColor,
        },
      },
    },
  }
}

export const { meta, structuredData, farcaster, embed } = createAppConfig()
