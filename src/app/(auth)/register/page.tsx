// src/app/(auth)/register/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// ── Field must be OUTSIDE RegisterPage ───────────────────
// Defining it inside causes remount on every keystroke
interface FieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
}

function Field({ label, type = "text", value, onChange, placeholder }: FieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {label}
            </label>
            <input
                type={type}
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 text-white
                   rounded-lg px-4 py-2.5 text-sm placeholder-gray-500
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:border-transparent"
            />
        </div>
    );
}

// ── Main component ────────────────────────────────────────
export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "", email: "", password: "", confirm: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirm) {
            toast.error("Passwords do not match");
            return;
        }
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Registration failed"); return; }

            toast.success("Account created! Please log in.");
            router.push("/login");
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center
                    justify-center px-4">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800
                      rounded-2xl p-8 shadow-2xl">

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14
                          bg-blue-600 rounded-xl mb-4">
                        <svg className="w-7 h-7 text-white" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0
                   00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create Account</h1>
                    <p className="text-gray-400 text-sm mt-1">Register as a student</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        label="Full Name"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(val) => setForm((prev) => ({ ...prev, name: val }))}
                    />
                    <Field
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(val) => setForm((prev) => ({ ...prev, email: val }))}
                    />
                    <Field
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(val) => setForm((prev) => ({ ...prev, password: val }))}
                    />
                    <Field
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        value={form.confirm}
                        onChange={(val) => setForm((prev) => ({ ...prev, confirm: val }))}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500
                       disabled:bg-blue-800 disabled:cursor-not-allowed
                       text-white font-semibold py-2.5 rounded-lg
                       transition-colors text-sm mt-2"
                    >
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{" "}
                    <a href="/login"
                        className="text-blue-400 hover:text-blue-300 font-medium">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}