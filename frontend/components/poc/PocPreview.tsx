"use client";

import React from "react";
import type { PocData } from "@/lib/types";
import { API_BASE_URL } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Download, ExternalLink } from "lucide-react";

interface PocPreviewProps {
  projectId: string;
  poc: PocData;
}

export function PocPreview({ projectId, poc }: PocPreviewProps) {
  const iframeSrc = `${API_BASE_URL}/projects/${projectId}/poc`;
  const downloadUrl = `${API_BASE_URL}/projects/${projectId}/poc/download`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Code className="h-5 w-5 text-emerald-600" /> Generated Working Application POC
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{poc.description}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={iframeSrc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> Fullscreen Preview
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href={downloadUrl} download className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Download HTML File
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-[600px] border-t bg-background overflow-hidden">
            <iframe
              src={iframeSrc}
              title="Generated POC Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-modals allow-forms"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
