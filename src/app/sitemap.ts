import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use your production URL here or an environment variable
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ukshootingclub.com'

  // Define your static routes
  // Note: We typically don't include /admin or /dashboard routes in the sitemap 
  // since they require authentication and shouldn't be indexed by search engines.
  const staticRoutes = [
    '', // Homepage
    '/auth/signin',
    '/b2b/register',
    '/join',
    '/events',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const, // Customize as needed
    priority: route === '' ? 1 : 0.8,
  }))

  return [
    ...staticRoutes,
    
    // To include dynamic routes like individual events, you could query your 
    // database here and return them. For example:
    // 
    // const events = await db.event.findMany()
    // const eventRoutes = events.map(event => ({
    //   url: `${baseUrl}/events/${event.id}/register`,
    //   lastModified: event.updatedAt,
    // }))
    // return [...staticRoutes, ...eventRoutes]
  ]
}
