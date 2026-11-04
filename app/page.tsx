"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const MAX_CHARS = 8000;

const LANGUAGES = [
  "Python", "JavaScript", "TypeScript", "Java", "C", "C++",
  "C#", "Go", "Rust", "PHP", "SQL", "Other",
];

const EXAMPLE = `def add(a, b):
    return a - b

def average(nums):
    return sum(nums) / len(nums)

print(average([]))`;

const mdComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mb-2 mt-6 border-b border-slate-800 pb-1 text-base font-semibold text-emerald-400 first:mt-0">
      {children}
    </h2>
  ),
  p: ({ children }) => <p className="my-2 leading-relaxed text-slate-300">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-slate-300">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-slate-300">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-200">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "") || String(children).includes("\n");
    return isBlock ? (
      <code className="font-mono text-sm">{children}</code>
    ) : (
      <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-300">
        {children}
      </code>
    );
  },
};

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const overLimit = code.length > MAX_CHARS;

  async function handleReview() {
    if (loading) return;
    if (!code.trim()) {
      setError("Please paste some code to review.");
      return;
    }
    if (code.length > MAX_CHARS) {
      setError(`Code is too long. Maximum is ${MAX_CHARS} characters.`);
      return;
    }

    setError(null);
    setStopped(false);
    setOutput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = "Something went wrong. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }
      if (!res.body) throw new Error("No response from the server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
      acc += decoder.decode();
      setOutput(acc);
      if (!acc.trim()) throw new Error("The AI returned an empty response. Please try again.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStopped(true);
      } else if (err instanceof TypeError) {
        setError("Network error. Check your connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleClear() {
    abortRef.current?.abort();
    setCode("");
    setOutput("");
    setError(null);
    setStopped(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            AI Code <span className="text-emerald-400">Reviewer</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Paste your code and get an instant review: bugs, security issues, style problems, and an improved version.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label htmlFor="language" className="text-sm font-medium text-slate-300">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleReview();
                }
              }}
              disabled={loading}
              spellCheck={false}
              placeholder="Paste your code here..."
              aria-label="Code to review"
              className="h-80 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />

            <div className="mt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setCode(EXAMPLE);
                  setLanguage("Python");
                  setError(null);
                }}
                disabled={loading}
                className="text-emerald-400 hover:underline disabled:opacity-50"
              >
                Try an example
              </button>
              <span className={overLimit ? "font-medium text-red-400" : "text-slate-500"}>
                {code.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReview}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                )}
                {loading ? "Reviewing..." : "Review Code"}
              </button>
              {loading && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
              >
                Clear
              </button>
              <span className="self-center text-xs text-slate-600">Ctrl + Enter to submit</span>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}
          </section>

          <section className="flex min-h-[28rem] flex-col rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">Review</h2>
              {output && !loading && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            <div aria-live="polite" className="flex-1 overflow-auto text-sm">
              {!output && loading && (
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
                  Reviewing your code...
                </div>
              )}
              {!output && !loading && !error && (
                <p className="text-slate-500">Your review will appear here.</p>
              )}
              {output && <ReactMarkdown components={mdComponents}>{output}</ReactMarkdown>}
              {stopped && <p className="mt-4 text-xs text-amber-400">Review stopped.</p>}
            </div>
          </section>
        </div>

        <footer className="mt-10 text-center text-xs text-slate-600">
          Powered by Gemini. Reviews can contain mistakes, so verify before using.
        </footer>
      </div>
    </div>
  );
}
