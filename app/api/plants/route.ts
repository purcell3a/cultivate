import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { searchTrefle, fetchTrefleDetails, parseTrefleData, cachePlant } from '@/lib/trefle-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('search');
    const zone = searchParams.get('zone');
    const nativeRegion = searchParams.get('native_region');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build database query
    let conditions = [];
    let params: any[] = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      conditions.push(`(
        name ILIKE $${paramCount} OR 
        scientific_name ILIKE $${paramCount} OR
        $${paramCount} = ANY(common_names)
      )`);
      params.push(`%${query}%`);
    }

    if (zone) {
      paramCount++;
      conditions.push(`min_zone <= $${paramCount} AND max_zone >= $${paramCount}`);
      params.push(zone);
    }

    if (nativeRegion) {
      const regionCode = parseInt(nativeRegion);
      if (!isNaN(regionCode)) {
        paramCount++;
        conditions.push(`$${paramCount} = ANY(native_distributions)`);
        params.push(regionCode);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    paramCount++;

    // Search local database first
    params.push(limit);
    const localResults = await sql([`
      SELECT 
        id, trefle_id, name, scientific_name, common_names,
        family, genus, plant_type, min_zone, max_zone,
        native_distributions, image_url, description,
        is_edible, view_count
      FROM plants
      ${whereClause}
      ORDER BY view_count DESC, name
      LIMIT $${paramCount}
    `] as any as TemplateStringsArray, ...params);

    // If we have enough results from cache, return them
    if (localResults.length >= limit || !query) {
      return NextResponse.json({
        plants: localResults,
        count: localResults.length,
        source: 'cache',
      });
    }

    // Not enough local results - fetch from Trefle
    console.log(`🔍 Cache miss for "${query}", fetching from Trefle...`);
    
    const trefleResults = await searchTrefle(query);
    
    // Cache new plants in background (don't wait)
    const cachePromises = trefleResults.slice(0, 10).map(async (plant: any) => {
      // Check if already cached
      const existing = await sql`
        SELECT id FROM plants WHERE trefle_id = ${plant.id} LIMIT 1
      `;
      
      if (existing.length === 0) {
        // Fetch details and cache
        const details = await fetchTrefleDetails(plant.id);
        if (details) {
          const plantData = parseTrefleData(details);
          await cachePlant(plantData);
        }
      }
    });

    // Wait for caching to complete
    await Promise.all(cachePromises);

    // Re-query database to get cached results
    const updatedResults = await sql(localQuery, params);
    // Re-query database to get cached results
    const updatedResults = await sql([`
      SELECT 
        id, trefle_id, name, scientific_name, common_names,
        family, genus, plant_type, min_zone, max_zone,
        native_distributions, image_url, description,
        is_edible, view_count
      FROM plants
      ${whereClause}
      ORDER BY view_count DESC, name
      LIMIT $${paramCount}
    `] as any as TemplateStringsArray, ...params);
      plants: updatedResults,
      count: updatedResults.length,
      source: 'trefle+cache',
    });

  } catch (error) {
    console.error('Plants API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}