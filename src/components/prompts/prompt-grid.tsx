import { PromptCard } from "./prompt-card";
import type { Prompt, User, Category, PromptTag, Tag } from "@/generated/prisma/client";

type PromptWithRelations = Prompt & {
  author: User;
  category: Category | null;
  tags: (PromptTag & { tag: Tag })[];
};

export function PromptGrid({ prompts }: { prompts: PromptWithRelations[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
