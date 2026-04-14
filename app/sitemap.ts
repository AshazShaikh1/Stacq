import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Base URL
  const baseUrl = 'https://stacq.in'

  // Fetch all stacqs that should be indexed
  const { data: stacqs } = await supabase
    .from('stacqs')
    .select('slug, created_at')
    
  // Fetch all public profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, created_at')
    
  const stacqEntries: MetadataRoute.Sitemap = (stacqs || [])
    .filter(stacq => stacq.slug)
    .map((stacq) => ({
    url: `${baseUrl}/stacq/${stacq.slug}`,
    lastModified: new Date(stacq.created_at).toISOString(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const profileEntries: MetadataRoute.Sitemap = (profiles || [])
    .filter(p => p.username)
    .map((p) => ({
    url: `${baseUrl}/${p.username}`,
    lastModified: new Date(p.created_at || new Date()).toISOString(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))


  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...stacqEntries,
    ...profileEntries,
  ]
}
