"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUpIcon,
  Target,
  TrendingUp,
  RefreshCw,
  BarChart2,
  DollarSign,
  Waves,
  AlertTriangle,
  Calculator,
} from "lucide-react";

// ── Auto-resize hook ──────────────────────────────────────────────────────────

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

// ── Animated background radial glow ──────────────────────────────────────────

function AnimatedGlow() {
  return (
    <>
      {/* Animated top-right blue glow */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 80% 10%, rgba(0,48,135,0.60) 0%, transparent 65%)",
          animation: "glowPulseBlue 8s ease-in-out infinite",
        }}
      />
      {/* Animated bottom-left yellow glow */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 90%, rgba(245,196,0,0.14) 0%, transparent 60%)",
          animation: "glowPulseYellow 10s ease-in-out infinite",
        }}
      />
      {/* Slow-moving center radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(0,48,135,0.12) 0%, transparent 70%)",
          animation: "glowDrift 14s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes glowPulseBlue {
          0%, 100% { opacity: 0.85; transform: scale(1) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.06) translate(-16px, 12px); }
        }
        @keyframes glowPulseYellow {
          0%, 100% { opacity: 0.75; transform: scale(1) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.1) translate(12px, -10px); }
        }
        @keyframes glowDrift {
          0% { transform: translate(-3%, 2%); }
          100% { transform: translate(3%, -2%); }
        }
      `}</style>
    </>
  );
}

// ── Quick actions definition ──────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "5 Forças de Porter" },
  { icon: <BarChart2 className="w-3.5 h-3.5" />, label: "Matriz BCG" },
  { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Unit Economics" },
  { icon: <Target className="w-3.5 h-3.5" />, label: "OKRs na prática" },
  { icon: <Waves className="w-3.5 h-3.5" />, label: "Blue Ocean Strategy" },
  { icon: <RefreshCw className="w-3.5 h-3.5" />, label: "SCRUM framework" },
  { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Pre Mortem" },
  { icon: <Calculator className="w-3.5 h-3.5" />, label: "Valuation: como calcular?" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface MBALandingInputProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * onSend accepts an optional content string so quick-action buttons can
   * bypass React's asynchronous state update and send the label immediately,
   * without waiting for onChange to propagate.
   */
  onSend: (content?: string) => void;
  disabled?: boolean;
}

// ── MBALandingChat ────────────────────────────────────────────────────────────

export function MBALandingChat({
  value,
  onChange,
  onSend,
  disabled,
}: MBALandingInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 52,
    maxHeight: 160,
  });

  const [focused, setFocused] = useState(false);
  const hasContent = value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasContent && !disabled) onSend();
    }
  };

  return (
    <div
      className="relative w-full min-h-screen flex flex-col items-center overflow-y-auto"
      style={{
        background:
          "linear-gradient(160deg, #060a12 0%, #0a1220 50%, #060a12 100%)",
      }}
    >
      {/* ── Grid overlay ─────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* ── Animated glows ───────────────────────────────────────────────────── */}
      <AnimatedGlow />

      {/* ── Hero section ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center pt-16 pb-8 px-4">
        <div className="text-center">
          {/* Logo row */}
          <div className="inline-flex items-center gap-2.5 mb-8">
            <div
              className="w-7 h-7 bg-link-yellow rounded-md flex-shrink-0"
              style={{ boxShadow: "0 0 18px rgba(245,196,0,0.55)" }}
            />
            <span className="text-sm font-semibold tracking-[0.18em] uppercase text-link-yellow/75">
              Link School of Business
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight drop-shadow-sm">
            MBA LINK{" "}
            <span
              className="text-link-yellow"
              style={{ textShadow: "0 0 30px rgba(245,196,0,0.35)" }}
            >
              T3
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Seu tutor de MBA com IA. Pergunte sobre qualquer framework, case ou
            conceito das aulas.
          </p>

          {/* Index badge */}
          <p className="mt-3 text-neutral-600 text-xs tracking-wide">
            125 materiais · 3.075 trechos indexados
          </p>
        </div>
      </div>

      {/* ── Input + Quick Actions ─────────────────────────────────────────────── */}
      <div className="relative w-full max-w-2xl px-4 pb-20 sm:pb-24">
        {/* Glassmorphism input box */}
        <div
          className={cn(
            "relative rounded-2xl border transition-all duration-300",
            "bg-white/5 backdrop-blur-xl",
            focused
              ? "border-link-yellow/30 shadow-[0_0_30px_rgba(245,196,0,0.08),0_8px_40px_rgba(0,0,0,0.6)]"
              : "border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Pergunte sobre Porter's 5 Forças, OKRs, Valuation, SCRUM..."
            disabled={disabled}
            className={cn(
              "w-full px-4 py-4 resize-none border-none min-h-[52px]",
              "bg-transparent text-white text-sm leading-relaxed",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-600"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer bar */}
          <div className="flex items-center justify-between px-3.5 pb-3.5">
            <span className="text-[11px] text-neutral-700 hidden sm:block select-none">
              Enter para enviar · Shift+Enter nova linha
            </span>
            <Button
              onClick={() => onSend()}
              disabled={!hasContent || !!disabled}
              className={cn(
                "ml-auto h-8 w-8 rounded-full p-0 transition-all duration-200",
                hasContent && !disabled
                  ? "bg-link-yellow text-gray-950 hover:brightness-110 shadow-[0_0_14px_rgba(245,196,0,0.45)]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
              <ArrowUpIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick action pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              disabled={!!disabled}
              onClick={() => {
                // Pass label directly to onSend to bypass async state update.
                // This avoids the race condition where onChange hasn't propagated
                // before onSend() reads stale input state.
                onSend(action.label);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs",
                "border border-white/10 bg-white/[0.04] text-neutral-400",
                "backdrop-blur-sm transition-all duration-200",
                "hover:text-white hover:bg-white/10 hover:border-link-yellow/30",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.04] disabled:hover:text-neutral-400 disabled:hover:border-white/10"
              )}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
