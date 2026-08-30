import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MaidEasy — Trusted Maid Booking',
    short_name: 'MaidEasy',
    description: 'Find and book verified maids near you. Trusted home services across India.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#2563EB',
    orientation: 'portrait',
    categories: ['lifestyle', 'utilities'],
    lang: 'en-IN',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: 'Find Maids',
        url: '/search',
        description: 'Search for maids in your area',
      },
      {
        name: 'My Bookings',
        url: '/bookings',
        description: 'View your bookings',
      },
    ],
  };
}
