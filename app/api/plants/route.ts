import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { zone, edible, nativeOnly } = await request.json();
    
    let query = sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone}`;
    
    if (edible !== undefined) {
      query = sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone} AND is_edible = ${edible}`;
    }
    
    if (nativeOnly) {
      if (edible !== undefined) {
        query = sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone} AND is_edible = ${edible} AND is_native = ${true}`;
      } else {
        query = sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone} AND is_native = ${true}`;
      }
    }
    
    const result = await query;
    
    return NextResponse.json({ plants: result });
    
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}