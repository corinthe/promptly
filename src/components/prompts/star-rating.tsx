"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useRole } from "@/components/role-provider";
import { ratePrompt } from "@/lib/actions/ratings";

export function StarRating({
  promptId,
  currentAvg,
  currentCount,
  userRating,
}: {
  promptId: string;
  currentAvg: number;
  currentCount: number;
  userRating: number | null;
}) {
  const { userId } = useRole();
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(userRating ?? 0);
  const [avg, setAvg] = useState(currentAvg);
  const [count, setCount] = useState(currentCount);

  const handleRate = async (score: number) => {
    setSelected(score);
    // Optimistic update
    const newCount = userRating ? count : count + 1;
    const newAvg = userRating
      ? (avg * count - (userRating) + score) / count
      : (avg * count + score) / newCount;
    setAvg(newAvg);
    setCount(newCount);

    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("promptId", promptId);
    fd.set("score", score.toString());
    await ratePrompt(fd);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRate(star)}
            className="transition-colors"
          >
            <Star
              className={`h-5 w-5 ${
                star <= (hover || selected)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {avg > 0 ? avg.toFixed(1) : "—"} ({count} avis)
      </span>
    </div>
  );
}
