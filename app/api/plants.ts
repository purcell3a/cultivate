import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { zone, edible, nativeOnly } = await request.json();
    
    let result;
    
    if (edible !== undefined && nativeOnly) {
      result = await sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone} AND is_edible = ${edible} AND is_native = ${true}`;
    } else if (edible !== undefined) {
      result = await sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone} AND is_edible = ${edible}`;
    } else if (nativeOnly) {
      result = await sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone} AND is_native = ${true}`;
    } else {
      result = await sql`SELECT * FROM plants WHERE min_zone <= ${zone} AND max_zone >= ${zone}`;
    }
    
    return NextResponse.json({ plants: result });
    
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}
