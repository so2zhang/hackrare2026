"use client";

import { ProteinSegment } from "@/lib/framemath/protein-sim";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExonVisualizerProps {
  segments: ProteinSegment[];
  geneName: string;
}

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-400 hover:bg-emerald-500",
  deleted: "bg-red-500 hover:bg-red-600",
  duplicated: "bg-blue-500 hover:bg-blue-600",
  inserted: "bg-violet-500 hover:bg-violet-600",
  skipped: "bg-amber-400 hover:bg-amber-500",
};

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  deleted: "Deleted (mutation)",
  duplicated: "Duplicated (mutation)",
  inserted: "Insertion (mutation)",
  skipped: "Skipped (therapeutic)",
};

export function ExonVisualizer({ segments, geneName }: ExonVisualizerProps) {
  const maxAA = Math.max(...segments.map((s) => s.aminoAcids), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium">{geneName} exon map:</span>
        <div className="flex items-center gap-3">
          {Object.entries(STATUS_LABELS)
            .filter(([status]) => status === "present" || segments.some((s) => s.status === status))
            .map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className={`h-3 w-3 rounded-sm ${STATUS_COLORS[status].split(" ")[0]}`}
              />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-[1px] overflow-x-auto pb-2">
        {segments.map((seg) => {
          const minWidth = 6;
          const scaledWidth = Math.max(
            minWidth,
            Math.round((seg.aminoAcids / maxAA) * 32)
          );

          return (
            <Tooltip key={seg.exonNumber}>
              <TooltipTrigger asChild>
                <div
                  className={`rounded-sm transition-colors cursor-pointer ${STATUS_COLORS[seg.status]}`}
                  style={{
                    width: `${scaledWidth}px`,
                    height: "40px",
                    opacity: seg.status === "present" ? 0.85 : 1,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p className="font-medium">Exon {seg.exonNumber}</p>
                  <p>{seg.aminoAcids} amino acids</p>
                  <p>Status: {STATUS_LABELS[seg.status]}</p>
                  {seg.domains.length > 0 && (
                    <p>Domains: {seg.domains.join(", ")}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>N-terminus</span>
        <span>C-terminus</span>
      </div>
    </div>
  );
}
