"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SolutionData, DiscoveryData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Lightbulb, Layers, Users, Monitor, GitCommit, ArrowDown, AlertTriangle } from "lucide-react";
import mermaid from "mermaid";

interface SolutionOutlineProps {
  solution: SolutionData;
  discovery?: DiscoveryData | null;
}

export function SolutionOutline({ solution, discovery }: SolutionOutlineProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);

  const getPainPointInfo = (ppId: string): { label: string; fullText: string } => {
    if (!discovery || !discovery.pain_points) {
      return { label: `Solves: ${ppId}`, fullText: `Pain Point ID: ${ppId}` };
    }

    const found = discovery.pain_points.find(
      (pp) => pp.id === ppId || pp.id.toLowerCase() === ppId.toLowerCase()
    );

    if (found) {
      const shortDesc = found.description.length > 35 
        ? found.description.slice(0, 32) + "..." 
        : found.description;
      return {
        label: `Solves: ${shortDesc}`,
        fullText: `[${found.id || ppId}] ${found.description}`,
      };
    }

    return { label: `Solves: ${ppId}`, fullText: `Pain Point ID: ${ppId}` };
  };

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily: "inherit",
    });

    const renderDiagram = async () => {
      if (!mermaidRef.current || !solution.flow_steps || solution.flow_steps.length === 0) return;

      try {
        const sanitizeLabel = (text: string) => {
          return text
            .replace(/"/g, "'")
            .replace(/[\[\]\(\)\{\}]/g, "")
            .replace(/#/g, "")
            .trim();
        };

        const stepsCode = solution.flow_steps
          .map((s) => `    Step${s.step_number}["${s.step_number}. ${sanitizeLabel(s.description)}"]`)
          .join("\n");

        const arrowsCode = solution.flow_steps
          .slice(0, -1)
          .map((s, i) => `    Step${s.step_number} --> Step${solution.flow_steps[i + 1].step_number}`)
          .join("\n");

        const graphDefinition = `graph TD\n${stepsCode}\n${arrowsCode}`;
        const uniqueId = `mermaid-flow-${Math.random().toString(36).substring(2, 9)}`;

        const { svg } = await mermaid.render(uniqueId, graphDefinition);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          setRenderError(false);
        }
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setRenderError(true);
      }
    };

    renderDiagram();
  }, [solution]);

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["improvements", "features", "roles", "screens", "workflow"]} className="w-full space-y-4">
        {/* 1. Process Improvement Suggestions */}
        <AccordionItem value="improvements" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-base">
              <Lightbulb className="h-5 w-5" /> Process Improvement Suggestions ({solution.improvements.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-3">
            {solution.improvements.map((imp, idx) => (
              <div key={imp.id ? `${imp.id}-${idx}` : idx} className="p-3 border rounded-md bg-indigo-500/5 border-indigo-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">
                    <span className="font-mono text-indigo-700 font-bold mr-2">[{imp.id}]</span>
                    {imp.description}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {imp.related_pain_point_ids.map((ppId, ppIdx) => {
                      const { label, fullText } = getPainPointInfo(ppId);
                      return (
                        <Badge
                          key={`${ppId}-${ppIdx}`}
                          variant="outline"
                          className="text-[10px] bg-amber-500/10 text-amber-800 border-amber-300 font-medium flex items-center gap-1 cursor-help"
                          title={fullText}
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>{label}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* 2. Core Features List */}
        <AccordionItem value="features" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-base">
              <Layers className="h-5 w-5" /> Core Features List ({solution.features.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {solution.features.map((feat, idx) => (
              <div key={feat.id ? `${feat.id}-${idx}` : idx} className="text-sm p-3 rounded-md bg-muted/40 border">
                <div className="font-semibold text-foreground mb-1 flex items-center justify-between">
                  <span>{feat.name}</span>
                  <span className="font-mono text-[10px] text-emerald-600">[{feat.id}]</span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* 3. User Roles & Permissions */}
        <AccordionItem value="roles" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-base">
              <Users className="h-5 w-5" /> User Roles & Permissions ({solution.user_roles.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {solution.user_roles.map((role, idx) => (
              <div key={role.id ? `${role.id}-${idx}` : idx} className="text-sm p-3 rounded-md bg-muted/40 border">
                <div className="font-semibold text-foreground mb-1 flex items-center justify-between">
                  <span>{role.name}</span>
                  <span className="font-mono text-[10px] text-blue-600">[{role.id}]</span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{role.description}</div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* 4. Proposed Screens / Modules */}
        <AccordionItem value="screens" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
              <Monitor className="h-5 w-5" /> Proposed Screens / Modules ({solution.screens.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {solution.screens.map((screen, idx) => (
              <div key={screen.id ? `${screen.id}-${idx}` : idx} className="text-sm p-3 rounded-md bg-muted/40 border">
                <div className="font-semibold text-foreground mb-1 flex items-center justify-between">
                  <span>{screen.name}</span>
                  <span className="font-mono text-[10px] text-purple-600">[{screen.id}]</span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{screen.description}</div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* 5. Workflow Step Sequence */}
        <AccordionItem value="workflow" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-pink-600 font-semibold text-base">
              <GitCommit className="h-5 w-5" /> Workflow Step Sequence ({solution.flow_steps.length} Steps)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-4">
            {/* Mermaid SVG diagram container */}
            <div ref={mermaidRef} className="overflow-x-auto py-3 flex justify-center [&_svg]:max-w-full" />

            {/* Step-by-step detail timeline */}
            {(renderError || solution.flow_steps) && (
              <div className="border-t pt-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Step-by-step Flow Detail
                </div>
                {solution.flow_steps.map((step, idx) => (
                  <div key={step.step_number ? `${step.step_number}-${idx}` : idx} className="flex items-start gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <span className="w-6 h-6 rounded-full bg-pink-500/10 text-pink-600 border border-pink-200 font-bold flex items-center justify-center shrink-0">
                        {step.step_number}
                      </span>
                      {idx < solution.flow_steps.length - 1 && (
                        <ArrowDown className="h-3 w-3 text-muted-foreground/40 my-1" />
                      )}
                    </div>
                    <div className="p-3 rounded-md bg-muted/30 border flex-1 text-muted-foreground leading-relaxed">
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
