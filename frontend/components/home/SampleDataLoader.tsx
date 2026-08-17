"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SAMPLE_SCENARIOS } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";

interface SampleDataLoaderProps {
  projectId: string;
  onLoaded?: () => void;
}

export function SampleDataLoader({ projectId, onLoaded }: SampleDataLoaderProps) {
  const queryClient = useQueryClient();
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const loadMutation = useMutation({
    mutationFn: (scenarioId: string) => api.loadSampleData(projectId, scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onLoaded?.();
    },
    onSettled: () => {
      setActiveScenarioId(null);
    },
  });

  const handleLoad = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    loadMutation.mutate(scenarioId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Or Start with Pre-configured Sample Client Data
        </h3>
        <p className="text-sm text-muted-foreground">
          Load realistic multi-file client inputs (transcripts, WhatsApp chats, SOP docs) to evaluate the discovery pipeline instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_SCENARIOS.map((scenario) => {
          const isLoadingThis = loadMutation.isPending && activeScenarioId === scenario.id;
          return (
            <Card key={scenario.id} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle className="text-sm font-semibold">{scenario.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {scenario.badge}
                  </Badge>
                </div>
                <CardDescription className="text-xs line-clamp-3">
                  {scenario.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  disabled={loadMutation.isPending}
                  onClick={() => handleLoad(scenario.id)}
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" /> Loading...
                    </>
                  ) : (
                    `Load ${scenario.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
