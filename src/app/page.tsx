"use client";

import { useState } from "react";
import { MutationInputForm } from "@/components/mutation-input";
import { ResultsDashboard } from "@/components/results-dashboard";
import { MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { ProteinSimulation, simulateProtein } from "@/lib/framemath/protein-sim";
import { analyzeDisease } from "@/lib/diseases";
import { getGeneProfile } from "@/lib/framemath/engine";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [simulation, setSimulation] = useState<ProteinSimulation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(mutation: MutationInput) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSimulation(null);

    try {
      const analysisResult = analyzeDisease(mutation);
      setResult(analysisResult);

      const profile = getGeneProfile(mutation.gene);
      if (profile) {
        const skippedExons = analysisResult.bestStrategy?.exonsToSkip ?? [];
        const sim = simulateProtein(profile, mutation.affectedExons, skippedExons);
        setSimulation(sim);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Fs</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">FrameShift Rx</h1>
              <p className="text-xs text-muted-foreground">
                Exon Skipping Analysis for Rare Diseases
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              DMD
            </Badge>
            <Badge variant="outline" className="text-xs">
              LGMD
            </Badge>
            <Badge variant="outline" className="text-xs">
              Usher
            </Badge>
            <Badge variant="outline" className="text-xs">
              DM1
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero section */}
        {!result && (
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Can this frameshift be corrected?
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter a patient&apos;s mutation to see if exon skipping can restore the
              reading frame, what the resulting protein would look like, and which
              approved therapies or trials could help.
            </p>
          </div>
        )}

        <div className={result ? "grid gap-8 lg:grid-cols-[380px_1fr]" : "max-w-xl mx-auto"}>
          {/* Input Form */}
          <div className={result ? "" : ""}>
            <MutationInputForm onSubmit={handleAnalyze} isLoading={isLoading} />
          </div>

          {/* Results */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {result && (
            <div>
              <ResultsDashboard result={result} simulation={simulation} />
            </div>
          )}
        </div>

        {/* How it works (shown when no results) */}
        {!result && (
          <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Input Mutation</h3>
              <p className="text-sm text-muted-foreground">
                Select the gene and specify which exons are deleted, duplicated,
                or affected by the patient&apos;s mutation.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Frame Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our engine calculates if the reading frame is disrupted and finds
                exon-skipping strategies to restore it.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Therapy Match</h3>
              <p className="text-sm text-muted-foreground">
                See which FDA-approved drugs or clinical trials target the
                identified exon skip, with protein impact predictions.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <p>FrameShift Rx — HackRare 2026</p>
          <p>Research tool only. Not for clinical decision-making.</p>
        </div>
      </footer>
    </div>
  );
}
