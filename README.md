# Hardiness Zone Retrieval System - Architecture Documentation

## Overview
We built a **smart caching system** that determines USDA Plant Hardiness Zones for any US address while minimizing API costs and maximizing reliability.

## System Architecture

### 3-Tier Retrieval Strategy
```
User Input (Address/Zip) 
    ↓
[1] Database Cache Check (instant, free)
    ↓ (if not found)
[2] Google Geocoding API (converts address → lat/lng)
    ↓
[3] USDA Hardiness Zone API (converts lat/lng → zone)
    ↓ (if USDA fails)
[4] Geographic Approximation Fallback
    ↓
Store in Database (cache for future)
```

### Key Components

#### 1. **Address Autocomplete** (`/api/address-autocomplete`)
- **Purpose**: Provide real-time address suggestions as user types
- **API Used**: Google Places Autocomplete API
- **Why**: Improves UX and ensures valid addresses
- **Cost**: ~$2.83 per 1,000 requests
- **Optimization**: 300ms debounce to reduce unnecessary calls

#### 2. **Geocoding** (within `/api/hardiness-zone`)
- **Purpose**: Convert human-readable address to precise GPS coordinates
- **API Used**: Google Maps Geocoding API
- **Input**: "123 Main St, City, State, Zip"
- **Output**: 
```json
  {
    "lat": 34.1622948,
    "lng": -118.2670635,
    "formatted_address": "123 Main St, City, State, Zip, USA",
    "city": "City",
    "state": "State",
    "zip_code": "12345"
  }
```
- **Cost**: ~$5 per 1,000 requests
- **Optimization**: Exact address matching in database prevents re-geocoding

#### 3. **Hardiness Zone Lookup** (within `/api/hardiness-zone`)
- **Primary API**: USDA Plant Hardiness Zone API (`phzmapi.org`)
- **Backup API**: USDA ArcGIS REST Service
- **Input**: GPS coordinates (lat, lng)
- **Output**: USDA Zone (e.g., "10a")
- **Cost**: Free (but unreliable)
- **Fallback**: Regional approximation algorithm when APIs fail

#### 4. **Database Caching** (PostgreSQL + PostGIS)
- **Table**: `geocoded_addresses`
- **Stores**:
  - Full address components (street, city, state, zip)
  - Exact GPS coordinates
  - Hardiness zone
  - Lookup method (API vs approximation)
  - Usage count for analytics
- **Performance**: Subsequent lookups are instant
- **Cost Savings**: After first lookup, $0 for repeat queries

## Database Schema
```sql
CREATE TABLE geocoded_addresses (
  id SERIAL PRIMARY KEY,
  full_address TEXT UNIQUE NOT NULL,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code VARCHAR(10),
  location GEOMETRY(Point, 4326) NOT NULL,  -- PostGIS spatial data
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  zone_id VARCHAR(10) NOT NULL,
  zone_method VARCHAR(50),  -- 'usda_api' or 'location_approx'
  lookup_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Cost Analysis

### Without Caching (Per 1,000 Requests)
- Autocomplete: $2.83
- Geocoding: $5.00
- USDA API: Free
- **Total: $7.83 per 1,000 lookups**

### With Our Caching System (After Initial Population)
- First lookup: $7.83
- Subsequent lookups: **$0.00** ✅
- **ROI**: 100% cost savings on repeat queries

### Real-World Scenario
If 1,000 users look up the same zip code:
- **Without caching**: $7,830
- **With caching**: $7.83
- **Savings**: $7,822.17 (99.9%)

## Reliability Features

### 1. **Multiple API Endpoints**
```typescript
const endpoints = [
  'https://phzmapi.org/{lat}/{lng}.json',           // Primary
  'https://gis.usna.usda.gov/arcgis/rest/...'      // Backup
];
```

### 2. **Intelligent Fallback Algorithm**
If all USDA APIs fail, uses regional approximation based on:
- Longitude (West Coast vs East Coast climate differences)
- Latitude (temperature gradients)
- Known climate zones (California coastal vs inland)

Example for Southern California coastal region:
```typescript
if (lng >= -124 && lng <= -114 && lat >= 34) {
  return '10a';  // Southern California coastal climate
}
```

### 3. **Error Handling**
- Timeouts (10 seconds)
- Graceful degradation
- Detailed logging for debugging
- User-friendly error messages

## API Requirements

### Environment Variables Needed
```env
GOOGLE_MAPS_API_KEY_SERVER=your_key_here
NEON_DATABASE_URL=postgresql://...
```

### Google Cloud Console Setup
1. Enable **Geocoding API**
2. Enable **Places API (Autocomplete)**
3. Restrict API key to these services only
4. Set up billing alerts
5. Add IP restrictions for production

---

# Instructions for Finding Plant Data APIs

Use this same architecture pattern for plant data. We need APIs that provide:

## Required Plant Data APIs

### Primary Needs
1. **Plant Database API** (Similar to USDA Hardiness Zone API)
   - Input: Plant name OR hardiness zone
   - Output: Complete plant information including:
     - Scientific name
     - Common names
     - USDA zones (min/max)
     - Sun requirements (full sun, partial shade, full shade)
     - Water needs (low, moderate, high)
     - Mature size (height/width)
     - Days to maturity
     - Planting seasons
     - Companion planting information
     - Care instructions
     - Images (high quality)

2. **Plant Image API** (Similar to Google Geocoding)
   - High-quality plant photos
   - Multiple angles if possible
   - Proper licensing for commercial use

### Desired Features
- **Free or low-cost** (like USDA API)
- **RESTful API** with JSON responses
- **No authentication preferred** OR simple API key
- **Reliable uptime** (99%+)
- **Comprehensive data** covering common garden plants
- **US-focused** hardiness zone data

### Nice to Have
- Companion planting database
- Pest/disease information
- Seasonal planting guides by zone
- Native plant indicators by region
- Edible/ornamental classification

## Example APIs to Research

Please find APIs similar to our hardiness zone setup:
- **Trefle.io** - Plant data API
- **Perenual** - Plant care API
- **USDA Plants Database** - Official government data
- **PictureThis API** - Plant identification
- **OpenFarm API** - Growing guides
- **Any other free/affordable plant databases**

## Evaluation Criteria

For each API found, document:
1. **Cost structure** (free tier, pricing)
2. **Rate limits** (requests per day/month)
3. **Data completeness** (what fields are available)
4. **Image availability** and licensing
5. **Reliability** (uptime, maintenance)
6. **Documentation quality**
7. **Authentication requirements**

## Our Implementation Plan

Once APIs are identified, we'll replicate the hardiness zone pattern:
```
User searches plant → Check database cache → API call (if needed) → Cache result → Display to user
```

**Goal**: Minimize API costs while providing comprehensive plant data for our users.
