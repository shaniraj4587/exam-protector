// src/components/proctor/NetworkBanner.tsx

"use client";

interface NetworkBannerProps {
    isOnline: boolean;
}

export function NetworkBanner({ isOnline }: NetworkBannerProps) {
    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-9999 bg-red-600 text-white
                    text-center text-sm font-semibold py-2 px-4 flex items-center
                    justify-center gap-2 animate-pulse">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072
             M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0
             010-12.728" />
            </svg>
            Network disconnected — your answers are being saved locally
        </div>
    );
}