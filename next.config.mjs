/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
        FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      },
    images: {
        domains: ['utfs.io'],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve = {
                ...config.resolve,
                fallback: {
                    ...(config.resolve?.fallback || {}),
                    fs: false,
                    net: false,
                    tls: false,
                },
            };
        }
        return config;
    },
};

export default nextConfig;