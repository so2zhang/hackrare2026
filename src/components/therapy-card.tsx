"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TherapyMatch } from "@/lib/framemath/types";

interface TherapyCardProps {
  therapy: TherapyMatch;
}

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  approved: { label: "FDA Approved", variant: "default" },
  phase3: { label: "Phase 3", variant: "secondary" },
  phase2: { label: "Phase 2", variant: "secondary" },
  phase1: { label: "Phase 1", variant: "outline" },
  preclinical: { label: "Preclinical", variant: "outline" },
};

export function TherapyCard({ therapy }: TherapyCardProps) {
  const statusInfo = STATUS_STYLES[therapy.status] ?? {
    label: therapy.status,
    variant: "outline" as const,
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{therapy.drugName}</CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        {therapy.genericName && therapy.genericName !== therapy.drugName && (
          <p className="text-sm text-muted-foreground">{therapy.genericName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {therapy.targetExons.length > 0 && (
          <p>
            <span className="font-medium">Target:</span> Exon{" "}
            {therapy.targetExons.join(", ")} skipping
          </p>
        )}
        {therapy.sponsor && (
          <p>
            <span className="font-medium">Sponsor:</span> {therapy.sponsor}
          </p>
        )}
        {therapy.trialId && (
          <p>
            <span className="font-medium">Trial:</span>{" "}
            <a
              href={`https://clinicaltrials.gov/study/${therapy.trialId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {therapy.trialId}
            </a>
          </p>
        )}
        <p className="text-muted-foreground">{therapy.notes}</p>
      </CardContent>
    </Card>
  );
}
