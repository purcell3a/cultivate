import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input: input,
          types: '(regions)', // Supports addresses, cities, zip codes
          components: 'country:us', // Restrict to US if needed
          key: process.env.GOOGLE_MAPS_API_KEY_SERVER,
        },
      }
    );

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google API error: ${response.data.status}`);
    }

    const predictions = response.data.predictions.map((prediction: any) => ({
      description: prediction.description,
      placeId: prediction.place_id,
    }));

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error fetching autocomplete:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}