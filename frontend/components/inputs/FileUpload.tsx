"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, Link as LinkIcon, FileText, CheckCircle, Trash2 } from "lucide-react";
import type { InputItem } from "@/lib/types";
import { INPUT_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface FileUploadProps {
  projectId: string;
  inputs: InputItem[];
  onRefresh: () => void;
}

export function FileUpload({ projectId, inputs, onRefresh }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`http://localhost:8000/api/projects/${projectId}/inputs`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setUploading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/projects/${projectId}/inputs/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("URL add failed");
      setUrl("");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (inputId: string) => {
    try {
      await fetch(`http://localhost:8000/api/projects/${projectId}/inputs/${inputId}`, {
        method: "DELETE",
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drag & Drop File Area */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Upload Documents / Images</p>
            <p className="text-xs text-muted-foreground mb-3">
              Supports PDFs, TXT, Chat exports, DOCX, PNG/JPG screenshots
            </p>
            <label>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span>Select Files</span>
              </Button>
            </label>
          </CardContent>
        </Card>

        {/* Website URL Area */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Add Website Reference URL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <input
                type="url"
                placeholder="https://client-existing-app.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="sm" className="w-full" disabled={uploading || !url.trim()}>
                Scrape & Add URL Content
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Inputs List */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Uploaded Inputs ({inputs.length})
        </h4>

        {inputs.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-muted/20">
            No inputs added yet. Upload files or select sample data to begin discovery.
          </div>
        ) : (
          <div className="space-y-2">
            {inputs.map((input) => {
              const meta = INPUT_TYPE_LABELS[input.type] || {
                label: input.type,
                badgeColor: "bg-gray-100 text-gray-800",
              };
              return (
                <div
                  key={input.id}
                  className="flex items-center justify-between p-3 border rounded-md bg-card text-sm"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-medium">{input.filename}</div>
                      <div className="text-xs text-muted-foreground font-mono">ID: {input.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={meta.badgeColor}>
                      {meta.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(input.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
