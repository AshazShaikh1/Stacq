import { describe, it, expect } from 'vitest'

import { generateSlug } from '@/lib/actions/stacq'
import { profileSchema, resourceSchema } from '@/lib/validations/schemas'

describe('Slug Generation Logic', () => {
    it('formats titles into clean, lowercase-dashed slugs', async () => {
        const title = "My Awesome Next.js Collection"
        const slug = await generateSlug(title)
        
        expect(slug).toMatch(/^[a-z0-9-]+$/)
        expect(slug).toContain("my-awesome-next-js-collection")
    })

    it('handles special characters by stripping them', async () => {
        const title = "Hello World! @#%^&*()"
        const slug = await generateSlug(title)
        
        expect(slug).toMatch(/hello-world-[a-z0-9]+/)
    })

    it('ensures a random suffix is always added for uniqueness', async () => {
        const title = "test"
        const slug1 = await generateSlug(title)
        const slug2 = await generateSlug(title)
        
        expect(slug1).not.toBe(slug2)
    })
})


describe('Validation Schemas (Zod)', () => {
    describe('Profile Schema', () => {
        it('rejects usernames with spaces or uppercase letters', () => {
            const result = profileSchema.safeParse({ username: "Bad Name", display_name: "Test" })
            expect(result.success).toBe(false)
        })

        it('accepts valid usernames with underscores and numbers', () => {
            const result = profileSchema.safeParse({ 
                username: "stacq_user_01", 
                display_name: "Curation King" 
            })
            expect(result.success).toBe(true)
        })

        it('rejects bios that exceed 160 characters', () => {
            const longBio = "a".repeat(161)
            const result = profileSchema.safeParse({ 
                username: "test", 
                display_name: "test", 
                bio: longBio 
            })
            expect(result.success).toBe(false)
        })
    })

    describe('Resource Schema', () => {
        it('rejects invalid URLs', () => {
            const result = resourceSchema.safeParse({ 
                url: "not-a-url", 
                title: "Test" 
            })
            expect(result.success).toBe(false)
        })

        it('rejects notes that exceed 2000 characters (Mini-Wiki limit)', () => {
            const longNote = "a".repeat(2001)
            const result = resourceSchema.safeParse({ 
                url: "https://google.com", 
                title: "Google", 
                note: longNote 
            })
            expect(result.success).toBe(false)
        })
    })
})
