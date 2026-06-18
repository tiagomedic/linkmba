"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Message from "./Message";
import { MBALandingChat } from "@/components/ui/ruixen-moon-chat";
import { MBAPromptBox } from "@/components/ui/ai-prompt-box";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatInterface({ userEmail }: { userEmail: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(content?: string) {
    const text = (content ?? input).trim();
    if (!text || loading) return;

    setInput("");
    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!response.ok || !response.body) {
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const { text } = JSON.parse(data);
          accumulated += text;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: accumulated };
            return updated;
          });
        } catch {}
      }
    }

    setLoading(false);
  }

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
          onSend={() => send()}
          disabled={loading}
        />
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
            onClick={() => setMessages([])}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <Message key={i} role={msg.role} content={msg.content} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
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
          <MBAPromptBox onSend={send} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
