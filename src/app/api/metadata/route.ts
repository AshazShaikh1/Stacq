import { NextRequest, NextResponse } from 'next/server';

// GET endpoint for metadata cache check (used by extension)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { ok: false, found: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // For now, we'll always return not found and let the extension use tab data
    // In production, you could check a cache/DB for previously fetched metadata
    return NextResponse.json({
      ok: true,
      found: false,
    });
  } catch (error) {
    console.error('Error in metadata GET route:', error);
    return NextResponse.json(
      { ok: false, found: false, error: 'Failed to check metadata' },
      { status: 500 }
    );
  }
}

// POST endpoint for metadata queue (used by extension)
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { ok: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch metadata using the existing cards metadata endpoint logic
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StackBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch URL');
      }

      const html = await response.text();
      
      // Simple regex extraction (for MVP - use cheerio or similar in production)
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

      const title = ogTitleMatch?.[1] || titleMatch?.[1] || '';
      const description = ogDescriptionMatch?.[1] || '';
      const thumbnailUrl = ogImageMatch?.[1] || '';

      return NextResponse.json({
        ok: true,
        meta: {
          title: title.trim(),
          description: description.trim(),
          image: thumbnailUrl.trim() || null,
        },
      });
    } catch (fetchError) {
      // Return empty metadata if fetch fails
      return NextResponse.json({
        ok: true,
        meta: {
          title: '',
          description: '',
          image: null,
        },
      });
    }
  } catch (error) {
    console.error('Error in metadata POST route:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}

