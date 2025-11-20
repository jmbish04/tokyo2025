/**
 * Auto-seeding script for Tokyo 2025 Travel Companion
 * Fetches venue data from Google Places API and populates D1 database
 */

interface GooglePlaceResult {
  place_id: string;
  name: string;
  types: string[];
  vicinity: string;
  rating?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
}

interface Venue {
  name: string;
  category: string;
  district: string;
  description: string;
  map_url: string;
  rating: number;
}

export class VenueSeeder {
  private apiKey: string;
  private db: D1Database;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(apiKey: string, db: D1Database) {
    this.apiKey = apiKey;
    this.db = db;
  }

  /**
   * Search for places using Google Places API
   */
  async searchPlaces(query: string, location: string, radius: number = 2000): Promise<GooglePlaceResult[]> {
    const url = new URL(`${this.baseUrl}/textsearch/json`);
    url.searchParams.set('query', query);
    url.searchParams.set('location', location);
    url.searchParams.set('radius', radius.toString());
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results || [];
  }

  /**
   * Get place details for more information
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/details/json`);
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,rating,formatted_address,types,geometry,editorial_summary,opening_hours,website');
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn(`Failed to get details for place ${placeId}: ${data.status}`);
      return null;
    }

    return data.result;
  }

  /**
   * Convert Google Places type to our category
   */
  private mapCategory(types: string[]): string {
    const categoryMap: Record<string, string> = {
      'shopping_mall': 'Shopping Mall',
      'department_store': 'Department Store',
      'clothing_store': 'Fashion Boutique',
      'jewelry_store': 'Jewelry & Luxury',
      'restaurant': 'Restaurant',
      'cafe': 'Cafe',
      'bar': 'Bar',
      'night_club': 'Nightlife',
      'tourist_attraction': 'Tourist Attraction',
      'museum': 'Museum',
      'art_gallery': 'Art Gallery',
      'park': 'Park',
      'spa': 'Spa & Wellness',
      'store': 'Shopping',
    };

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    return 'Venue';
  }

  /**
   * Extract district from address
   */
  private extractDistrict(vicinity: string, address?: string): string {
    const fullAddress = address || vicinity;

    // Common Tokyo districts
    const districts = [
      'Ginza', 'Shibuya', 'Shinjuku', 'Roppongi', 'Harajuku',
      'Asakusa', 'Akihabara', 'Ikebukuro', 'Ueno', 'Odaiba',
      'Chuo', 'Koto', 'Minato', 'Chiyoda'
    ];

    for (const district of districts) {
      if (fullAddress.includes(district)) {
        return district;
      }
    }

    // For Osaka
    const osakaDistricts = [
      'Namba', 'Umeda', 'Dotonbori', 'Shinsaibashi', 'Tennoji',
      'Osaka', 'Kita', 'Chuo', 'Minami'
    ];

    for (const district of osakaDistricts) {
      if (fullAddress.includes(district)) {
        return district;
      }
    }

    return 'Central';
  }

  /**
   * Convert Google Place to our Venue format
   */
  private async convertToVenue(place: GooglePlaceResult): Promise<Venue> {
    // Get detailed information
    const details = await this.getPlaceDetails(place.place_id);

    const description = details?.editorial_summary?.overview ||
                       `${place.name} - ${this.mapCategory(place.types)}`;

    const mapUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

    return {
      name: place.name,
      category: this.mapCategory(place.types),
      district: this.extractDistrict(place.vicinity, details?.formatted_address),
      description: description.substring(0, 500), // Limit length
      map_url: mapUrl,
      rating: place.rating || 0,
    };
  }

  /**
   * Insert venue into database
   */
  async insertVenue(venue: Venue): Promise<void> {
    // Check if venue already exists
    const existing = await this.db.prepare(
      'SELECT id FROM venues WHERE name = ? AND district = ?'
    ).bind(venue.name, venue.district).first();

    if (existing) {
      console.log(`Venue already exists: ${venue.name}`);
      return;
    }

    await this.db.prepare(
      'INSERT INTO venues (name, category, district, description, map_url, rating) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      venue.name,
      venue.category,
      venue.district,
      venue.description,
      venue.map_url,
      venue.rating
    ).run();

    console.log(`✅ Inserted: ${venue.name} (${venue.category}) in ${venue.district}`);
  }

  /**
   * Seed venues for a specific area
   */
  async seedArea(queries: string[], location: string, radius: number = 2000): Promise<number> {
    let totalInserted = 0;

    for (const query of queries) {
      console.log(`🔍 Searching: ${query}`);

      try {
        const places = await this.searchPlaces(query, location, radius);
        console.log(`Found ${places.length} places`);

        for (const place of places.slice(0, 5)) { // Limit to top 5 per query
          try {
            const venue = await this.convertToVenue(place);
            await this.insertVenue(venue);
            totalInserted++;

            // Rate limiting - wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error processing place ${place.name}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
      }
    }

    return totalInserted;
  }

  /**
   * Seed Ginza shopping area
   */
  async seedGinza(): Promise<number> {
    console.log('🏢 Seeding Ginza shopping area...');

    const ginzaLocation = '35.6717,139.7647'; // Ginza coordinates
    const queries = [
      'luxury shopping Ginza Tokyo',
      'department store Ginza',
      'designer boutique Ginza',
      'jewelry store Ginza',
      'high-end restaurant Ginza',
      'sushi restaurant Ginza',
      'Ginza shopping mall',
      'Ginza art gallery',
      'Ginza Six',
      'Mitsukoshi Ginza',
      'Ginza Wako',
      'Dover Street Market Ginza',
    ];

    return await this.seedArea(queries, ginzaLocation, 1500);
  }

  /**
   * Seed Osaka area
   */
  async seedOsaka(): Promise<number> {
    console.log('🏯 Seeding Osaka area...');

    const osakaLocation = '34.6937,135.5023'; // Osaka/Namba coordinates
    const queries = [
      'shopping Dotonbori Osaka',
      'restaurant Namba Osaka',
      'Shinsaibashi shopping',
      'Umeda department store',
      'takoyaki Dotonbori',
      'okonomiyaki Osaka',
      'Osaka Castle',
      'Kuromon Market Osaka',
      'nightlife Namba',
      'Osaka street food',
      'Amerikamura shopping',
      'Tennoji shopping',
    ];

    return await this.seedArea(queries, osakaLocation, 2000);
  }

  /**
   * Get venue statistics
   */
  async getStats(): Promise<any> {
    const total = await this.db.prepare('SELECT COUNT(*) as count FROM venues').first();
    const byCategory = await this.db.prepare(
      'SELECT category, COUNT(*) as count FROM venues GROUP BY category ORDER BY count DESC'
    ).all();
    const byDistrict = await this.db.prepare(
      'SELECT district, COUNT(*) as count FROM venues GROUP BY district ORDER BY count DESC'
    ).all();

    return {
      total: total?.count || 0,
      byCategory: byCategory.results,
      byDistrict: byDistrict.results,
    };
  }
}

/**
 * Main seeding function
 */
export async function seedDatabase(
  apiKey: string,
  db: D1Database,
  areas: ('ginza' | 'osaka')[] = ['ginza', 'osaka']
): Promise<any> {
  const seeder = new VenueSeeder(apiKey, db);
  const results: any = {
    ginza: 0,
    osaka: 0,
    errors: [],
  };

  try {
    if (areas.includes('ginza')) {
      results.ginza = await seeder.seedGinza();
    }

    if (areas.includes('osaka')) {
      results.osaka = await seeder.seedOsaka();
    }

    results.stats = await seeder.getStats();
    results.total = results.ginza + results.osaka;
    results.success = true;

  } catch (error) {
    results.success = false;
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(results.error);
  }

  return results;
}
