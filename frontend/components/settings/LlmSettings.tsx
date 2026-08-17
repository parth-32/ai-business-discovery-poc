"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { LLMProvider } from "@/lib/types";
import { Cpu, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LlmSettings() {
  const queryClient = useQueryClient();
  const {
    llmProvider,
    geminiAvailable,
    ollamaAvailable,
    geminiModel,
    ollamaModel,
    setSettings,
  } = useSettingsStore();

  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await api.getSettings();
      setSettings(
        data.llm_provider,
        data.gemini_available,
        data.ollama_available,
        data.gemini_model,
        data.ollama_model,
      );
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (provider: LLMProvider) => api.updateSettings(provider),
    onSuccess: (data) => {
      setSettings(
        data.llm_provider,
        data.gemini_available,
        data.ollama_available,
        data.gemini_model,
        data.ollama_model,
      );
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleProviderChange = (provider: LLMProvider) => {
    updateMutation.mutate(provider);
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
          disabled={updateMutation.isPending}
          className={cn(
            "px-3 py-1.5 rounded-sm transition-all flex items-center gap-1.5 font-medium text-xs cursor-pointer",
            llmProvider === "gemini"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              llmProvider === "gemini" ? "bg-white animate-pulse" : "bg-muted-foreground/40"
            )}
          />
          Gemini{geminiModel ? ` (${geminiModel})` : ""}
          {geminiAvailable ? (
            <span className="text-[10px] opacity-80">(Ready)</span>
          ) : (
            <AlertCircle className="h-3 w-3 text-amber-300" />
          )}
        </button>

        {/* Ollama Option */}
        <button
          onClick={() => handleProviderChange("ollama")}
          disabled={updateMutation.isPending}
          className={cn(
            "px-3 py-1.5 rounded-sm transition-all flex items-center gap-1.5 font-medium text-xs cursor-pointer",
            llmProvider === "ollama"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              llmProvider === "ollama" ? "bg-white animate-pulse" : "bg-muted-foreground/40"
            )}
          />
          Ollama{ollamaModel ? ` (${ollamaModel})` : ""}
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
