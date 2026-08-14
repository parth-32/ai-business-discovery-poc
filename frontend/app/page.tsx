"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LlmSettings } from "@/components/settings/LlmSettings";
import { Plus, FolderKanban, FileText, ArrowRight, Trash2, Calendar, CheckCircle2, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewProjectName("");
      setIsCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createMutation.mutate(newProjectName);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case "analyzing":
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200 gap-1 font-medium">
            <Loader2 className="h-3 w-3 animate-spin" /> Analyzing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-600 border-slate-200 gap-1 font-medium">
            <Clock className="h-3 w-3" /> Draft
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">AI Business Discovery & POC Generator</h1>
          </div>
          <LlmSettings />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Intro Hero banner */}
        <div className="p-5 border rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent">
          <h2 className="text-lg font-bold mb-1">Transform Scattered Requirements into Tangible Solutions</h2>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Upload meeting transcripts, WhatsApp chats, SOP PDFs, screenshots, or website URLs.
            Our 5-stage AI pipeline synthesizes the main goal, extracts pain points with strict input traceability, outlines a solution, and generates a runnable POC prototype.
          </p>
        </div>

        {/* Project List Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Discovery Projects</h3>
            <Badge variant="secondary" className="text-xs font-mono">
              {projects.length} Total
            </Badge>
          </div>
          <Button onClick={() => setIsCreating(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> New Discovery Project
          </Button>
        </div>

        {/* Create Project Dialog/Form */}
        {isCreating && (
          <Card className="border-primary">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Create New Discovery Project</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Acme Order Management Modernization"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={createMutation.isPending || !newProjectName.trim()}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Optimized Compact Project List Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading projects...</div>
        ) : projects.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <h3 className="text-base font-semibold mb-1">No Projects Found</h3>
            <p className="text-xs text-muted-foreground mb-3">Create a new project to start synthesizing client inputs.</p>
            <Button onClick={() => setIsCreating(true)} size="sm">
              Create First Project
            </Button>
          </Card>
        ) : (
          <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="divide-y">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                >
                  {/* Left info: Title & Status */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/project/${proj.id}`}
                          className="font-semibold text-sm hover:text-primary truncate"
                        >
                          {proj.name}
                        </Link>
                        {getStatusBadge(proj.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {proj.input_count} Client Inputs
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(proj.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      title="Delete project"
                      onClick={() => deleteMutation.mutate(proj.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
                      <Link href={`/project/${proj.id}`}>
                        Open Workspace <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        AI Business Discovery → POC Generator | Senior Full Stack AI Engineer Assessment
      </footer>
    </div>
  );
}
