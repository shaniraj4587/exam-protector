// src/app/(admin)/admin/layout.tsx

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const NAV = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/exams", label: "Exams", icon: "📝" },
    { href: "/admin/monitor", label: "Live Monitor", icon: "👁️" },
    { href: "/admin/logs", label: "Logs", icon: "📋" },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthStore();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gray-950 flex">

            {/* Sidebar */}
            <aside className="w-56 bg-gray-900 border-r border-gray-800
                         flex flex-col shrink-0">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center
                            justify-center text-xs">🛡️</div>
                        <span className="font-semibold text-white text-sm">
                            Admin Panel
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5
                            rounded-lg text-sm font-medium transition-colors
                            ${active
                                        ? "bg-blue-600/20 text-blue-400 border border-blue-700/50"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                                    }`}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="px-4 py-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <p className="text-xs text-blue-400 font-medium mt-0.5">
                        {user?.role}
                    </p>
                    <button
                        onClick={handleLogout}
                        className="text-xs text-gray-500 hover:text-red-400
                       transition-colors mt-2"
                    >
                        Logout →
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}