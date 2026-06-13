import type { NextConfig } from 'next';
import os from 'os';

const getLocalIPs = () => {
  const ips = ['localhost', '127.0.0.1', '10.0.2.2'];
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4') {
          ips.push(net.address);
          // Also allow with port just in case
          ips.push(`${net.address}:3000`);
        }
      }
    }
  } catch (e) {
    console.error('Failed to get local IPs for allowedDevOrigins:', e);
  }
  return Array.from(new Set(ips));
};

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalIPs(),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'misc.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
    ],
  },
  experimental: {
    // Allow server actions
  },
};

export default nextConfig;
