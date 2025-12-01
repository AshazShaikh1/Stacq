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
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];

  // Public stacks
  const { data: stacks } = await supabase
    .from('stacks')
    .select('id, slug, updated_at')
    .eq('is_public', true)
    .eq('is_hidden', false)
    .order('updated_at', { ascending: false })
    .limit(1000); // Limit to most recent 1000 stacks

  const stackPages: MetadataRoute.Sitemap = (stacks || []).map((stack) => ({
    url: `${baseUrl}/stack/${stack.slug || stack.id}`,
    lastModified: stack.updated_at ? new Date(stack.updated_at) : new Date(),
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

  return [...staticPages, ...stackPages, ...profilePages];
}

