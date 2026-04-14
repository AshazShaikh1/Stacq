import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/saved', '/profile/settings', '/api/*', '/admin/*'], // Protected and private routes
    },
    sitemap: 'https://stacq.in/sitemap.xml',
  }
}
