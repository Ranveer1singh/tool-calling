"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatTurn, Task } from "@/lib/types";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openTasks = tasks.filter((task) => !task.done).length;
  const completedTasks = tasks.length - openTasks;

  function refreshTasks() {
    return fetch("/api/tasks")
      .then((res) => res.json())
      .then((data: Task[]) => setTasks(data));
  }

  useEffect(() => {
    refreshTasks();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const next: ChatTurn[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessages([
        ...next,
        { role: "assistant", content: data.reply, toolCalls: data.toolCalls },
      ]);
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-7 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-5 rounded-3xl border border-white/70 bg-white/70 px-5 py-5 shadow-[0_18px_55px_-32px_rgba(35,50,90,.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white shadow-lg shadow-blue-200">✓</div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">Taskflow</h1>
              <p className="text-xs text-slate-500">Your AI-powered task desk</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Assistant online
          </div>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="All tasks" value={tasks.length} accent="text-blue-600" />
          <StatCard label="In progress" value={openTasks} accent="text-violet-600" />
          <StatCard label="Completed" value={completedTasks} accent="text-emerald-600" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.35fr)]">
          <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_20px_55px_-36px_rgba(35,50,90,.5)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="font-semibold text-slate-900">My tasks</h2>
                <p className="mt-0.5 text-xs text-slate-500">Keep momentum, one task at a time.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{openTasks} open</span>
            </div>
            <div className="max-h-[510px] space-y-2 overflow-y-auto p-3">
              {tasks.length === 0 ? (
                <div className="px-4 py-14 text-center">
                  <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-xl">✨</div>
                  <p className="text-sm font-medium text-slate-700">A clear slate</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Ask your assistant to add the first task.</p>
                </div>
              ) : (
                <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/50"
              >
                <div className="flex gap-3">
                  <span className={"mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] " + (t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent")}>✓</span>
                  <div className="min-w-0">
                    <div className={"text-sm font-medium " + (t.done ? "text-slate-400 line-through" : "text-slate-800")}>{t.title}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
                      {t.dueDate && <span className="rounded-md bg-white px-1.5 py-0.5 ring-1 ring-slate-100">Due {t.dueDate}</span>}
                      {t.done && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Completed</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-h-[580px] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_20px_55px_-36px_rgba(35,50,90,.5)] backdrop-blur">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">✦</div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Task assistant</h2>
                <p className="text-xs text-slate-500">Ask naturally. I&apos;ll handle the details.</p>
              </div>
            </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(135deg,rgba(248,250,252,.8),rgba(255,255,255,.8))] p-5">
          {messages.length === 0 && (
            <div className="py-14 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-xl">👋</div><p className="text-sm font-semibold text-slate-800">How can I help today?</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">Create, update, or organize tasks using everyday language.</p></div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div
                className={
                  "inline-block max-w-[85%] whitespace-pre-wrap rounded px-3 py-2 text-sm " +
                  (m.role === "user"
                    ? "rounded-br-md bg-slate-900 text-white shadow-sm"
                    : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm")
                }
              >
                {m.content}
              </div>
              {m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && (
                <details className="mt-1 text-xs text-slate-500">
                  <summary className="cursor-pointer">
                    {m.toolCalls.length} tool call{m.toolCalls.length > 1 ? "s" : ""}
                  </summary>
                  <ul className="mt-1 space-y-1 font-mono">
                    {m.toolCalls.map((c, j) => (
                      <li key={j}>
                        {c.tool}({JSON.stringify(c.input)}) → {c.result.slice(0, 120)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-xs text-slate-500"><span className="flex gap-1 rounded-full bg-white px-3 py-2 shadow-sm"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" /></span> Assistant is working</div>}
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="border-t border-slate-100 bg-white p-4">
          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell the assistant what to do…"
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
          </div>
          <p className="mt-2 px-2 text-[11px] text-slate-400">Try “add a task to review the proposal tomorrow”</p>
        </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 px-5 py-4 shadow-[0_12px_35px_-28px_rgba(35,50,90,.55)] backdrop-blur">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={"mt-1 text-2xl font-semibold tracking-tight " + accent}>{value}</p>
    </div>
  );
}
