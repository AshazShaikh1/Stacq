import { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/api-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabase = createServiceClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // Public collections
  const { data: collections } = await supabase
    .from('collections')
    .select('id, slug, updated_at')
    .eq('is_public', true)
    .eq('is_hidden', false)
    .order('updated_at', { ascending: false })
    .limit(1000); // Limit to most recent 1000 collections

  const collectionPages: MetadataRoute.Sitemap = (collections || []).map((collection) => ({
    url: `${baseUrl}/collection/${collection.slug || collection.id}`,
    lastModified: collection.updated_at ? new Date(collection.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Public profiles
  const { data: users } = await supabase
    .from('users')
    .select('username, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500); // Limit to most recent 500 users

  const profilePages: MetadataRoute.Sitemap = (users || []).map((user) => ({
    url: `${baseUrl}/profile/${user.username}`,
    lastModified: user.updated_at ? new Date(user.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...collectionPages, ...profilePages];
}

