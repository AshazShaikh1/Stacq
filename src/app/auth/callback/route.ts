import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    const next = requestUrl.searchParams.get('next') || '/feed';

    // Handle OAuth errors from the provider
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', errorDescription || error);
      return NextResponse.redirect(loginUrl);
    }

    if (!code) {
      console.error('No code parameter in OAuth callback');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_code');
      return NextResponse.redirect(loginUrl);
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'configuration_error');
      return NextResponse.redirect(loginUrl);
    }

    // Construct redirect URL safely
    const redirectUrl = new URL(next, request.url);
    const supabaseResponse = NextResponse.redirect(redirectUrl);
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            supabaseResponse.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }

    if (data?.session) {
      // Successful authentication, redirect to the intended page
      return supabaseResponse;
    }

    // No session created
    console.error('No session created after code exchange');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'no_session');
    return NextResponse.redirect(loginUrl);
  } catch (err) {
    console.error('Unexpected error in OAuth callback:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(loginUrl);
  }
}

