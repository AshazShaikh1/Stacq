import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Basic metadata extraction (simplified - in production, use a proper service)
    // For MVP, we'll do a simple fetch and parse HTML
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
        title: title.trim(),
        description: description.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
      });
    } catch (fetchError) {
      // Return empty metadata if fetch fails
      return NextResponse.json({
        title: '',
        description: '',
        thumbnail_url: null,
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

