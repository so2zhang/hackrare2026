"use client";

import { Badge } from "@/components/ui/badge";

interface ConfidenceBadgeProps {
  level: "high" | "medium" | "low";
  className?: string;
}

const CONFIDENCE_CONFIG = {
  high: {
    label: "High Confidence",
    variant: "default" as const,
    className: "bg-emerald-600 hover:bg-emerald-700",
  },
  medium: {
    label: "Medium Confidence",
    variant: "secondary" as const,
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  low: {
    label: "Low Confidence",
    variant: "destructive" as const,
    className: "",
  },
};

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[level];

  return (
    <Badge variant={config.variant} className={`${config.className} ${className ?? ""}`.trim()}>
      {config.label}
    </Badge>
  );
}
