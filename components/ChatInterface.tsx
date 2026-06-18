"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Message from "./Message";
import { MBALandingChat } from "@/components/ui/ruixen-moon-chat";
import { MBAPromptBox } from "@/components/ui/ai-prompt-box";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Msg = { id: string; role: "user" | "assistant"; content: string };

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatInterface({ userEmail }: { userEmail: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // useRef guarantees a stable singleton — useMemo may discard caches under memory pressure
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function stopGeneration() {
    abortRef.current?.abort();
    setLoading(false);
  }

  const send = useCallback(
    async (content?: string) => {
      const text = (content ?? input).trim();
      if (!text || loading) return;

      setError(null);
      setInput("");

      const userMsg: Msg = { id: generateId(), role: "user", content: text };
      const assistantMsg: Msg = { id: generateId(), role: "assistant", content: "" };
      const newMessages: Msg[] = [...messages, userMsg];

      setMessages([...newMessages, assistantMsg]);
      setLoading(true);

      // Build the payload: only role + content (no id) for the API
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));

      let response: Response;
      try {
        abortRef.current = new AbortController();
        response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortRef.current.signal,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled — keep whatever was accumulated, just stop loading
          setLoading(false);
          return;
        }
        // Network error
        setMessages((prev) => prev.slice(0, -1));
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
        setLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        setMessages((prev) => prev.slice(0, -1));
        if (response.status === 401) {
          setError("Sessão expirada. Faça login novamente.");
          router.push("/login");
        } else if (response.status >= 500) {
          setError("Erro no servidor. Tente novamente em alguns instantes.");
        } else {
          setError("Não foi possível processar sua pergunta. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      // Use stream mode so multi-byte UTF-8 chars (Portuguese accents, etc.) aren't corrupted
      const decoder = new TextDecoder("utf-8", { fatal: false });
      let accumulated = "";
      let lineBuffer = "";
      let doneSeen = false;

      try {
        while (!doneSeen) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode with stream:true so partial multi-byte sequences are buffered
          lineBuffer += decoder.decode(value, { stream: true });

          // Split on newlines; keep the last incomplete line in the buffer
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              doneSeen = true;
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed.text === "string") {
                accumulated += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch {
              // Malformed JSON chunk — skip silently
            }
          }
        }

        // Flush any remaining bytes in the decoder buffer
        const remaining = decoder.decode();
        if (remaining) {
          lineBuffer += remaining;
          for (const line of lineBuffer.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed.text === "string") {
                accumulated += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled mid-stream — keep what we have
        } else {
          setError("Erro ao receber resposta. Tente novamente.");
        }
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, router]
  );

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // ── Landing state (no messages yet) ─────────────────────────────────────────
  if (messages.length === 0 && !loading) {
    return (
      <div className="relative h-screen overflow-hidden">
        {/* Logout button floating */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <span className="text-white/40 text-xs hidden sm:block">{userEmail}</span>
          <button
            onClick={logout}
            className="text-white/40 hover:text-white text-xs transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/30"
          >
            Sair
          </button>
        </div>

        <MBALandingChat
          value={input}
          onChange={setInput}
          onSend={send}
          disabled={loading}
        />

        {/* Error banner for landing state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-red-900/80 border border-red-500/40 text-red-200 text-xs px-4 py-2 rounded-xl backdrop-blur-sm max-w-sm text-center"
            >
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-300 hover:text-white underline"
              >
                Fechar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Chat state (messages exist) ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-link-blue/95 backdrop-blur border-b border-blue-900/50 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-link-yellow rounded shadow-[0_0_10px_rgba(245,196,0,0.4)]" />
          <span className="font-bold text-white tracking-wide">
            MBA LINK <span className="text-link-yellow">T3</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="text-blue-300/70 hover:text-white text-xs transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            Nova conversa
          </button>
          <span className="text-blue-200/60 text-xs hidden sm:block">{userEmail}</span>
          <button
            onClick={logout}
            className="text-blue-300 hover:text-white text-sm transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="bg-red-900/70 border-b border-red-500/30 text-red-200 text-xs px-4 py-2 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-300 hover:text-white underline flex-shrink-0"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <Message
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isStreaming={
                  loading &&
                  idx === messages.length - 1 &&
                  msg.role === "assistant"
                }
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator: only when loading and last assistant message is still empty */}
          {loading && messages[messages.length - 1]?.content === "" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-link-yellow flex-shrink-0 mt-1 shadow-[0_0_12px_rgba(245,196,0,0.3)]" />
              <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-link-yellow rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-5 pt-2 flex-shrink-0 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          <MBAPromptBox
            onSend={send}
            onStop={stopGeneration}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
