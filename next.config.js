/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // permite qualquer host
            },
            {
                protocol: 'http',
                hostname: '**', // também libera http (se precisar)
            },
        ],
    },
}

module.exports = nextConfig
