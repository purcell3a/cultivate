import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import axios from 'axios';

export const runtime = 'nodejs';

interface GeocodedAddress {
  full_address: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  lat: number;
  lng: number;
}

async function geocodeAddress(address: string): Promise<GeocodedAddress> {
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/geocode/json',
    {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY_SERVER,
      },
    }
  );

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error('Address not found');
  }

  const result = response.data.results[0];
  const location = result.geometry.location;
  
  const components = result.address_components;
  const addressData: GeocodedAddress = {
    full_address: result.formatted_address,
    lat: location.lat,
    lng: location.lng,
  };

  components.forEach((component: any) => {
    if (component.types.includes('street_number') || component.types.includes('route')) {
      addressData.street_address = addressData.street_address 
        ? `${addressData.street_address} ${component.long_name}`
        : component.long_name;
    }
    if (component.types.includes('locality')) {
      addressData.city = component.long_name;
    }
    if (component.types.includes('administrative_area_level_1')) {
      addressData.state = component.short_name;
    }
    if (component.types.includes('postal_code')) {
      addressData.zip_code = component.long_name;
    }
    if (component.types.includes('country')) {
      addressData.country = component.short_name;
    }
  });

  return addressData;
}

// Improved fallback using regional zones
function approximateZoneByLocation(lat: number, lng: number): string {
  // California and West Coast (warmer due to Pacific moderating effect)
  // California coast is roughly -124 to -114
  if (lng >= -124 && lng <= -114) {
    // Northern California
    if (lat >= 41) return '8b';
    if (lat >= 39) return '9a';
    if (lat >= 37) return '9b';
    // Central California (Bay Area, Central Valley)
    if (lat >= 35) return '9b';
    // Southern California (LA, San Diego)
    if (lat >= 34) return '10a';  // Glendale, Pasadena, LA
    if (lat >= 33) return '10b';  // Orange County
    if (lat >= 32) return '10b';  // San Diego
    return '11a'; // Imperial Valley
  }
  
  // Pacific Northwest (Washington, Oregon)
  if (lng < -114 && lat >= 42) {
    if (lat >= 48) return '8a';
    if (lat >= 45) return '8b';
    if (lat >= 42) return '9a';
    return '9a';
  }
  
  // Southwest Desert (AZ, NM, NV - hot summers, cold winters)
  if (lng >= -115 && lng <= -103 && lat >= 31 && lat <= 37) {
    if (lat >= 36) return '7a';
    if (lat >= 34) return '8a';
    if (lat >= 32) return '9a';
    return '9b';
  }
  
  // Mountain states (cold due to elevation - Rockies)
  if (lng >= -111 && lng <= -104 && lat >= 37) {
    if (lat >= 45) return '4a';
    if (lat >= 43) return '5a';
    if (lat >= 41) return '5b';
    if (lat >= 39) return '6a';
    return '6b';
  }
  
  // Deep South (TX, LA, MS, AL, GA, FL)
  if (lat <= 35 && lng >= -106) {
    if (lat >= 32) return '8b';
    if (lat >= 30) return '9a';
    if (lat >= 28) return '9b';
    if (lat >= 26) return '10a';
    if (lat >= 24) return '10b';
    return '11a';
  }
  
  // Southeast (warmer Atlantic coast)
  if (lat <= 37 && lng >= -90) {
    if (lat >= 36) return '7b';
    if (lat >= 34) return '8a';
    if (lat >= 32) return '8b';
    return '9a';
  }
  
  // Default: Eastern/Central US zones (more traditional cold-to-warm by latitude)
  if (lat >= 48) return '3a';
  if (lat >= 46) return '4a';
  if (lat >= 44) return '4b';
  if (lat >= 42) return '5a';
  if (lat >= 40) return '5b';
  if (lat >= 38) return '6a';
  if (lat >= 36) return '6b';
  if (lat >= 34) return '7a';
  return '7b';
}

async function getHardinessZoneFromUSDA(lat: number, lng: number): Promise<{ zone: string; method: string }> {
  // Try the working USDA endpoints
  const endpoints = [
    {
      url: `https://phzmapi.org/${lat}/${lng}.json`,
      parser: (data: any) => data.zone
    },
    {
      url: `https://gis.usna.usda.gov/arcgis/rest/services/USDA_Plant_Hardiness_Zones/MapServer/0/query`,
      parser: (data: any) => {
        if (data.features && data.features.length > 0) {
          return data.features[0].attributes.ZONE;
        }
        return null;
      }
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying USDA endpoint: ${endpoint.url.substring(0, 50)}...`);
      
      let response;
      if (endpoint.url.includes('arcgis')) {
        // ArcGIS REST API format
        response = await axios.get(endpoint.url, {
          params: {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'ZONE',
            returnGeometry: false,
            f: 'json'
          },
          timeout: 10000
        });
      } else {
        response = await axios.get(endpoint.url, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      }
      
      const zone = endpoint.parser(response.data);
      if (zone) {
        console.log('✓ Got zone from USDA:', zone);
        return { zone, method: 'usda_api' };
      }
    } catch (error) {
      console.log(`Failed to get zone from this endpoint:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }

  // Only use fallback if ALL USDA endpoints fail
  console.log('⚠️ All USDA endpoints failed, using geographic approximation');
  const approximateZone = approximateZoneByLocation(lat, lng);
  console.log(`✓ Approximate zone for (${lat}, ${lng}):`, approximateZone);
  return { zone: approximateZone, method: 'location_approx' };
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address or zip code is required' },
        { status: 400 }
      );
    }

    // Step 1: Geocode the address using Google Maps API
    const geocoded = await geocodeAddress(address);
    const { full_address, street_address, city, state, zip_code, country, lat, lng } = geocoded;

    console.log(`📍 Geocoded: "${address}" → (${lat}, ${lng})`);

    // Step 2: Check if we have this EXACT address in our database
    const existingAddress = await sql`
      SELECT zone_id, lat, lng, full_address, lookup_count
      FROM geocoded_addresses
      WHERE full_address = ${full_address}
      LIMIT 1
    `;

    if (existingAddress.length > 0) {
      console.log('✓ Found exact address in database (cached):', existingAddress[0].full_address);
      
      // Increment lookup count
      await sql`
        UPDATE geocoded_addresses
        SET lookup_count = lookup_count + 1
        WHERE full_address = ${full_address}
      `;
      
      return NextResponse.json({ 
        zone: existingAddress[0].zone_id,
        lat: existingAddress[0].lat,
        lng: existingAddress[0].lng,
        full_address: existingAddress[0].full_address,
        cached: true
      });
    }

    // Step 3: Not in database - get hardiness zone from USDA (or fallback)
    console.log('✗ Address not in cache, determining zone...');
    const { zone, method } = await getHardinessZoneFromUSDA(lat, lng);

    // Step 4: Store in database for future use
    await sql`
      INSERT INTO geocoded_addresses (
        full_address, 
        street_address, 
        city, 
        state, 
        zip_code, 
        country,
        location, 
        lat, 
        lng, 
        zone_id,
        zone_method
      )
      VALUES (
        ${full_address},
        ${street_address || null},
        ${city || null},
        ${state || null},
        ${zip_code || null},
        ${country || 'US'},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${lat},
        ${lng},
        ${zone},
        ${method}
      )
      ON CONFLICT (full_address) DO UPDATE SET
        lookup_count = geocoded_addresses.lookup_count + 1,
        updated_at = NOW()
    `;

    console.log(`✓ Stored: "${full_address}" → Zone ${zone} (${method})`);

    return NextResponse.json({ 
      zone,
      lat,
      lng,
      full_address,
      street_address,
      city,
      state,
      zip_code,
      cached: false,
      method
    });
  } catch (error) {
    console.error('Error fetching hardiness zone:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hardiness zone' },
      { status: 500 }
    );
  }
}
