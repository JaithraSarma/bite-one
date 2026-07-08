import { useState, useEffect, useRef } from "react";
import { supabase, type Note } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
}

export default function NotesScreen({ user }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setNotes(data ?? []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);

    const { data, error } = await supabase
      .from("notes")
      .insert({ content: trimmed })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      setNotes((prev) => [data, ...prev]);
      setContent("");
      textareaRef.current?.focus();
    }
    setAdding(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 border border-amber-200">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
              >
                <rect x="6" y="4" width="24" height="30" rx="3" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
                <rect x="10" y="10" width="16" height="2" rx="1" fill="#D97706" opacity="0.6" />
                <rect x="10" y="15" width="16" height="2" rx="1" fill="#D97706" opacity="0.6" />
                <rect x="10" y="20" width="10" height="2" rx="1" fill="#D97706" opacity="0.6" />
                <rect x="28" y="26" width="8" height="3" rx="1" fill="#92400E" transform="rotate(-45 28 26)" />
                <rect x="31" y="23" width="3" height="3" rx="0.5" fill="#D97706" transform="rotate(-45 31 23)" />
              </svg>
            </div>
            <span className="text-lg font-bold text-amber-900 tracking-tight">QuickNotes</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-amber-500 truncate max-w-[160px]">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Add Note Form */}
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleAdd(e);
              }
            }}
            placeholder="What's on your mind? (Ctrl+Enter to save)"
            rows={3}
            className="w-full resize-none bg-amber-50 rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={adding || !content.trim()}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "Adding…" : "Add note"}
            </button>
          </div>
        </form>

        {/* Notes List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16 px-4">
            {/* Empty state illustration */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-amber-100 border-2 border-amber-200 mb-5 shadow-inner">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
                <rect x="10" y="6" width="38" height="48" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="2"/>
                <rect x="16" y="16" width="26" height="2.5" rx="1.25" fill="#FCD34D"/>
                <rect x="16" y="23" width="26" height="2.5" rx="1.25" fill="#FCD34D"/>
                <rect x="16" y="30" width="18" height="2.5" rx="1.25" fill="#FCD34D"/>
                <rect x="16" y="37" width="22" height="2.5" rx="1.25" fill="#FDE68A"/>
                <circle cx="48" cy="48" r="10" fill="#FFFBEB" stroke="#D97706" strokeWidth="2"/>
                <line x1="48" y1="44" x2="48" y2="52" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
                <line x1="44" y1="48" x2="52" y2="48" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-amber-900 font-semibold text-lg mb-1">No notes yet</h3>
            <p className="text-amber-500 text-sm">Write your first note above to get started.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="bg-white rounded-2xl border border-amber-100 shadow-sm px-4 py-3.5 hover:border-amber-200 transition-colors"
              >
                <p className="text-amber-900 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {note.content}
                </p>
                <p className="text-amber-400 text-xs mt-2.5 font-medium">
                  {formatDate(note.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
