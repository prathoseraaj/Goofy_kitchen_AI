"use client";

import React, { useState } from "react";
import { Refrigerator, Flame, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [input, setInput] = useState("");
  const [roast, setRoast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock submission handler for you to wire up your backend later
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setRoast(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/roast",{
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify({ingredients: input}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "The fridge refused to comment.");
      }

      setRoast(data.roast);
    } catch (err: any) {
      setError(err.message || "Failed to communicate with the kitchen oracle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-inner mb-4 group transition-transform hover:rotate-3">
            <Refrigerator className={`w-12 h-12 text-rose-400 ${loading ? "animate-pulse" : ""}`} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-amber-200 to-rose-400 bg-clip-text text-transparent">
            Goofy Kitchen AI
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base max-w-md">
            Type in your sad leftover ingredients and let the Smart Fridge judge your lifestyle choices.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., black olives, stale feta cheese, half a lemon..."
              maxLength={300}
              disabled={loading}
              className="w-full h-32 bg-slate-950/80 border border-slate-800 focus:border-rose-500/50 rounded-2xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all resize-none disabled:opacity-50 text-sm md:text-base font-medium"
            />
            <span className="absolute bottom-3 right-4 text-xs text-slate-600 font-mono">
              {input.length}/300
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-slate-950 font-bold h-12 rounded-xl transition-all duration-300 transform active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm md:text-base shadow-lg shadow-rose-500/10"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing Disasters...
              </>
            ) : (
              <>
                <Flame className="w-5 h-5" />
                Roast My Ingredients
              </>
            )}
          </button>
        </form>

        {/* Dynamic Display Feedback Blocks */}
        {(roast || error || loading) && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Loading State Skeleton */}
            {loading && (
              <div className="space-y-3 py-2">
                <div className="h-4 bg-slate-800 rounded-md w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-800 rounded-md w-5/6 animate-pulse" />
                <div className="h-4 bg-slate-800 rounded-md w-2/3 animate-pulse" />
              </div>
            )}

            {/* Error Message Block */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* AI Roast Output Block */}
            {roast && !loading && (
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-3 right-4 opacity-30 group-hover:opacity-60 transition-opacity">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2 font-mono">
                  Fridge Assessment:
                </h3>
                <div className="text-slate-200 text-sm md:text-base leading-relaxed font-medium font-serif italic"> 
                  <ReactMarkdown>{roast}</ReactMarkdown> 
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Micro Footer Attribution */}
      <footer className="mt-8 text-xs font-mono text-slate-700 tracking-wider uppercase">
        Built with NextJS & Gemini RAG
      </footer>
    </div>
  );
}