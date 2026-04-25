// src/app/(auth)/layout.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // If already logged in, redirect away from auth pages
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
        try {
            const payload = verifyToken(token);
            if (payload.role === "STUDENT") redirect("/dashboard");
            else redirect("/admin/dashboard");
        } catch {
            // Invalid token — let them through to login
        }
    }

    return <>{children}</>;
}