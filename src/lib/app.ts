
// Manually enter your config values here using data from bard.ozmium.org:
const NEXT_PUBLIC_DOMAIN = 'bard.ozmium.org'
const NEXT_PUBLIC_NAME = 'Bard'
const NEXT_PUBLIC_SUBTITLE = 'The Theremini App'
const NEXT_PUBLIC_DESCRIPTION = 'A theremin that uses your device to control audio and musical effects.'
const NEXT_PUBLIC_ACTION = '♪ Make Some Noise ♪'
const NEXT_PUBLIC_CATEGORY = 'Music'
const NEXT_PUBLIC_TAGS = 'music,theremin,synth,sound,oz'
const NEXT_PUBLIC_SCREENSHOT_COUNT = '3'
const NEXT_PUBLIC_SCREENSHOT_SIZE = '1280x720'
const NEXT_PUBLIC_HERO_SIZE = '1920x1080'
const NEXT_PUBLIC_ICON_SIZES = '64,128,180,192,512'
const NEXT_PUBLIC_THEME_COLOR = '#ef1dab'
const NEXT_PUBLIC_CONTACT_EMAIL = 'hello@ozmium.org'
const NEXT_PUBLIC_SOCIAL_FARCASTER = 'https://farcaster.xyz/~/channel/oz'
const NEXT_PUBLIC_SOCIAL_FACEBOOK = 'https://facebook.com/ozonchain'
const NEXT_PUBLIC_SOCIAL_X = '@ozonchain'
const NEXT_PUBLIC_SOCIAL_DISCORD = 'https://discord.gg/2eRQCF4cCE '
const NEXT_PUBLIC_FOUNDER_NAME = 'Steven M. Pederzani'
const NEXT_PUBLIC_FOUNDER_ALTNAME = 'Steve Pederzani'
const NEXT_PUBLIC_FOUNDER_IDENTIFIERS = 'pederzani,ozmium'
const NEXT_PUBLIC_FOUNDER_SAMEAS = 'https://x.com/ozonchain,https://farcaster.xyz/ozmium.eth'
const NEXT_PUBLIC_FOUNDER_ETH = '0xe5574554d6a4be5Ca39f22990492d756ebC4D6c3'
const NEXT_PUBLIC_FOUNDER_DATE = '2025-05-04'
const NEXT_PUBLIC_ERC20_CONTRACT = 'eip155:8453:0x148313DCDb7A7111EBEFA4871F6A7fef34833B07'
const NEXT_PUBLIC_ERC20_TOKEN = 'Ozmium'
const NEXT_PUBLIC_ERC20_SYMBOL = 'OZ'
const NEXT_PUBLIC_ERC20_CHAIN = 'Base'
const NEXT_PUBLIC_ERC20_CHAINID = '8453'

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
}

export const siteConfig: AppConfig = {
  domain: NEXT_PUBLIC_DOMAIN,
  name: NEXT_PUBLIC_NAME,
  subtitle: NEXT_PUBLIC_SUBTITLE,
  description: NEXT_PUBLIC_DESCRIPTION,
  action: NEXT_PUBLIC_ACTION,
  category: NEXT_PUBLIC_CATEGORY,
  tags: NEXT_PUBLIC_TAGS.split(','),
  screenshotCount: Number(NEXT_PUBLIC_SCREENSHOT_COUNT),
  screenshotSize: NEXT_PUBLIC_SCREENSHOT_SIZE,
  heroSize: NEXT_PUBLIC_HERO_SIZE,
  iconSizes: NEXT_PUBLIC_ICON_SIZES.split(',').map(Number),
  themeColor: NEXT_PUBLIC_THEME_COLOR.replace(/"/g, ''),
  contactEmail: NEXT_PUBLIC_CONTACT_EMAIL,
  socialLinks: {
    farcaster: NEXT_PUBLIC_SOCIAL_FARCASTER,
    facebook: NEXT_PUBLIC_SOCIAL_FACEBOOK,
    x: `https://x.com/${NEXT_PUBLIC_SOCIAL_X.replace(/^@/, '')}`,
    discord: NEXT_PUBLIC_SOCIAL_DISCORD,
  },
  founder: {
    name: NEXT_PUBLIC_FOUNDER_NAME,
    alternateName: NEXT_PUBLIC_FOUNDER_ALTNAME,
    identifiers: NEXT_PUBLIC_FOUNDER_IDENTIFIERS.split(','),
    sameAs: NEXT_PUBLIC_FOUNDER_SAMEAS.split(','),
    ethereumAddress: NEXT_PUBLIC_FOUNDER_ETH,
    foundingDate: NEXT_PUBLIC_FOUNDER_DATE,
  },
  erc20: {
    contract: NEXT_PUBLIC_ERC20_CONTRACT,
    token: NEXT_PUBLIC_ERC20_TOKEN,
    symbol: NEXT_PUBLIC_ERC20_SYMBOL,
    chain: NEXT_PUBLIC_ERC20_CHAIN,
    chainId: NEXT_PUBLIC_ERC20_CHAINID,
  }
}

const baseUrl = `https://${siteConfig.domain}`
const assetUrl = (path: string) => `${baseUrl}/${path}`

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
    embed: {
      version: 'next',
      imageUrl: assetUrl(`480x320.webp`),
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

export const { meta, structuredData, embed } = createAppConfig()
