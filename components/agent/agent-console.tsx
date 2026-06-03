"use client";

import { useMemo, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import type { AgentMessage, AgentThread, Athlete } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Select } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";

export function AgentConsole({
  athletes,
  threads,
  messages,
  llmConfigured,
}: {
  athletes: Athlete[];
  threads: AgentThread[];
  messages: AgentMessage[];
  llmConfigured: boolean;
}) {
  const [threadId, setThreadId] = useState(threads[0]?.id || "");
  const [athleteId, setAthleteId] = useState("");
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleMessages = useMemo(() => {
    if (!threadId) return localMessages.slice(-8);
    return localMessages.filter((message) => message.thread_id === threadId);
  }, [localMessages, threadId]);

  async function send(message = draft) {
    const text = message.trim();
    if (!text) return;
    setError(null);
    setDraft("");
    setSending(true);
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        athlete_id: athleteId || null,
        thread_id: threadId || null,
        route_context: "/agent",
      }),
    });
    setSending(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Agent request failed.");
      return;
    }
    const payload = await response.json();
    const newThreadId = payload.thread_id as string;
    setThreadId(newThreadId);
    setLocalMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        thread_id: newThreadId,
        role: "user",
        content: text,
        metadata: null,
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        thread_id: newThreadId,
        role: "assistant",
        content: payload.answer,
        metadata: { mode: payload.mode, provider: payload.provider },
        created_at: new Date().toISOString(),
      },
    ]);
    emitToast("Agent Response Saved", payload.mode);
    inputRef.current?.focus();
  }

  const prompts = [
    "What is the highest-value athlete opportunity?",
    "What should Tyler do this week?",
    "Summarize this athlete.",
    "Identify top leaks.",
    "Recommend the next buildout action.",
    "Generate report outline.",
    "Summarize pipeline.",
  ];

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mono-label mb-2 text-accent">OS Agent</div>
          <h1 className="display-title text-3xl font-medium text-text">Tactical Revenue Operator</h1>
          <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
            The agent endpoint authenticates the user, loads saved app context, calls the configured LLM provider, saves
            messages, and falls back deterministically when no key is present.
          </p>
        </div>
        <Badge tone={llmConfigured ? "green" : "amber"}>{llmConfigured ? "Connected Agent" : "Agent running in Prototype Mode"}</Badge>
      </div>

      <section className="grid min-h-[calc(100vh-180px)] gap-3 xl:grid-cols-[280px_1fr]">
        <aside className="panel grid content-start gap-4 p-4">
          <div>
            <div className="mono-label mb-2">Thread</div>
            <Select value={threadId} onChange={(event) => setThreadId(event.target.value)}>
              <option value="">New thread</option>
              {threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.title || "Untitled thread"}</option>)}
            </Select>
          </div>
          <div>
            <div className="mono-label mb-2">Athlete Context</div>
            <Select value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
              <option value="">Cohort context</option>
              {athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name}</option>)}
            </Select>
          </div>
          <div>
            <div className="mono-label mb-2">Operator Prompts</div>
            <div className="grid gap-2">
              {prompts.map((prompt) => (
                <button key={prompt} className="border border-line bg-bg p-2 text-left font-mono text-[10px] leading-5 text-text-low hover:border-[rgba(0,255,102,0.34)] hover:text-accent" onClick={() => send(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="panel flex min-h-[540px] flex-col">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Bot className="h-4 w-4 text-accent" />
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim">Saved Agent Thread</div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="grid gap-3">
              {visibleMessages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "ml-auto max-w-3xl border border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.07)] p-3" : "max-w-3xl border border-line bg-bg p-3"}>
                  <div className={message.role === "user" ? "mono-label mb-2 text-cyan" : "mono-label mb-2 text-accent"}>{message.role}</div>
                  <div className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-text-dim">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
          <form
            className="flex items-center gap-3 border-t border-line bg-bg p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <span className="font-mono text-[12px] text-accent">&gt;</span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-10 flex-1 bg-transparent font-mono text-[12px] text-text outline-none placeholder:text-text-min"
              placeholder="Ask the OS Agent..."
            />
            <Button type="submit" variant="primary" disabled={sending} icon={<Send className="h-3.5 w-3.5" />}>
              {sending ? "Sending" : "Send"}
            </Button>
          </form>
        </div>
      </section>
      <FieldError>{error}</FieldError>
    </div>
  );
}
