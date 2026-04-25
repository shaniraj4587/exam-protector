// src/app/(student)/layout.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) redirect("/login");

    try {
        const payload = verifyToken(token);
        if (!["STUDENT"].includes(payload.role)) {
            redirect("/admin/dashboard");
        }
    } catch {
        redirect("/login");
    }

    return <>{children}</>;
}