import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase to prevent real network calls during unit tests
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            maybeSingle: vi.fn(),
        })),
    })),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        refresh: vi.fn(),
    })),
    notFound: vi.fn(),
    permanentRedirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))
