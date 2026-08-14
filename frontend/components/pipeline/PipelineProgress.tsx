"use client";

import React from "react";
import { PIPELINE_STAGES } from "@/lib/constants";
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
  const { isAnalyzing, progress, message, error, startPipeline, updateEvent, setError } =
    usePipelineStore();
  const { llmProvider } = useSettingsStore();

  const handleRunAnalysis = async () => {
    startPipeline();

    try {
      // Trigger analysis POST endpoint
      const res = await fetch(`http://localhost:8000/api/projects/${projectId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llm_provider: llmProvider }),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.detail || "Failed to start analysis");
      }

      // Connect to SSE stream
      const eventSource = new EventSource(
        `http://localhost:8000/api/projects/${projectId}/stream?provider=${llmProvider}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          updateEvent(data);

          if (data.stage === "poc" && data.status === "complete") {
            eventSource.close();
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown analysis error";
      setError(msg);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">AI Business Discovery & POC Pipeline</h3>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200 gap-1 font-medium">
              <Cpu className="h-3 w-3 text-blue-600" />
              Engine: {llmProvider === "gemini" ? "Gemini 2.5 Flash" : "Ollama (llama3.2:1b)"}
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
                  className={`p-2 rounded border text-center font-medium ${
                    isDone
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                      : isCurrent
                      ? "bg-primary/10 text-primary border-primary animate-pulse"
                      : "bg-muted/40 text-muted-foreground border-transparent"
                  }`}
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
