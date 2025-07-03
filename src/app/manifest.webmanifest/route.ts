import { meta } from '../../lib/site'
export const runtime = 'edge'
export async function GET() {
  return new Response(JSON.stringify(meta.manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
