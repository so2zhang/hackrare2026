"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FunctionalityScore,
  ClinicalCorrelation,
  TherapeuticContext,
} from "@/lib/prediction-score";

const SCORE_RING_COLORS: Record<string, string> = {
  emerald: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  gray: "#94a3b8",
};

function ScoreRing({ score, color, size = 96 }: { score: number; color: string; size?: number }) {
  const hex = SCORE_RING_COLORS[color] ?? SCORE_RING_COLORS.gray;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="6"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={hex}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={hex}
        style={{ fontSize: size * 0.28, fontWeight: 800, fontFamily: "system-ui, sans-serif" }}
      >
        {score}
      </text>
    </svg>
  );
}

export function FunctionalityCard({ score }: { score: FunctionalityScore }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4">
          <ScoreRing score={score.overall} color={score.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold">Functionality Score</h3>
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{ borderColor: SCORE_RING_COLORS[score.color], color: SCORE_RING_COLORS[score.color] }}
              >
                {score.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {score.summary}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1.5 rounded bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Frame</p>
                <p className="text-sm font-semibold">{score.frameScore}%</p>
              </div>
              <div className="text-center p-1.5 rounded bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Length</p>
                <p className="text-sm font-semibold">{score.lengthScore}%</p>
              </div>
              <div className="text-center p-1.5 rounded bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Domains</p>
                <p className="text-sm font-semibold">{score.domainScore}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  Mild: "#10b981",
  Moderate: "#f59e0b",
  Severe: "#ef4444",
  Unknown: "#94a3b8",
};

export function ClinicalCard({ correlation }: { correlation: ClinicalCorrelation }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold">Clinical Correlation</h3>
          {correlation.knownPattern && (
            <Badge variant="secondary" className="text-[10px]">Known genotype</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-2.5 rounded-md border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Severity</p>
            <p className="text-sm font-semibold" style={{ color: SEVERITY_COLORS[correlation.severity] }}>
              {correlation.severity}
            </p>
          </div>
          <div className="p-2.5 rounded-md border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Ambulatory</p>
            <p className="text-sm font-semibold" style={{ color: SEVERITY_COLORS[correlation.ambulatory === "Likely" ? "Mild" : correlation.ambulatory === "Possible" ? "Moderate" : correlation.ambulatory === "Unlikely" ? "Severe" : "Unknown"] }}>
              {correlation.ambulatory}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {correlation.precedent}
        </p>
      </CardContent>
    </Card>
  );
}

const FEASIBILITY_COLORS: Record<string, string> = {
  High: "#10b981",
  Moderate: "#f59e0b",
  Low: "#ef4444",
};

export function TherapeuticCard({ context }: { context: TherapeuticContext }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold">Therapeutic Feasibility</h3>
          <Badge
            variant="outline"
            className="text-[10px]"
            style={{ borderColor: FEASIBILITY_COLORS[context.feasibility], color: FEASIBILITY_COLORS[context.feasibility] }}
          >
            {context.feasibility}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2.5 rounded-md border text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Exons to Skip</p>
            <p className="text-sm font-semibold">{context.exonsToSkip || "—"}</p>
          </div>
          <div className="p-2.5 rounded-md border text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Approved Drug</p>
            <p className="text-sm font-semibold" style={{ color: context.hasApprovedDrug ? "#10b981" : "#94a3b8" }}>
              {context.hasApprovedDrug ? "Yes" : "No"}
            </p>
          </div>
          <div className="p-2.5 rounded-md border text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">In Pipeline</p>
            <p className="text-sm font-semibold">{context.pipelineOptions || "—"}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {context.feasibilityReason}
        </p>

        {context.closestDrug && (
          <div className="mt-2.5 p-2 rounded-md bg-muted/50 flex items-center gap-2">
            <Badge variant={context.closestDrug.status === "approved" ? "default" : "secondary"} className="text-[10px] shrink-0">
              {context.closestDrug.status === "approved" ? "FDA Approved" : context.closestDrug.status.toUpperCase()}
            </Badge>
            <p className="text-xs font-medium truncate">{context.closestDrug.drugName}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
