import { Buy } from '@coinbase/onchainkit/buy'; 
import type { Token } from '@coinbase/onchainkit/token';
export default function BuyModule() { 
  const ozToken: Token = {
    name: 'Ozmium',
    address: '0x148313DCDb7A7111EBEFA4871F6A7fef34833B07',
    symbol: 'OZ',
    decimals: 18,
    image:
    'https://app.ozmium.org/logo.png',
    chainId: 8453,
  };
  return ( 
    <Buy toToken={ozToken}/> 
  ) 
} 