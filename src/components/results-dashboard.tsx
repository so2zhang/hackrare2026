"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisResult } from "@/lib/framemath/types";
import { ProteinSimulation } from "@/lib/framemath/protein-sim";
import { ExonVisualizer } from "./exon-visualizer";
import { ProteinComparison } from "./protein-comparison";
import { TherapyCard } from "./therapy-card";
import { ConfidenceBadge } from "./confidence-badge";
import { FunctionalityCard, ClinicalCard, TherapeuticCard } from "./prediction-cards";
import {
  calculateFunctionalityScore,
  getClinicalCorrelation,
  getTherapeuticContext,
} from "@/lib/prediction-score";

interface ResultsDashboardProps {
  result: AnalysisResult;
  simulation: ProteinSimulation | null;
}

export function ResultsDashboard({ result, simulation }: ResultsDashboardProps) {
  const { mutation, isFrameshift, originalFrameShift, alreadyInFrame, bestStrategy, strategies, therapies, warnings } = result;

  const funcScore = calculateFunctionalityScore(result, simulation, bestStrategy);
  const clinical = getClinicalCorrelation(result, bestStrategy);
  const therapeutic = getTherapeuticContext(result, bestStrategy);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">Analysis Results</CardTitle>
            {bestStrategy && <ConfidenceBadge level={bestStrategy.confidence} />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {bestStrategy
              ? `Best strategy: skip ${bestStrategy.exonsToSkip.length > 1 ? "exons" : "exon"} ${bestStrategy.exonsToSkip.join(", ")} — ${bestStrategy.percentWildtype}% protein retained`
              : isFrameshift
                ? "No viable exon-skipping strategy found"
                : alreadyInFrame
                  ? "Mutation is already in-frame"
                  : `In-frame ${mutation.mutationType} — skip strategy available`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gene</p>
              <p className="text-base font-semibold">{mutation.gene}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mutation</p>
              <p className="text-base font-semibold capitalize">{mutation.mutationType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Affected Exons</p>
              <p className="text-base font-semibold">
                {mutation.affectedExons.length === 1
                  ? mutation.affectedExons[0]
                  : `${mutation.affectedExons[0]}-${mutation.affectedExons[mutation.affectedExons.length - 1]}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reading Frame</p>
              <Badge variant={isFrameshift ? "destructive" : "default"} className="mt-0.5">
                {isFrameshift ? `Frameshift (+${originalFrameShift}bp)` : "In-frame"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Becker-like / already in-frame message */}
      {alreadyInFrame && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
          <AlertTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Becker-like phenotype — no exon skip needed
          </AlertTitle>
          <AlertDescription className="text-sm text-emerald-700 dark:text-emerald-300">
            This patient may already have a Becker-like phenotype — no skip needed, consider dystrophin-stabilizing approaches instead.
          </AlertDescription>
        </Alert>
      )}

      {/* Prediction Cards — the three key metrics */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FunctionalityCard score={funcScore} />
        <ClinicalCard correlation={clinical} />
        <TherapeuticCard context={therapeutic} />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, i) => (
            <Alert key={i} variant={warning.includes("essential") ? "destructive" : "default"}>
              <AlertTitle className="text-sm font-medium">
                {warning.includes("essential") ? "Critical Warning" : "Note"}
              </AlertTitle>
              <AlertDescription className="text-sm">{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Exon Visualization + Protein */}
      {simulation && (
        <Tabs defaultValue="visualization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visualization">Exon Map</TabsTrigger>
            <TabsTrigger value="protein">Protein Prediction</TabsTrigger>
          </TabsList>
          <TabsContent value="visualization" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <ExonVisualizer
                  segments={simulation.segments}
                  geneName={mutation.gene}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="protein" className="mt-4">
            <ProteinComparison simulation={simulation} geneName={mutation.gene} />
          </TabsContent>
        </Tabs>
      )}

      {/* Skip Strategies */}
      {(isFrameshift || strategies.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Exon Skipping Strategies ({strategies.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strategies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No valid exon-skipping strategy found within the search window.
                This mutation may not be amenable to single or contiguous
                multi-exon skipping.
              </p>
            ) : (
              <div className="space-y-1">
                {strategies.slice(0, 5).map((strategy, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="my-3" />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {i === 0 ? "Best Strategy: " : ""}Skip{" "}
                          {strategy.exonsToSkip.length > 1 ? "exons " : "exon "}
                          {strategy.exonsToSkip.join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {strategy.rationale}
                        </p>
                      </div>
                      <ConfidenceBadge level={strategy.confidence} className="shrink-0" />
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2.5">
                      <Badge variant="outline" className="text-xs">
                        {strategy.percentWildtype}% protein retained
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {strategy.totalSkippedBp} bp skipped
                      </Badge>
                      {strategy.lostDomains.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Lost: {strategy.lostDomains.join(", ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {strategies.length > 5 && (
                  <p className="text-sm text-muted-foreground pt-3">
                    ... and {strategies.length - 5} more strategies
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Therapies */}
      {therapies.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">Matching Therapies & Trials</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {therapies.map((therapy, i) => (
              <TherapyCard key={i} therapy={therapy} />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardContent className="py-4 px-5">
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong>Research Tool Disclaimer:</strong> This analysis is for
            research and educational purposes only. Exon-skipping predictions are
            based on reading frame arithmetic and curated domain annotations.
            Always consult clinical genetics professionals for patient care decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
