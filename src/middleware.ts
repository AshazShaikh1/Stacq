import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session first
  const response = await updateSession(request);
  
  // Get user from the updated session response
  // Note: updateSession handles refreshing tokens, but we need to check auth state here
  // Ideally, we look at the cookies or rely on supabase.auth.getUser() inside updateSession
  // but updateSession returns a response, not the user directly.
  // We can check if the 'sb-access-token' cookie exists as a quick check,
  // or instantiate a client here. 
  // However, simpler pattern: Let updateSession handle the session, then check path.
  
  // Checking Auth Status (Simplified for Middleware speed)
  // We'll optimistically assume presence of access token cookie means logged in
  // For stricter check, we would need to call getUser() which is async and adds latency.
  const hasSession = request.cookies.getAll().some(c => c.name.includes('access-token') || c.name.includes('sb-')); 
  // Supabase cookies usually start with sb-[proj-id]-auth-token
  const isLoggedIn = request.cookies.getAll().some(c => c.name.endsWith('-auth-token'));

  const url = request.nextUrl;
  const path = url.pathname;

  // RULE 1: Logged In User at / -> Redirect to /feed
  if (isLoggedIn && path === '/') {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // RULE 2: Guest at Protected Routes -> Redirect to /login
  const protectedPrefixes = ['/create', '/settings', '/notifications', '/saved', '/payment', '/admin', '/onboarding'];
  const isProtected = protectedPrefixes.some(prefix => path.startsWith(prefix));

  if (!isLoggedIn && isProtected) {
    // Optional: Store return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // RULE 3: Allow everything else (Guests can see /, /feed, /explore, /collection/*, etc)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

