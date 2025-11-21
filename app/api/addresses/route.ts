import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const addresses = await sql`
      SELECT 
        id,
        full_address,
        city,
        state,
        zip_code,
        zone_id,
        zone_method,
        lookup_count,
        created_at
      FROM geocoded_addresses
      ORDER BY lookup_count DESC, created_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}