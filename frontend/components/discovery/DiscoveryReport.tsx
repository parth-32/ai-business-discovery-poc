"use client";

import React from "react";
import type { DiscoveryData, InputItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Target, Activity, AlertTriangle, AlertCircle, CheckSquare, FileText } from "lucide-react";

interface DiscoveryReportProps {
  discovery: DiscoveryData;
  inputs?: InputItem[];
}

export function DiscoveryReport({ discovery, inputs }: DiscoveryReportProps) {
  const getInputName = (srcId: string): string => {
    if (!inputs || inputs.length === 0) {
      if (srcId.startsWith("input-")) return `Input ${srcId.replace("input-", "#")}`;
      return srcId.length > 12 ? srcId.slice(0, 8) : srcId;
    }

    const found = inputs.find(
      (inp) => inp.id === srcId || inp.id.startsWith(srcId) || srcId.startsWith(inp.id)
    );

    if (found) {
      return found.filename;
    }

    const numericMatch = srcId.match(/\d+/);
    if (numericMatch) {
      const idx = parseInt(numericMatch[0], 10) - 1;
      if (inputs[idx]) {
        return inputs[idx].filename;
      }
    }

    return srcId.length > 12 ? srcId.slice(0, 8) : srcId;
  };

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={["overview", "pain_points", "requirements", "gaps"]}
        className="w-full space-y-4"
      >
        {/* 1. Main Goal & Current Process */}
        <AccordionItem value="overview" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-base">
              <Target className="h-5 w-5" /> Main Goal & Current Process Overview
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-600">
                    <Target className="h-4 w-4" /> Main Business Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm leading-relaxed">
                  {discovery.main_goal}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-600">
                    <Activity className="h-4 w-4" /> Current Process (Reconstructed)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm leading-relaxed">
                  {discovery.current_process}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Pain Points with Traceability */}
        <AccordionItem value="pain_points" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-base">
              <AlertTriangle className="h-5 w-5" /> Identified Pain Points ({discovery.pain_points.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-3">
            {discovery.pain_points.map((pp, idx) => (
              <div key={pp.id ? `${pp.id}-${idx}` : idx} className="p-3 border rounded-md bg-amber-500/5 border-amber-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">
                    <span className="font-mono text-amber-700 font-bold mr-2">[{pp.id}]</span>
                    {pp.description}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pp.source_input_ids.map((srcId, srcIdx) => (
                      <Badge
                        key={`${srcId}-${srcIdx}`}
                        variant="outline"
                        className="text-[10px] bg-background font-medium flex items-center gap-1 text-muted-foreground border-amber-300/60"
                        title={`Source Document ID: ${srcId}`}
                      >
                        <FileText className="h-3 w-3 text-amber-600 shrink-0" />
                        <span>{getInputName(srcId)}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* 3. Key Solution Requirements */}
        <AccordionItem value="requirements" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-base">
              <CheckSquare className="h-5 w-5" /> Key Solution Requirements ({discovery.requirements.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-2">
            {discovery.requirements.map((req, idx) => (
              <div key={req.id ? `${req.id}-${idx}` : idx} className="text-sm p-2.5 rounded bg-muted/40 border text-muted-foreground space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-emerald-600 mr-2">[{req.id}]</span>
                    <span className="text-foreground font-medium">{req.description}</span>
                  </div>
                  {req.source_input_ids && req.source_input_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {req.source_input_ids.map((srcId, srcIdx) => (
                        <Badge
                          key={`${srcId}-${srcIdx}`}
                          variant="outline"
                          className="text-[10px] bg-background font-medium flex items-center gap-1 text-muted-foreground border-emerald-300/60"
                          title={`Source Document ID: ${srcId}`}
                        >
                          <FileText className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{getInputName(srcId)}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* 4. Gaps & Unclear Information */}
        <AccordionItem value="gaps" className="border rounded-xl bg-card px-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-base">
              <AlertCircle className="h-5 w-5" /> Gaps & Unclear Information ({discovery.gaps.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-2">
            {discovery.gaps.map((gap, idx) => (
              <div key={gap.id ? `${gap.id}-${idx}` : idx} className="text-sm p-2 rounded border border-red-200 bg-background text-red-700">
                <span className="font-mono font-bold mr-2">[{gap.id}]</span>
                {gap.description}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
