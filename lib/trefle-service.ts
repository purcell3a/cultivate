import axios from 'axios';
import { sql } from '@/lib/db';

const TREFLE_API_KEY = process.env.TREFLE_API_KEY;
const TREFLE_BASE_URL = 'https://trefle.io/api/v1';

interface TreflePlant {
  id: number;
  slug: string;
  common_name: string;
  scientific_name: string;

}

// Search Trefle API
export async function searchTrefle(query: string, page = 1) {
  console.log('🔍 Searching Trefle for:', query);
  console.log('🔑 API Key exists:', !!TREFLE_API_KEY);
  
  try {
    const response = await axios.get(`${TREFLE_BASE_URL}/plants/search`, {
      params: {
        token: TREFLE_API_KEY,
        q: query,
        page,
      },
      timeout: 10000,
    });
    
    console.log('✅ Trefle response:', response.data.data?.length, 'results');
    return response.data.data || [];
  } catch (error: any) {
    console.error('❌ Trefle search error:', error.response?.data || error.message);
    return [];
  }
}


// Get detailed plant data from Trefle
export async function fetchTrefleDetails(trefleId: number) {
  try {
    const response = await axios.get(`${TREFLE_BASE_URL}/plants/${trefleId}`, {
      params: { token: TREFLE_API_KEY },
      timeout: 10000,
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Trefle details error:', error);
    return null;
  }
}

// Parse Trefle data into our format
export function parseTrefleData(plant: any) {
  // Extract distributions
  const native: number[] = [];
  const introduced: number[] = [];
  
  if (plant.distributions) {
    if (Array.isArray(plant.distributions.native)) {
      plant.distributions.native.forEach((code: any) => {
        const parsed = parseInt(typeof code === 'object' ? code.tdwg_code : code);
        if (!isNaN(parsed)) native.push(parsed);
      });
    }
    if (Array.isArray(plant.distributions.introduced)) {
      plant.distributions.introduced.forEach((code: any) => {
        const parsed = parseInt(typeof code === 'object' ? code.tdwg_code : code);
        if (!isNaN(parsed)) introduced.push(parsed);
      });
    }
  }
  
  // Extract zones
  const growth = plant.main_species?.growth;
  const zones = growth?.hardiness_zones || { min: null, max: null };
  
  // Map temperature to zone if no direct zone data
  if (!zones.min && growth?.minimum_temperature?.deg_f) {
    const temp = growth.minimum_temperature.deg_f;
    if (temp >= 40) zones.min = '10a';
    else if (temp >= 30) zones.min = '9a';
    else if (temp >= 20) zones.min = '8a';
    else if (temp >= 10) zones.min = '7a';
    else if (temp >= 0) zones.min = '6a';
    else if (temp >= -10) zones.min = '5a';
    else zones.min = '4a';
  }
  
  return {
    trefle_id: plant.id,
    trefle_slug: plant.slug,
    name: plant.common_name || plant.scientific_name,
    scientific_name: plant.scientific_name,
    common_names: plant.synonyms?.map((s: any) => s.name) || [],
    family: plant.family_common_name || plant.family,
    genus: plant.genus,
    plant_type: plant.main_species?.type || 'unknown',
    min_zone: zones.min,
    max_zone: zones.max,
    native_distributions: native,
    introduced_distributions: introduced,
    sun_requirement: growth?.light ? [growth.light] : [],
    water_needs: growth?.atmospheric_humidity || 'moderate',
    soil_ph_min: growth?.soil_ph_minimum,
    soil_ph_max: growth?.soil_ph_maximum,
    mature_height_min: growth?.minimum_height?.cm,
    mature_height_max: growth?.maximum_height?.cm,
    description: growth?.description || plant.main_species?.specifications?.description,
    is_edible: plant.edible_part?.length > 0 || false,
    image_url: plant.image_url,
    trefle_data: plant, // Store full response
  };
}

// Cache plant in database
export async function cachePlant(plantData: any) {
  try {
    const result = await sql`
      INSERT INTO plants (
        trefle_id, trefle_slug, name, scientific_name, common_names,
        family, genus, plant_type, min_zone, max_zone,
        native_distributions, introduced_distributions,
        sun_requirement, water_needs, soil_ph_min, soil_ph_max,
        mature_height_min, mature_height_max,
        description, is_edible, image_url, thumbnail_url, trefle_data
      ) VALUES (
        ${plantData.trefle_id}, ${plantData.trefle_slug},
        ${plantData.name}, ${plantData.scientific_name}, ${plantData.common_names},
        ${plantData.family}, ${plantData.genus}, ${plantData.plant_type},
        ${plantData.min_zone}, ${plantData.max_zone},
        ${plantData.native_distributions}, ${plantData.introduced_distributions},
        ${plantData.sun_requirement}, ${plantData.water_needs},
        ${plantData.soil_ph_min}, ${plantData.soil_ph_max},
        ${plantData.mature_height_min}, ${plantData.mature_height_max},
        ${plantData.description}, ${plantData.is_edible},
        ${plantData.image_url}, ${plantData.image_url}, ${plantData.trefle_data}
      )
      ON CONFLICT (trefle_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        image_url = COALESCE(EXCLUDED.image_url, plants.image_url),
        updated_at = NOW()
      RETURNING id
    `;
    
    return result[0];
  } catch (error) {
    console.error('Cache plant error:', error);
    return null;
  }
}

// Track view
export async function incrementViewCount(plantId: number) {
  await sql`
    UPDATE plants
    SET view_count = view_count + 1,
        last_viewed = NOW()
    WHERE id = ${plantId}
  `;
}
