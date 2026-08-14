"use client";

import React from "react";
import type { DiscoveryData } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Activity, AlertTriangle, AlertCircle, CheckSquare } from "lucide-react";

interface DiscoveryReportProps {
  discovery: DiscoveryData;
}

export function DiscoveryReport({ discovery }: DiscoveryReportProps) {
  return (
    <div className="space-y-6">
      {/* Main Goal & Current Process */}
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

      {/* Pain Points with Traceability */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" /> Identified Pain Points ({discovery.pain_points.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {discovery.pain_points.map((pp, idx) => (
            <div key={pp.id ? `${pp.id}-${idx}` : idx} className="p-3 border rounded-md bg-amber-500/5 border-amber-200">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">
                  <span className="font-mono text-amber-700 font-bold mr-2">[{pp.id}]</span>
                  {pp.description}
                </div>
                <div className="flex flex-wrap gap-1">
                  {pp.source_input_ids.map((srcId, srcIdx) => (
                    <Badge key={`${srcId}-${srcIdx}`} variant="outline" className="text-[10px] bg-background font-mono">
                      src: {srcId.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Requirements & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-600">
              <CheckSquare className="h-4 w-4" /> Key Solution Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {discovery.requirements.map((req, idx) => (
              <div key={req.id ? `${req.id}-${idx}` : idx} className="text-sm p-2 rounded bg-muted/40 border text-muted-foreground">
                <span className="font-mono font-bold text-emerald-600 mr-2">[{req.id}]</span>
                {req.description}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-500/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" /> Gaps & Unclear Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {discovery.gaps.map((gap, idx) => (
              <div key={gap.id ? `${gap.id}-${idx}` : idx} className="text-sm p-2 rounded border border-red-200 bg-background text-red-700">
                <span className="font-mono font-bold mr-2">[{gap.id}]</span>
                {gap.description}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
