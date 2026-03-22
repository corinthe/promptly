"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Play, RotateCcw } from "lucide-react";

function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const vars: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim();
    if (!vars.includes(name)) {
      vars.push(name);
    }
  }
  return vars;
}

function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (_, name) => {
    const trimmed = name.trim();
    return values[trimmed] || `{{${trimmed}}}`;
  });
}

export function PromptPlayground({ content }: { content: string }) {
  const variables = useMemo(() => extractVariables(content), [content]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (variables.length === 0) return null;

  const filled = fillTemplate(content, values);
  const allFilled = variables.every((v) => values[v]?.trim());

  const handleCopy = async () => {
    await navigator.clipboard.writeText(filled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setValues({});
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Playground
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Réduire" : "Ouvrir"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {variables.length} variable{variables.length > 1 ? "s" : ""} détectée{variables.length > 1 ? "s" : ""} — remplissez-les pour générer votre prompt final.
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {variables.map((variable) => (
              <div key={variable}>
                <label className="text-sm font-medium text-muted-foreground">
                  {`{{${variable}}}`}
                </label>
                <Input
                  placeholder={variable}
                  value={values[variable] || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [variable]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Aperçu</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Réinitialiser
                </Button>
                <Button size="sm" onClick={handleCopy} disabled={!allFilled}>
                  <Copy className="h-3 w-3 mr-1" />
                  {copied ? "Copié !" : "Copier le résultat"}
                </Button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono max-h-[400px] overflow-y-auto">
              {filled}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
