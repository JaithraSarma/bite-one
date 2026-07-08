import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-200 mb-4 shadow-sm">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-9 h-9"
            >
              <rect x="6" y="4" width="24" height="30" rx="3" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
              <rect x="10" y="10" width="16" height="2" rx="1" fill="#D97706" opacity="0.6" />
              <rect x="10" y="15" width="16" height="2" rx="1" fill="#D97706" opacity="0.6" />
              <rect x="10" y="20" width="10" height="2" rx="1" fill="#D97706" opacity="0.6" />
              <rect x="28" y="26" width="8" height="3" rx="1" fill="#92400E" transform="rotate(-45 28 26)" />
              <rect x="31" y="23" width="3" height="3" rx="0.5" fill="#D97706" transform="rotate(-45 31 23)" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-amber-900 tracking-tight">QuickNotes</h1>
          <p className="text-amber-700 mt-1 text-sm">Your thoughts, captured instantly.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-6">
          {/* Toggle */}
          <div className="flex rounded-xl bg-amber-50 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === "login"
                  ? "bg-white text-amber-900 shadow-sm border border-amber-100"
                  : "text-amber-600 hover:text-amber-800"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === "signup"
                  ? "bg-white text-amber-900 shadow-sm border border-amber-100"
                  : "text-amber-600 hover:text-amber-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-3.5 py-2.5 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading
                ? mode === "login"
                  ? "Logging in…"
                  : "Creating account…"
                : mode === "login"
                ? "Log In"
                : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-amber-500 mt-6">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setMessage(null); }}
            className="font-semibold text-amber-700 hover:underline"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
