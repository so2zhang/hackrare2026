"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProteinSimulation } from "@/lib/framemath/protein-sim";

interface ProteinComparisonProps {
  simulation: ProteinSimulation;
  geneName: string;
}

export function ProteinComparison({ simulation, geneName }: ProteinComparisonProps) {
  const {
    wildtypeLength,
    predictedLength,
    percentRetained,
    isInFrame,
    gapRegion,
  } = simulation;

  const wtBarWidth = 100;
  const predBarWidth = percentRetained;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Protein Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Wildtype {geneName}</span>
              <span className="font-mono font-medium">{wildtypeLength.toLocaleString()} aa</span>
            </div>
            <div className="h-5 bg-emerald-400 rounded-sm" style={{ width: `${wtBarWidth}%` }} />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Predicted protein</span>
              <span className="font-mono font-medium">{predictedLength.toLocaleString()} aa</span>
            </div>
            <div className="relative h-5">
              <div
                className="h-5 bg-amber-400 rounded-sm"
                style={{ width: `${Math.max(2, predBarWidth)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={isInFrame ? "default" : "destructive"} className="text-xs">
            {isInFrame ? "In-frame" : "Frameshift (truncated)"}
          </Badge>
          <Badge variant="secondary" className="text-xs">{percentRetained}% of wildtype</Badge>
          {gapRegion && (
            <Badge variant="outline" className="text-xs">
              Gap: exons {gapRegion.start}-{gapRegion.end}
            </Badge>
          )}
        </div>

        {isInFrame && percentRetained >= 70 && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            The predicted protein retains {percentRetained}% of the wildtype
            length. This level of truncation has historically been associated
            with milder clinical phenotypes.
          </p>
        )}

        {isInFrame && percentRetained < 70 && percentRetained >= 50 && (
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            The predicted protein retains {percentRetained}% of the wildtype
            length. Function may be significantly reduced depending on which
            domains are lost.
          </p>
        )}

        {!isInFrame && (
          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
            The reading frame is disrupted. Without correction, this would produce
            a truncated, non-functional protein or trigger nonsense-mediated decay.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
