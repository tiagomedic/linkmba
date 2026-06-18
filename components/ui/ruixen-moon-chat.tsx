"use client";

import { useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUpIcon,
  Target,
  TrendingUp,
  RefreshCw,
  Lightbulb,
  BookOpen,
  Users,
  BarChart2,
  Zap,
} from "lucide-react";

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

interface MBALandingInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function MBALandingChat({ value, onChange, onSend, disabled }: MBALandingInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  const hasContent = value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasContent) onSend();
    }
  };

  return (
    <div
      className="relative w-full h-screen flex flex-col items-center"
      style={{
        background:
          "radial-gradient(ellipse at 60% 0%, rgba(0,48,135,0.55) 0%, transparent 60%), radial-gradient(ellipse at 20% 100%, rgba(245,196,0,0.12) 0%, transparent 50%), linear-gradient(160deg, #070b14 0%, #0c1628 50%, #070b14 100%)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-link-blue/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-48 h-48 bg-link-yellow/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Centered title */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-link-yellow rounded-lg shadow-[0_0_20px_rgba(245,196,0,0.5)]" />
            <span className="text-sm font-semibold text-link-yellow/80 tracking-widest uppercase">Link School of Business</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-sm">
            MBA LINK <span className="text-link-yellow">T3</span>
          </h1>
          <p className="mt-3 text-neutral-400 text-sm sm:text-base max-w-md mx-auto">
            Seu assistente de estudos com IA. Pergunte sobre qualquer conteúdo das aulas.
          </p>
        </div>
      </div>

      {/* Input + Quick Actions */}
      <div className="relative w-full max-w-2xl px-4 mb-[16vh]">
        {/* Input Box */}
        <div className="relative bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-all duration-300 focus-within:border-link-yellow/40 focus-within:shadow-[0_8px_40px_rgba(245,196,0,0.1)]">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre OKRs, Agile, Startups, Pre Mortem..."
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3.5 resize-none border-none min-h-[48px]",
              "bg-transparent text-white text-sm",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-500"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer */}
          <div className="flex items-center justify-between px-3 pb-3">
            <span className="text-[11px] text-neutral-600 hidden sm:block">
              Enter para enviar · Shift+Enter nova linha
            </span>
            <Button
              onClick={onSend}
              disabled={!hasContent || disabled}
              className={cn(
                "ml-auto h-8 w-8 rounded-full p-0 transition-all duration-200",
                hasContent && !disabled
                  ? "bg-link-yellow text-gray-950 hover:brightness-110 shadow-[0_0_12px_rgba(245,196,0,0.4)]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
              <ArrowUpIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => { onChange(action.label); onSend(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-link-yellow/30 text-xs transition-all duration-200 backdrop-blur-sm"
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

const QUICK_ACTIONS = [
  { icon: <Target className="w-3.5 h-3.5" />, label: "O que são OKRs?" },
  { icon: <RefreshCw className="w-3.5 h-3.5" />, label: "Como funciona o SCRUM?" },
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Explique o T2D3" },
  { icon: <Lightbulb className="w-3.5 h-3.5" />, label: "O que é Pre Mortem?" },
  { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Tipos de startups" },
  { icon: <BarChart2 className="w-3.5 h-3.5" />, label: "KPI vs OKR" },
  { icon: <Users className="w-3.5 h-3.5" />, label: "Papéis do SCRUM" },
  { icon: <Zap className="w-3.5 h-3.5" />, label: "J Curve explicada" },
];
