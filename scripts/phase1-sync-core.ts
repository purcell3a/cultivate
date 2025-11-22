import { sql } from '@/lib/db';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const TREFLE_API_KEY = process.env.TREFLE_API_KEY;
const TREFLE_BASE_URL = 'https://trefle.io/api/v1';

const REQUESTS_PER_MINUTE = 60;
const DELAY_MS = 1000;
const MAX_RUNTIME_MINUTES = 55;

class FastRateLimiter {
  private lastRequest = 0;

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    if (elapsed < DELAY_MS) {
      await new Promise(r => setTimeout(r, DELAY_MS - elapsed));
    }
    this.lastRequest = Date.now();
  }
}

const limiter = new FastRateLimiter();

async function fetchPage(page: number) {
  await limiter.wait();
  
  try {
    const response = await axios.get(`${TREFLE_BASE_URL}/plants`, {
      params: {
        token: TREFLE_API_KEY,
        page,
      },
      timeout: 10000,
    });

    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log('⚠️  Rate limited, waiting 60s...');
      await new Promise(r => setTimeout(r, 60000));
      return fetchPage(page);
    }
    console.error('Error fetching page:', error.message);
    throw error;
  }
}

// Extract whatever Trefle gives us - don't transform
function extractDistributions(plant: any) {
  const native: number[] = [];
  const introduced: number[] = [];
  let rawData = null;

  // Trefle can return distributions in different formats
  // Just extract what's there
  
  if (plant.distributions) {
    rawData = plant.distributions;
    
    // Format 1: Object with native/introduced arrays
    if (plant.distributions.native) {
      const nativeData = Array.isArray(plant.distributions.native) 
        ? plant.distributions.native 
        : Object.keys(plant.distributions.native);
      
      nativeData.forEach((item: any) => {
        const code = parseInt(typeof item === 'object' ? item.tdwg_code : item);
        if (!isNaN(code)) native.push(code);
      });
    }
    
    if (plant.distributions.introduced) {
      const introducedData = Array.isArray(plant.distributions.introduced)
        ? plant.distributions.introduced
        : Object.keys(plant.distributions.introduced);
      
      introducedData.forEach((item: any) => {
        const code = parseInt(typeof item === 'object' ? item.tdwg_code : item);
        if (!isNaN(code)) introduced.push(code);
      });
    }
  }
  
  // Format 2: distribution_zones array
  if (plant.distribution_zones) {
    rawData = plant.distribution_zones;
    
    plant.distribution_zones.forEach((zone: any) => {
      const code = parseInt(zone.tdwg_code || zone.id);
      if (!isNaN(code)) {
        if (zone.establishment === 'native') {
          native.push(code);
        } else if (zone.establishment === 'introduced') {
          introduced.push(code);
        } else {
          native.push(code); // Default to native if unclear
        }
      }
    });
  }

  return {
    native: [...new Set(native)], // Remove duplicates
    introduced: [...new Set(introduced)],
    raw: rawData,
  };
}

// Extract zones exactly as Trefle provides them
function extractZones(plant: any): { min: string | null; max: string | null } {
  // Check main_species.growth
  if (plant.main_species?.growth?.hardiness_zones) {
    const zones = plant.main_species.growth.hardiness_zones;
    return { min: zones.min || null, max: zones.max || null };
  }
  
  // Check specifications
  if (plant.specifications?.hardiness_zones) {
    const zones = plant.specifications.hardiness_zones;
    return { min: zones.min || null, max: zones.max || null };
  }
  
  // Check for temperature-based zones
  if (plant.main_species?.growth?.minimum_temperature?.deg_f) {
    const minTemp = plant.main_species.growth.minimum_temperature.deg_f;
    
    // Simple temperature to zone mapping
    if (minTemp >= 40) return { min: '10a', max: null };
    if (minTemp >= 30) return { min: '9a', max: null };
    if (minTemp >= 20) return { min: '8a', max: null };
    if (minTemp >= 10) return { min: '7a', max: null };
    if (minTemp >= 0) return { min: '6a', max: null };
    if (minTemp >= -10) return { min: '5a', max: null };
    if (minTemp >= -20) return { min: '4a', max: null };
    if (minTemp >= -30) return { min: '3a', max: null };
    if (minTemp >= -40) return { min: '2a', max: null };
    return { min: '1a', max: null };
  }
  
  // No zone data available
  return { min: null, max: null };
}

async function savePlantCore(plant: any) {
  // Skip if no useful name
  if (!plant.common_name && !plant.scientific_name) {
    return false;
  }
  
  const distributions = extractDistributions(plant);
  const zones = extractZones(plant);
  
  try {
    await sql`
      INSERT INTO plants_core (
        trefle_id,
        trefle_slug,
        name,
        scientific_name,
        common_names,
        family,
        genus,
        min_zone,
        max_zone,
        native_distributions,
        introduced_distributions,
        distribution_raw
      ) VALUES (
        ${plant.id},
        ${plant.slug},
        ${plant.common_name || plant.scientific_name},
        ${plant.scientific_name},
        ${plant.synonyms || []},
        ${plant.family_common_name || null},
        ${plant.genus || null},
        ${zones.min},
        ${zones.max},
        ${distributions.native},
        ${distributions.introduced},
        ${distributions.raw}
      )
      ON CONFLICT (trefle_id) DO UPDATE SET
        name = EXCLUDED.name,
        scientific_name = EXCLUDED.scientific_name,
        common_names = EXCLUDED.common_names,
        min_zone = COALESCE(EXCLUDED.min_zone, plants_core.min_zone),
        max_zone = COALESCE(EXCLUDED.max_zone, plants_core.max_zone),
        native_distributions = EXCLUDED.native_distributions,
        introduced_distributions = EXCLUDED.introduced_distributions,
        distribution_raw = EXCLUDED.distribution_raw,
        last_synced = NOW()
    `;
    return true;
  } catch (error) {
    console.error('❌ Save error for plant', plant.id, ':', error);
    return false;
  }
}

async function getProgress() {
  const result = await sql`
    SELECT last_page, total_synced, is_complete 
    FROM sync_progress_simple 
    LIMIT 1
  `;
  return result[0] || { last_page: 0, total_synced: 0, is_complete: false };
}

async function updateProgress(page: number, count: number) {
  await sql`
    UPDATE sync_progress_simple
    SET last_page = ${page},
        total_synced = total_synced + ${count},
        last_run = NOW()
  `;
}

async function markComplete() {
  await sql`
    UPDATE sync_progress_simple
    SET is_complete = true
  `;
}

async function runPhase1Sync() {
  const startTime = Date.now();
  const maxRuntime = MAX_RUNTIME_MINUTES * 60 * 1000;
  
  console.log('🌍 PHASE 1: GLOBAL Plant Data Sync');
  console.log('===================================');
  console.log('Pulling ALL data directly from Trefle');
  console.log(`Rate: ${REQUESTS_PER_MINUTE} requests/min`);
  console.log(`Runtime: ${MAX_RUNTIME_MINUTES} minutes max\n`);

  const progress = await getProgress();
  let currentPage = progress.last_page + 1;
  let totalSynced = 0;
  let totalFailed = 0;
  let hasMore = true;

  console.log(`📍 Starting from page ${currentPage}`);
  console.log(`📊 Already synced: ${progress.total_synced} plants\n`);

  while (hasMore && (Date.now() - startTime) < maxRuntime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.floor((maxRuntime - (Date.now() - startTime)) / 1000);
    
    console.log(`📄 Page ${currentPage} [${elapsed}s elapsed / ${remaining}s left]`);

    try {
      const plants = await fetchPage(currentPage);
      
      if (plants.length === 0) {
        console.log('✅ No more pages - sync complete!');
        await markComplete();
        hasMore = false;
        break;
      }

      let pageSuccess = 0;
      let pageFailed = 0;
      
      for (const plant of plants) {
        if (await savePlantCore(plant)) {
          pageSuccess++;
          totalSynced++;
        } else {
          pageFailed++;
          totalFailed++;
        }
      }

      console.log(`   ✓ Saved ${pageSuccess}/${plants.length} plants (${pageFailed} failed)`);

      await updateProgress(currentPage, pageSuccess);
      currentPage++;

      if ((Date.now() - startTime) >= maxRuntime) {
        console.log('\n⏰ Time limit reached, stopping gracefully...');
        break;
      }
    } catch (error) {
      console.error(`❌ Error on page ${currentPage}:`, error);
      totalFailed += 20; // Assume ~20 plants per page failed
      currentPage++; // Skip this page and continue
    }
  }

  const duration = Math.floor((Date.now() - startTime) / 1000);
  const rate = duration > 0 ? (totalSynced / duration * 60).toFixed(0) : '0';
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Sync Run Summary');
  console.log('='.repeat(60));
  console.log(`✅ Plants synced: ${totalSynced}`);
  console.log(`❌ Plants failed: ${totalFailed}`);
  console.log(`📄 Pages processed: ${currentPage - progress.last_page - 1}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📈 Rate: ~${rate} plants/minute`);
  console.log('='.repeat(60));

  // Database stats
  const dbStats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE array_length(native_distributions, 1) > 0) as with_distributions,
      COUNT(*) FILTER (WHERE min_zone IS NOT NULL) as with_zones,
      COUNT(*) FILTER (WHERE enriched = true) as enriched
    FROM plants_core
  `;
  
  console.log('\n🌍 Database Stats:');
  console.log(`Total plants: ${dbStats[0].total}`);
  console.log(`With distribution data: ${dbStats[0].with_distributions}`);
  console.log(`With zone data: ${dbStats[0].with_zones}`);
  console.log(`Enriched: ${dbStats[0].enriched}`);
}

if (require.main === module) {
  runPhase1Sync()
    .then(() => {
      console.log('\n✅ Sync completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Sync failed:', err);
      process.exit(1);
    });
}

export { runPhase1Sync };
