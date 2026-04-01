import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
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
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Use getSession() — cookie-based, zero network roundtrip (vs getUser which calls Supabase API)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    // Redirect authenticated users from landing to feed
    if (user && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/feed', request.url))
    }

    // Protect specific routes from unauthenticated access
    const protectedRoutes = ['/stacq/new', '/saved', '/profile', '/settings']
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )

    if (!user && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

export const config = {
    // Excludes: Next.js internals, static assets, fonts, images, and favicons
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|ico)$).*)',
    ],
}
