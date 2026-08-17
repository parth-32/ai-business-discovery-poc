import { create } from "zustand";
import type { LLMProvider } from "@/lib/types";

interface SettingsState {
  llmProvider: LLMProvider;
  geminiAvailable: boolean;
  ollamaAvailable: boolean;
  geminiModel: string;
  ollamaModel: string;
  setSettings: (
    provider: LLMProvider,
    geminiOk: boolean,
    ollamaOk: boolean,
    geminiModel?: string,
    ollamaModel?: string
  ) => void;
  setProvider: (provider: LLMProvider) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  llmProvider: "gemini",
  geminiAvailable: true,
  ollamaAvailable: false,
  geminiModel: "",
  ollamaModel: "",
  setSettings: (provider, geminiOk, ollamaOk, geminiModel = "", ollamaModel = "") =>
    set({
      llmProvider: provider,
      geminiAvailable: geminiOk,
      ollamaAvailable: ollamaOk,
      geminiModel,
      ollamaModel,
    }),
  setProvider: (provider) => set({ llmProvider: provider }),
}));
