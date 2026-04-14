import { z } from 'zod'

/**
 * PROJECT-WIDE VALIDATION SCHEMAS
 * These schemas are used by both client-side forms and server-side actions
 * to ensure data integrity and provide unified error messages.
 */

// 1. Profile Validation
export const profileSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be 20 characters or fewer")
        .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed")
        .trim(),
    display_name: z.string()
        .min(1, "Display name is required")
        .max(50, "Display name must be 50 characters or fewer")
        .trim(),
    bio: z.string()
        .max(160, "Bio must be 160 characters or fewer")
        .optional()
        .or(z.literal('')),
    twitter: z.string().optional().or(z.literal('')),
    github: z.string().optional().or(z.literal('')),
    website: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
})

// 2. Resource Validation
export const resourceSchema = z.object({
    url: z.string().url("Please enter a valid URL"),
    title: z.string()
        .min(1, "Title is required")
        .max(100, "Title must be 100 characters or fewer"),
    note: z.string()
        .max(2000, "Curator note must be 2000 characters or fewer (Mini-Wiki limit)")
        .optional()
        .or(z.literal('')),
    section: z.string().optional().default("Default"),
    thumbnail: z.string().url("Invalid image URL").optional().or(z.literal('')),
})

// 3. Stacq (Collection) Validation
export const stacqSchema = z.object({
    title: z.string()
        .min(1, "Collection title is required")
        .max(100, "Title must be 100 characters or fewer"),
    description: z.string()
        .max(500, "Description must be 500 characters or fewer")
        .optional()
        .or(z.literal('')),
    category: z.string().min(1, "Category is required"),
    thumbnail: z.string().url("Invalid image URL").optional().or(z.literal('')),
})

// Infer types
export type ProfileInput = z.infer<typeof profileSchema>
export type ResourceInput = z.infer<typeof resourceSchema>
export type StacqInput = z.infer<typeof stacqSchema>
