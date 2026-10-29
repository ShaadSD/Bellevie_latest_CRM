/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.0.111:3000','192.168.0.107:3000', 'localhost:3000', '127.0.0.1:3000'],
};

module.exports = nextConfig;
