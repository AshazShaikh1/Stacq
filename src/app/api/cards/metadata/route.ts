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
    // Safely parse JSON body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      // Handle empty or invalid JSON
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { url } = body || {};

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const metadata = await Promise.race([
        fetchMetadata(url),
        timeoutPromise
      ]) as any;
      
      return NextResponse.json({
        title: metadata.title,
        description: metadata.description,
        thumbnail_url: metadata.thumbnailUrl,
        canonical_url: metadata.canonicalUrl,
      });
    } catch (fetchError: any) {
      // Return empty metadata if fetch fails (don't block user)
      // Only log unexpected errors (not DNS failures, timeouts, 403/404, etc.)
      const errorMessage = fetchError?.message || '';
      const errorCode = fetchError?.code || '';
      
      const isExpectedError = 
        errorCode === 'ENOTFOUND' || 
        errorCode === 'EAI_AGAIN' || 
        errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT' ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Request timeout') ||
        errorMessage.includes('HTTP 403') ||
        errorMessage.includes('HTTP 404') ||
        errorMessage.includes('403') ||
        errorMessage.includes('404') ||
        errorMessage.includes('Forbidden');
      
      // Don't log expected errors - they're common and not actionable
      if (!isExpectedError) {
        console.error('Unexpected error fetching metadata:', fetchError);
      }
      
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

