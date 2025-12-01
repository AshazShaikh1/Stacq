import { NextRequest, NextResponse } from 'next/server';
import { fetchMetadata } from '@/lib/metadata/extractor';

/**
 * POST /api/cards/metadata
 * Quick metadata extraction for client-side preview
 * Uses the same extractor as the worker but returns immediately
 * For full processing, use the worker endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    try {
      const metadata = await fetchMetadata(url);
      
      return NextResponse.json({
        title: metadata.title,
        description: metadata.description,
        thumbnail_url: metadata.thumbnailUrl,
        canonical_url: metadata.canonicalUrl,
      });
    } catch (fetchError: any) {
      // Return empty metadata if fetch fails (don't block user)
      console.error('Error fetching metadata:', fetchError);
      return NextResponse.json({
        title: '',
        description: '',
        thumbnail_url: null,
        canonical_url: url,
      });
    }
  } catch (error) {
    console.error('Error in metadata route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}

