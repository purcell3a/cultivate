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

    // Build query dynamically using Neon's tagged templates
    let localResults;

    if (query && zone && nativeRegion) {
      const regionCode = parseInt(nativeRegion);
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE (
          name ILIKE ${`%${query}%`} OR 
          scientific_name ILIKE ${`%${query}%`}
        )
        AND min_zone <= ${zone} AND max_zone >= ${zone}
        AND ${regionCode} = ANY(native_distributions)
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else if (query && zone) {
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE (
          name ILIKE ${`%${query}%`} OR 
          scientific_name ILIKE ${`%${query}%`}
        )
        AND min_zone <= ${zone} AND max_zone >= ${zone}
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else if (query && nativeRegion) {
      const regionCode = parseInt(nativeRegion);
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE (
          name ILIKE ${`%${query}%`} OR 
          scientific_name ILIKE ${`%${query}%`}
        )
        AND ${regionCode} = ANY(native_distributions)
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else if (zone && nativeRegion) {
      const regionCode = parseInt(nativeRegion);
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE min_zone <= ${zone} AND max_zone >= ${zone}
        AND ${regionCode} = ANY(native_distributions)
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else if (query) {
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE name ILIKE ${`%${query}%`} 
          OR scientific_name ILIKE ${`%${query}%`}
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else if (zone) {
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE min_zone <= ${zone} AND max_zone >= ${zone}
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else if (nativeRegion) {
      const regionCode = parseInt(nativeRegion);
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE ${regionCode} = ANY(native_distributions)
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else {
      // No filters - return popular plants
      localResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    }

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
    
    if (trefleResults.length === 0) {
      return NextResponse.json({
        plants: localResults,
        count: localResults.length,
        source: 'cache',
        message: 'No additional results found',
      });
    }

    // Cache new plants in background (don't wait for all)
    const cachePromises = trefleResults.slice(0, 10).map(async (plant: any) => {
      try {
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
      } catch (error) {
        console.error('Error caching plant:', plant.id, error);
      }
    });

    // Wait for caching to complete
    await Promise.all(cachePromises);

    // Re-query database to get newly cached results
    let updatedResults;
    if (query && zone) {
      updatedResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE (
          name ILIKE ${`%${query}%`} OR 
          scientific_name ILIKE ${`%${query}%`}
        )
        AND min_zone <= ${zone} AND max_zone >= ${zone}
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else if (query) {
      updatedResults = await sql`
        SELECT 
          id, trefle_id, name, scientific_name, common_names,
          family, genus, plant_type, min_zone, max_zone,
          native_distributions, image_url, description,
          is_edible, view_count
        FROM plants
        WHERE name ILIKE ${`%${query}%`} 
          OR scientific_name ILIKE ${`%${query}%`}
        ORDER BY view_count DESC, name
        LIMIT ${limit}
      `;
    } else {
      updatedResults = localResults;
    }

    return NextResponse.json({
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