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
  const { mutation, isFrameshift, originalFrameShift, bestStrategy, strategies, therapies, warnings } = result;

  const funcScore = calculateFunctionalityScore(result, simulation, bestStrategy);
  const clinical = getClinicalCorrelation(result, bestStrategy);
  const therapeutic = getTherapeuticContext(result, bestStrategy);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Analysis Results</CardTitle>
            {bestStrategy && <ConfidenceBadge level={bestStrategy.confidence} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Gene</p>
              <p className="text-lg font-semibold">{mutation.gene}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mutation</p>
              <p className="text-lg font-semibold capitalize">{mutation.mutationType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Affected Exons</p>
              <p className="text-lg font-semibold">
                {mutation.affectedExons.length === 1
                  ? mutation.affectedExons[0]
                  : `${mutation.affectedExons[0]}-${mutation.affectedExons[mutation.affectedExons.length - 1]}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reading Frame</p>
              <Badge variant={isFrameshift ? "destructive" : "default"}>
                {isFrameshift ? `Frameshift (+${originalFrameShift}bp)` : "In-frame"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
      {isFrameshift && (
        <Card>
          <CardHeader>
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
              <div className="space-y-4">
                {strategies.slice(0, 5).map((strategy, i) => (
                  <div key={i} className="space-y-2">
                    {i > 0 && <Separator />}
                    <div className="flex items-start justify-between pt-2">
                      <div>
                        <p className="font-medium">
                          {i === 0 ? "Best Strategy: " : ""}Skip{" "}
                          {strategy.exonsToSkip.length > 1 ? "exons " : "exon "}
                          {strategy.exonsToSkip.join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {strategy.rationale}
                        </p>
                      </div>
                      <ConfidenceBadge level={strategy.confidence} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">
                        {strategy.percentWildtype}% protein retained
                      </Badge>
                      <Badge variant="outline">
                        {strategy.totalSkippedBp} bp skipped
                      </Badge>
                      {strategy.lostDomains.length > 0 && (
                        <Badge variant="secondary">
                          Lost: {strategy.lostDomains.join(", ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {strategies.length > 5 && (
                  <p className="text-sm text-muted-foreground">
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
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Matching Therapies & Trials</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {therapies.map((therapy, i) => (
              <TherapyCard key={i} therapy={therapy} />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Research Tool Disclaimer:</strong> This analysis is for
            research and educational purposes only. Exon-skipping predictions are
            based on reading frame arithmetic and curated domain annotations.
            Actual protein function depends on many factors not modeled here
            (folding, post-translational modifications, tissue-specific expression).
            Always consult clinical genetics professionals for patient care decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
