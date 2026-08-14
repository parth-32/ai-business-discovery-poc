"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { LLMProvider } from "@/lib/types";
import { Cpu, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LlmSettings() {
  const {
    llmProvider,
    geminiAvailable,
    ollamaAvailable,
    setSettings,
    setProvider,
  } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(
          data.llm_provider,
          data.gemini_available,
          data.ollama_available,
        );
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }, [setSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleProviderChange = async (provider: LLMProvider) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llm_provider: provider }),
      });
      if (res.ok) {
        setProvider(provider);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-card border rounded-lg shadow-sm text-xs">
      <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-foreground">Active Model:</span>
      </div>

      <div className="flex items-center p-0.5 bg-muted rounded-md border">
        {/* Gemini Option */}
        <button
          onClick={() => handleProviderChange("gemini")}
          disabled={loading}
          className={`px-3 py-1.5 rounded-sm transition-all flex items-center gap-1.5 font-medium text-xs cursor-pointer ${
            llmProvider === "gemini"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${llmProvider === "gemini" ? "bg-white animate-pulse" : "bg-muted-foreground/40"}`}
          />
          gemma-4-26b-a4b-it {llmProvider}
          {geminiAvailable ? (
            <span className="text-[10px] opacity-80">(Ready)</span>
          ) : (
            <AlertCircle className="h-3 w-3 text-amber-300" />
          )}
        </button>

        {/* Ollama Option */}
        <button
          onClick={() => handleProviderChange("ollama")}
          disabled={loading}
          className={`px-3 py-1.5 rounded-sm transition-all flex items-center gap-1.5 font-medium text-xs cursor-pointer ${
            llmProvider === "ollama"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${llmProvider === "ollama" ? "bg-white animate-pulse" : "bg-muted-foreground/40"}`}
          />
          Ollama (llama3.2:1b)
          {ollamaAvailable ? (
            <span className="text-[10px] opacity-80">(Local)</span>
          ) : (
            <span className="text-[10px] opacity-60">(Offline)</span>
          )}
        </button>
      </div>

      <Badge
        variant="outline"
        className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border-emerald-200"
      >
        Fallback: {llmProvider === "gemini" ? "Ollama" : "Gemini"}
      </Badge>
    </div>
  );
}
