"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type ExportData = {
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  author: string;
  version: number;
  content: string;
  useCases: string | null;
  inputExamples: string | null;
  outputExamples: string | null;
  instructions: string | null;
};

function toMarkdown(data: ExportData): string {
  const frontmatterFields: string[] = [];
  frontmatterFields.push(`title: ${JSON.stringify(data.title)}`);
  if (data.description) frontmatterFields.push(`description: ${JSON.stringify(data.description)}`);
  if (data.author) frontmatterFields.push(`author: ${JSON.stringify(data.author)}`);
  if (data.category) frontmatterFields.push(`category: ${JSON.stringify(data.category)}`);
  if (data.tags.length > 0) frontmatterFields.push(`tags:\n${data.tags.map((t) => `  - ${t}`).join("\n")}`);
  if (data.version) frontmatterFields.push(`version: ${data.version}`);

  let md = `---\n${frontmatterFields.join("\n")}\n---\n\n`;
  md += data.content;
  return md;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function ExportPrompt({ data }: { data: ExportData }) {
  const [open, setOpen] = useState(false);
  const slug = slugify(data.title);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
      >
        <Download className="h-4 w-4 mr-1" />
        Exporter
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 rounded-md border bg-popover p-1 shadow-md">
          <button
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
            onClick={() => {
              downloadFile(`${slug}.md`, toMarkdown(data), "text/markdown");
              setOpen(false);
            }}
          >
            Markdown (.md)
          </button>
          <button
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
            onClick={() => {
              downloadFile(`${slug}.json`, JSON.stringify(data, null, 2), "application/json");
              setOpen(false);
            }}
          >
            JSON (.json)
          </button>
        </div>
      )}
    </div>
  );
}
