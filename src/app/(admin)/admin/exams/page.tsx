// src/app/(admin)/admin/exams/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ExamRow {
    id: string;
    title: string;
    description: string | null;
    durationMins: number;
    maxViolations: number;
    isActive: boolean;
    createdAt: string;
    _count: { questions: number; attempts: number };
}

interface QuestionInput {
    text: string;
    options: string[];
    answer: string;
}

const BLANK_Q: QuestionInput = {
    text: "", options: ["", "", "", ""], answer: "",
};

export default function ExamsPage() {
    const [exams, setExams] = useState<ExamRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: "", description: "", durationMins: 30, maxViolations: 5,
    });
    const [questions, setQuestions] = useState<QuestionInput[]>([{ ...BLANK_Q }]);

    useEffect(() => { fetchExams(); }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch("/api/admin/exams");
            const data = await res.json();
            setExams(data.exams || []);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (examId: string, current: boolean) => {
        try {
            await fetch("/api/admin/exams", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examId, isActive: !current }),
            });
            toast.success(`Exam ${!current ? "activated" : "deactivated"}`);
            fetchExams();
        } catch {
            toast.error("Failed to update exam");
        }
    };

    const handleAddQuestion = () => {
        setQuestions((q) => [...q, { ...BLANK_Q, options: ["", "", "", ""] }]);
    };

    const handleRemoveQuestion = (i: number) => {
        setQuestions((q) => q.filter((_, idx) => idx !== i));
    };

    const updateQuestion = (
        i: number,
        field: keyof QuestionInput,
        value: string | string[]
    ) => {
        setQuestions((prev) =>
            prev.map((q, idx) => (idx === i ? { ...q, [field]: value } : q))
        );
    };

    const updateOption = (qi: number, oi: number, value: string) => {
        setQuestions((prev) =>
            prev.map((q, idx) => {
                if (idx !== qi) return q;
                const opts = [...q.options];
                opts[oi] = value;
                return { ...q, options: opts };
            })
        );
    };

    const handleCreate = async () => {
        if (!form.title.trim()) { toast.error("Title required"); return; }
        if (questions.length === 0) { toast.error("Add at least one question"); return; }

        for (const q of questions) {
            if (!q.text.trim()) { toast.error("All questions need text"); return; }
            if (!q.answer.trim()) { toast.error("All questions need an answer"); return; }
            if (q.options.some((o) => !o.trim())) {
                toast.error("All options must be filled"); return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/exams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, questions }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error); return; }
            toast.success("Exam created successfully!");
            setShowForm(false);
            setForm({ title: "", description: "", durationMins: 30, maxViolations: 5 });
            setQuestions([{ ...BLANK_Q }]);
            fetchExams();
        } catch {
            toast.error("Failed to create exam");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Exams</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Create and manage exam configurations
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium
                     px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                    + Create Exam
                </button>
            </div>

            {/* Exams table */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-900 border border-gray-800
                                    rounded-xl h-16 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl
                        overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-800">
                            <tr className="text-left">
                                {["Title", "Duration", "Questions", "Attempts", "Status", "Actions"]
                                    .map((h) => (
                                        <th key={h} className="px-5 py-3.5 text-xs font-semibold
                                           text-gray-400 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {exams.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center
                                              text-gray-500 text-sm">
                                        No exams yet. Create one above.
                                    </td>
                                </tr>
                            ) : exams.map((exam) => (
                                <tr key={exam.id}
                                    className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="text-white font-medium">{exam.title}</p>
                                        {exam.description && (
                                            <p className="text-gray-500 text-xs mt-0.5 truncate
                                    max-w-xs">
                                                {exam.description}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-gray-300">
                                        {exam.durationMins}m
                                    </td>
                                    <td className="px-5 py-4 text-gray-300">
                                        {exam._count.questions}
                                    </td>
                                    <td className="px-5 py-4 text-gray-300">
                                        {exam._count.attempts}
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => handleToggleActive(exam.id, exam.isActive)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium
                                  border transition-colors
                                  ${exam.isActive
                                                    ? "bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/70"
                                                    : "bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700"
                                                }`}
                                        >
                                            {exam.isActive ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Link
                                            href={`/admin/logs?examId=${exam.id}`}
                                            className="text-xs text-blue-400 hover:text-blue-300"
                                        >
                                            View Logs →
                                        </Link>
                                    </td>
                </tr>
              ))}
                    </tbody>
                </table>
        </div>
    )
}

{/* Create Exam Modal */ }
{
    showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start
                        justify-center p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl
                          w-full max-w-2xl my-8 p-7">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Create New Exam</h2>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-500 hover:text-white text-xl"
                    >
                        ×
                    </button>
                </div>

                {/* Exam meta */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                            Title *
                        </label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Mid-Term Exam 2025"
                            className="w-full bg-gray-800 border border-gray-700 text-white
                             rounded-lg px-4 py-2.5 text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                            Description
                        </label>
                        <input
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Optional description"
                            className="w-full bg-gray-800 border border-gray-700 text-white
                             rounded-lg px-4 py-2.5 text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                            Duration (minutes) *
                        </label>
                        <input
                            type="number"
                            min={5}
                            value={form.durationMins}
                            onChange={(e) =>
                                setForm({ ...form, durationMins: Number(e.target.value) })
                            }
                            className="w-full bg-gray-800 border border-gray-700 text-white
                             rounded-lg px-4 py-2.5 text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                            Max Violations
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={form.maxViolations}
                            onChange={(e) =>
                                setForm({ ...form, maxViolations: Number(e.target.value) })
                            }
                            className="w-full bg-gray-800 border border-gray-700 text-white
                             rounded-lg px-4 py-2.5 text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Questions */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-300">
                            Questions ({questions.length})
                        </h3>
                        <button
                            onClick={handleAddQuestion}
                            className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            + Add Question
                        </button>
                    </div>

                    <div className="space-y-5 max-h-100 overflow-y-auto
                              pr-1">
                        {questions.map((q, qi) => (
                            <div key={qi}
                                className="bg-gray-800 border border-gray-700
                                  rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-gray-400">
                                        Q{qi + 1}
                                    </span>
                                    {questions.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveQuestion(qi)}
                                            className="text-xs text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* Question text */}
                                <input
                                    value={q.text}
                                    onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                                    placeholder="Question text"
                                    className="w-full bg-gray-700 border border-gray-600 text-white
                                 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none
                                 focus:ring-2 focus:ring-blue-500"
                                />

                                {/* Options */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {q.options.map((opt, oi) => (
                                        <input
                                            key={oi}
                                            value={opt}
                                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                            className="bg-gray-700 border border-gray-600 text-white
                                     rounded-lg px-3 py-2 text-sm focus:outline-none
                                     focus:ring-2 focus:ring-blue-500"
                                        />
                                    ))}
                                </div>

                                {/* Correct answer */}
                                <select
                                    value={q.answer}
                                    onChange={(e) => updateQuestion(qi, "answer", e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white
                                 rounded-lg px-3 py-2 text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select correct answer…</option>
                                    {q.options.filter(Boolean).map((opt, oi) => (
                                        <option key={oi} value={opt}>
                                            {String.fromCharCode(65 + oi)}: {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowForm(false)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white
                           font-medium py-2.5 rounded-xl text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                           disabled:cursor-not-allowed text-white font-semibold
                           py-2.5 rounded-xl text-sm transition-colors"
                    >
                        {saving ? "Creating…" : "Create Exam"}
                    </button>
                </div>
            </div>
        </div>
    )
}
    </div >
  );
}