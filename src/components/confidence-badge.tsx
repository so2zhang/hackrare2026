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
    description: "Well-validated skip strategy. Preserves critical domains. Multiple clinical precedents.",
    className: "bg-emerald-600 hover:bg-emerald-700",
  },
  medium: {
    label: "Medium Confidence",
    variant: "secondary" as const,
    description: "Frame is restored but some functional domains may be affected. Clinical data is limited.",
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  low: {
    label: "Low Confidence",
    variant: "destructive" as const,
    description: "Frame may be restored but critical domains are lost or protein is significantly truncated. Theoretical prediction only.",
    className: "",
  },
};

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[level];

  return (
    <div className={className}>
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
      <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
    </div>
  );
}
