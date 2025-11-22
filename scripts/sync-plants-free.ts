import { sql } from '@/lib/db';
import axios from 'axios';

const TREFLE_API_KEY = process.env.TREFLE_API_KEY;
const TREFLE_BASE_URL = 'https://trefle.io/api/v1';
const OPENFARM_BASE_URL = 'https://openfarm.cc/api/v1';

// ============================================
// TREFLE.IO INTEGRATION
// ============================================

interface TreflePlant {
  id: number;
  slug: string;
  common_name: string;
  scientific_name: string;
  family_common_name?: string;
  image_url?: string;
  year?: number;
}

async function fetchTreflePlants(page = 1): Promise<TreflePlant[]> {
  try {
    const response = await axios.get(`${TREFLE_BASE_URL}/plants`, {
      params: {
        token: TREFLE_API_KEY,
        page,
        filter_not: { common_name: 'null' }, // Only plants with common names
      },
      timeout: 10000,
    });

    console.log(`✓ Trefle: Fetched page ${page} (${response.data.data.length} plants)`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching Trefle page ${page}:`, error);
    return [];
  }
}

async function fetchTrefleDetails(plantId: number) {
  try {
    const response = await axios.get(`${TREFLE_BASE_URL}/plants/${plantId}`, {
      params: { token: TREFLE_API_KEY },
      timeout: 10000,
    });
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching Trefle details for ${plantId}:`, error);
    return null;
  }
}

// ============================================
// OPENFARM INTEGRATION
// ============================================

async function searchOpenFarm(plantName: string) {
  try {
    const response = await axios.get(`${OPENFARM_BASE_URL}/crops`, {
      params: { filter: plantName },
      timeout: 10000,
    });
    
    return response.data.data[0]; // Return first match
  } catch (error) {
    console.error(`Error searching OpenFarm for ${plantName}:`, error);
    return null;
  }
}

async function fetchOpenFarmDetails(cropSlug: string) {
  try {
    const response = await axios.get(`${OPENFARM_BASE_URL}/crops/${cropSlug}`, {
      timeout: 10000,
    });
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching OpenFarm details for ${cropSlug}:`, error);
    return null;
  }
}

// ============================================
// DATA MAPPING & MERGING
// ============================================

function extractZonesFromTrefle(growth: any): { min: string; max: string } {
  // Trefle provides temperature ranges, map to USDA zones
  if (!growth || !growth.minimum_temperature) {
    return { min: '3a', max: '11a' };
  }
  
  const minTemp = growth.minimum_temperature.deg_f;
  
  // Map temperature to USDA zones (simplified)
  if (minTemp >= 40) return { min: '10a', max: '13b' };
  if (minTemp >= 30) return { min: '9a', max: '11b' };
  if (minTemp >= 20) return { min: '8a', max: '10b' };
  if (minTemp >= 10) return { min: '7a', max: '9b' };
  if (minTemp >= 0) return { min: '6a', max: '8b' };
  if (minTemp >= -10) return { min: '5a', max: '7b' };
  if (minTemp >= -20) return { min: '4a', max: '6b' };
  
  return { min: '3a', max: '11a' };
}

function mapTrefleToDb(trefle: any, openfarm: any = null) {
  const zones = extractZonesFromTrefle(trefle.main_species?.growth);
  
  // Merge data from both sources
  const data: any = {
    trefle_id: trefle.id,
    trefle_slug: trefle.slug,
    name: trefle.common_name || trefle.scientific_name,
    scientific_name: trefle.scientific_name,
    common_names: trefle.synonyms?.map((s: any) => s.name) || [],
    family: trefle.family_common_name,
    genus: trefle.genus,
    min_zone: zones.min,
    max_zone: zones.max,
    image_url: trefle.image_url,
    data_sources: { trefle: true },
    license: 'CC BY-SA 4.0', // Trefle license
  };

  // Add growth data from Trefle
  if (trefle.main_species?.growth) {
    const growth = trefle.main_species.growth;
    data.sun_requirement = [growth.light?.toString() || 'full_sun'];
    data.water_needs = growth.atmospheric_humidity?.toString() || 'moderate';
    data.soil_ph_min = growth.soil_ph_minimum;
    data.soil_ph_max = growth.soil_ph_maximum;
    data.mature_height_min = growth.minimum_height_cm;
    data.mature_height_max = growth.maximum_height_cm;
    data.description = growth.description;
  }

  // Enrich with OpenFarm data if available
  if (openfarm) {
    data.openfarm_slug = openfarm.attributes.slug;
    data.is_edible = true; // OpenFarm is primarily edibles
    data.days_to_maturity = openfarm.attributes.growing_degree_days;
    data.description = data.description || openfarm.attributes.description;
    data.data_sources.openfarm = true;
    
    // Companion planting from OpenFarm
    if (openfarm.attributes.companions) {
      data.companion_plants = openfarm.attributes.companions;
    }
  }

  return data;
}

// ============================================
// DATABASE SYNC
// ============================================

async function logSync(type: string, apiSource: string, status: string, message: string, recordsSynced = 0) {
  await sql`
    INSERT INTO sync_logs (sync_type, api_source, status, message, records_synced)
    VALUES (${type}, ${apiSource}, ${status}, ${message}, ${recordsSynced})
  `;
}

async function syncPlantToDb(plantData: any) {
  try {
    await sql`
      INSERT INTO plants (
        trefle_id, trefle_slug, openfarm_slug,
        name, scientific_name, common_names, family, genus,
        plant_type, is_edible, min_zone, max_zone,
        sun_requirement, water_needs, soil_ph_min, soil_ph_max,
        mature_height_min, mature_height_max,
        description, image_url, data_sources, license, last_synced
      ) VALUES (
        ${plantData.trefle_id},
        ${plantData.trefle_slug},
        ${plantData.openfarm_slug || null},
        ${plantData.name},
        ${plantData.scientific_name},
        ${plantData.common_names},
        ${plantData.family || null},
        ${plantData.genus || null},
        ${plantData.plant_type || 'unknown'},
        ${plantData.is_edible || false},
        ${plantData.min_zone},
        ${plantData.max_zone},
        ${plantData.sun_requirement || []},
        ${plantData.water_needs || 'moderate'},
        ${plantData.soil_ph_min || null},
        ${plantData.soil_ph_max || null},
        ${plantData.mature_height_min || null},
        ${plantData.mature_height_max || null},
        ${plantData.description || null},
        ${plantData.image_url || null},
        ${plantData.data_sources},
        ${plantData.license},
        ${new Date()}
      )
      ON CONFLICT (trefle_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        image_url = COALESCE(EXCLUDED.image_url, plants.image_url),
        data_sources = EXCLUDED.data_sources,
        last_synced = EXCLUDED.last_synced,
        sync_count = plants.sync_count + 1
    `;
    
    return true;
  } catch (error) {
    console.error('Error syncing plant to DB:', error);
    return false;
  }
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

async function runSync() {
  console.log('🌱 Starting FREE plant sync (Trefle + OpenFarm)...\n');
  await logSync('plants', 'trefle', 'started', 'Beginning sync');
  
  let totalSynced = 0;
  let totalErrors = 0;
  const maxPages = 20; // Trefle free tier allows 120 requests/min
  
  try {
    for (let page = 1; page <= maxPages; page++) {
      console.log(`\n📄 Page ${page}/${maxPages}`);
      const plants = await fetchTreflePlants(page);
      
      if (plants.length === 0) break;
      
      for (const plant of plants) {
        try {
          // Get detailed Trefle data
          const trefleDetails = await fetchTrefleDetails(plant.id);
          
          if (!trefleDetails) continue;
          
          // Try to enrich with OpenFarm data (for edibles)
          let openfarmData = null;
          if (plant.common_name) {
            openfarmData = await searchOpenFarm(plant.common_name);
            if (openfarmData) {
              const slug = openfarmData.attributes.slug;
              openfarmData = await fetchOpenFarmDetails(slug);
            }
          }
          
          // Merge and sync
          const plantData = mapTrefleToDb(trefleDetails, openfarmData);
          const success = await syncPlantToDb(plantData);
          
          if (success) {
            totalSynced++;
            const sources = openfarmData ? '(Trefle + OpenFarm)' : '(Trefle)';
            console.log(`  ✓ ${plantData.name} ${sources}`);
          } else {
            totalErrors++;
          }
          
          // Rate limiting: 120 req/min = 2 req/sec
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          totalErrors++;
          console.error(`  ✗ Error:`, error);
        }
      }
      
      // Delay between pages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await logSync('plants', 'trefle+openfarm', 'completed', 
      `Synced ${totalSynced} plants`, totalSynced);
    console.log(`\n✅ Sync complete! ${totalSynced} plants, ${totalErrors} errors`);
    
  } catch (error) {
    await logSync('plants', 'trefle', 'failed', 
      error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Sync failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runSync()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runSync };
