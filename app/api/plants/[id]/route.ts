import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { fetchTrefleDetails, parseTrefleData, cachePlant, incrementViewCount } from '@/lib/trefle-service';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plantId = parseInt(params.id);

    if (isNaN(plantId)) {
      return NextResponse.json({ error: 'Invalid plant ID' }, { status: 400 });
    }

    // Try to get from cache first
    const cached = await sql`
      SELECT * FROM plants WHERE id = ${plantId} LIMIT 1
    `;

    if (cached.length > 0) {
      // Track view
      await incrementViewCount(plantId);
      
      return NextResponse.json({
        plant: cached[0],
        source: 'cache',
      });
    }

    // Not in cache - this shouldn't happen often
    // but handle it gracefully
    return NextResponse.json(
      { error: 'Plant not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Plant details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plant details' },
      { status: 500 }
    );
  }
}