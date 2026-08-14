import { create } from "zustand";
import type { PipelineProgressEvent } from "@/lib/types";

interface PipelineState {
  isAnalyzing: boolean;
  activeStage: string;
  progress: number;
  message: string;
  error: string | null;
  startPipeline: () => void;
  updateEvent: (event: PipelineProgressEvent) => void;
  setError: (error: string) => void;
  resetPipeline: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  isAnalyzing: false,
  activeStage: "",
  progress: 0,
  message: "",
  error: null,
  startPipeline: () =>
    set({
      isAnalyzing: true,
      activeStage: "ingest",
      progress: 0,
      message: "Starting pipeline...",
      error: null,
    }),
  updateEvent: (event) =>
    set({
      activeStage: event.stage,
      progress: event.progress,
      message: event.message,
      isAnalyzing: event.status === "running" || event.progress < event.total_stages,
      error: event.status === "error" ? event.message : null,
    }),
  setError: (error) => set({ error, isAnalyzing: false }),
  resetPipeline: () =>
    set({
      isAnalyzing: false,
      activeStage: "",
      progress: 0,
      message: "",
      error: null,
    }),
}));
