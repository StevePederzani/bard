import { NextResponse } from 'next/server'
import { farcaster } from '../../../lib/site'
export const runtime = 'edge'
export async function GET() {
  return NextResponse.json(farcaster, {
    headers: { 'Content-Type': 'application/json' }
  })
}
