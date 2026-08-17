"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PIPELINE_STAGES, API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { usePipelineStore } from "@/stores/usePipelineStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Loader2, Play, AlertCircle, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PipelineProgressProps {
  projectId: string;
  hasInputs: boolean;
  onComplete: () => void;
}

export function PipelineProgress({ projectId, hasInputs, onComplete }: PipelineProgressProps) {
  const queryClient = useQueryClient();
  const { isAnalyzing, progress, message, error, startPipeline, updateEvent, setError } =
    usePipelineStore();
  const { llmProvider, geminiModel, ollamaModel, setSettings } = useSettingsStore();

  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await api.getSettings();
      setSettings(
        data.llm_provider,
        data.gemini_available,
        data.ollama_available,
        data.gemini_model,
        data.ollama_model
      );
      return data;
    },
  });

  const activeModelDisplay = llmProvider === "gemini" ? geminiModel : ollamaModel;

  const startAnalysisMutation = useMutation({
    mutationFn: () => api.startAnalysis(projectId, llmProvider),
    onSuccess: () => {
      // Connect to SSE stream
      const eventSource = new EventSource(
        `${API_BASE_URL}/projects/${projectId}/stream?provider=${llmProvider}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          updateEvent(data);

          if (data.stage === "poc" && data.status === "complete") {
            eventSource.close();
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            onComplete();
          } else if (data.status === "error") {
            eventSource.close();
            setError(data.message);
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE stream error:", err);
        eventSource.close();
        setError("Connection to analysis stream failed");
      };
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Unknown analysis error";
      setError(msg);
    },
  });

  const handleRunAnalysis = () => {
    startPipeline();
    startAnalysisMutation.mutate();
  };

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">AI Business Discovery & POC Pipeline</h3>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200 gap-1 font-medium">
              <Cpu className="h-3 w-3 text-blue-600" />
              Engine: {activeModelDisplay}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Runs 5 sequential stages: Ingest → Extract → Synthesize → Outline → Generate POC
          </p>
        </div>
        <Button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing || !hasInputs}
          size="sm"
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Run AI Pipeline
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar & Stages indicator */}
      {isAnalyzing && (
        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Stage {progress} of 5</span>
            <span className="text-primary">{message}</span>
          </div>
          <Progress value={(progress / 5) * 100} />

          <div className="grid grid-cols-5 gap-1 text-[11px] pt-1">
            {PIPELINE_STAGES.map((s, idx) => {
              const stageNum = idx + 1;
              const isDone = stageNum < progress;
              const isCurrent = stageNum === progress;

              return (
                <div
                  key={s.id}
                  className={cn(
                    "p-2 rounded border text-center font-medium",
                    isDone && "bg-emerald-500/10 text-emerald-600 border-emerald-200",
                    isCurrent && "bg-primary/10 text-primary border-primary animate-pulse",
                    !isDone && !isCurrent && "bg-muted/40 text-muted-foreground border-transparent"
                  )}
                >
                  <div className="truncate">{s.id}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3 border border-red-200 bg-red-500/10 text-red-600 rounded text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
