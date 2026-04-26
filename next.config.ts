// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                ],
            },
        ];
    },

    images: {
        remotePatterns: [
            { protocol: "https", hostname: "storage.googleapis.com" },
        ],
    },

    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            crypto: false,
        };

        // Ignore mediapipe packages that break in Next.js bundler
        config.externals = [
            ...(Array.isArray(config.externals) ? config.externals : []),
            { "@mediapipe/face_mesh": "FaceMesh" },
        ];

        return config;
    },
    turbopack: {}, // 👈 add this
};

export default nextConfig;