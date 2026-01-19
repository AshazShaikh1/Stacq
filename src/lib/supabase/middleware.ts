import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Clone headers to add custom ones
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-current-path', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          
          // Clone headers to add custom ones
          const requestHeaders = new Headers(request.headers)
          requestHeaders.set('x-current-path', request.nextUrl.pathname)
          
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          
          const requestHeaders = new Headers(request.headers)
          requestHeaders.set('x-current-path', request.nextUrl.pathname)

          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  
  // This call is required to refresh the session cookie!
  await supabase.auth.getUser()

  return supabaseResponse

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you might be causing the browser to delete cookies,
  // which will cause issues for the user's authentication.

  return supabaseResponse
}

