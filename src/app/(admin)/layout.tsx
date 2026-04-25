// src/app/(admin)/layout.tsx  ← NEW wrapper above admin/layout.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

export default async function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) redirect("/login");

    try {
        const payload = verifyToken(token);
        if (!["ADMIN", "SUPER_ADMIN"].includes(payload.role)) {
            redirect("/dashboard");
        }
    } catch {
        redirect("/login");
    }

    return <>{children}</>;
}