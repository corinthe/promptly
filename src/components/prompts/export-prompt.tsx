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
  let md = `# ${data.title}\n\n`;
  md += `> ${data.description}\n\n`;
  md += `**Auteur** : ${data.author}  \n`;
  if (data.category) md += `**Catégorie** : ${data.category}  \n`;
  if (data.tags.length > 0) md += `**Tags** : ${data.tags.join(", ")}  \n`;
  md += `**Version** : ${data.version}\n\n`;
  md += `---\n\n`;
  md += `## Contenu du prompt\n\n\`\`\`\n${data.content}\n\`\`\`\n\n`;
  if (data.useCases) md += `## Cas d'usage\n\n${data.useCases}\n\n`;
  if (data.inputExamples) md += `## Exemples d'input\n\n\`\`\`\n${data.inputExamples}\n\`\`\`\n\n`;
  if (data.outputExamples) md += `## Exemples d'output\n\n\`\`\`\n${data.outputExamples}\n\`\`\`\n\n`;
  if (data.instructions) md += `## Instructions d'utilisation\n\n${data.instructions}\n`;
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
