"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/inputs/FileUpload";
import { SampleDataLoader } from "@/components/home/SampleDataLoader";
import { DiscoveryReport } from "@/components/discovery/DiscoveryReport";
import { SolutionOutline } from "@/components/solution/SolutionOutline";
import { PocPreview } from "@/components/poc/PocPreview";
import { PipelineProgress } from "@/components/pipeline/PipelineProgress";
import { LlmSettings } from "@/components/settings/LlmSettings";
import { ArrowLeft, FileCheck, Target, Lightbulb, Code, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"inputs" | "discovery" | "solution" | "poc">("inputs");

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handlePipelineComplete = () => {
    handleRefresh();
    setActiveTab("discovery");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Loading project workspace...
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-background p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-destructive">Project Not Found</h2>
        <Button onClick={() => router.push("/")}>Back to Projects</Button>
      </div>
    );
  }

  const hasInputs = project.inputs.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Workspace Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">{project.name}</h1>
                <Badge variant={project.status === "completed" ? "default" : "outline"} className="text-[10px] capitalize">
                  {project.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">ID: {project.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 text-xs gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
            <LlmSettings />
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Pipeline Control Header Component */}
        <PipelineProgress projectId={projectId} hasInputs={hasInputs} onComplete={handlePipelineComplete} />

        {/* Tab Navigation */}
        <div className="flex border-b border-border space-x-1">
          <button
            onClick={() => setActiveTab("inputs")}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "inputs"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCheck className="h-4 w-4" /> 1. Client Inputs ({project.inputs.length})
          </button>

          <button
            onClick={() => setActiveTab("discovery")}
            disabled={!project.discovery}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "discovery"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            } ${!project.discovery ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Target className="h-4 w-4" /> 2. Business Discovery
          </button>

          <button
            onClick={() => setActiveTab("solution")}
            disabled={!project.solution}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "solution"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            } ${!project.solution ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Lightbulb className="h-4 w-4" /> 3. Solution Outline
          </button>

          <button
            onClick={() => setActiveTab("poc")}
            disabled={!project.poc}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "poc"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            } ${!project.poc ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Code className="h-4 w-4" /> 4. Working POC Application
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="pt-2">
          {activeTab === "inputs" && (
            <div className="space-y-6">
              <FileUpload projectId={projectId} inputs={project.inputs} onRefresh={handleRefresh} />
              {project.inputs.length === 0 && (
                <SampleDataLoader projectId={projectId} onLoaded={handleRefresh} />
              )}
            </div>
          )}

          {activeTab === "discovery" && project.discovery && (
            <DiscoveryReport discovery={project.discovery} />
          )}

          {activeTab === "solution" && project.solution && (
            <SolutionOutline solution={project.solution} />
          )}

          {activeTab === "poc" && project.poc && (
            <PocPreview projectId={projectId} poc={project.poc} />
          )}
        </div>
      </main>
    </div>
  );
}
