import { create } from "zustand";
import type { LLMProvider } from "@/lib/types";

interface SettingsState {
  llmProvider: LLMProvider;
  geminiAvailable: boolean;
  ollamaAvailable: boolean;
  setSettings: (provider: LLMProvider, geminiOk: boolean, ollamaOk: boolean) => void;
  setProvider: (provider: LLMProvider) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  llmProvider: "gemini",
  geminiAvailable: true,
  ollamaAvailable: false,
  setSettings: (provider, geminiOk, ollamaOk) =>
    set({
      llmProvider: provider,
      geminiAvailable: geminiOk,
      ollamaAvailable: ollamaOk,
    }),
  setProvider: (provider) => set({ llmProvider: provider }),
}));
