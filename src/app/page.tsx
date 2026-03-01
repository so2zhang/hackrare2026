"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import { MutationInputForm } from "@/components/mutation-input";
import { ResultsDashboard } from "@/components/results-dashboard";
import { MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { ProteinSimulation, simulateProtein } from "@/lib/framemath/protein-sim";
import { analyzeDisease } from "@/lib/diseases";
import { getGeneProfile } from "@/lib/framemath/engine";
import { Badge } from "@/components/ui/badge";
import { BeckerLogo, BeckerLogoMark } from "@/components/becker-logo";

const ProteinViewer3D = lazy(() =>
  import("@/components/protein-viewer-3d").then((m) => ({ default: m.ProteinViewer3D }))
);

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [simulation, setSimulation] = useState<ProteinSimulation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGene, setSelectedGene] = useState<string>("");

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
        const sim = simulateProtein(profile, mutation.affectedExons, skippedExons, mutation.mutationType);
        setSimulation(sim);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setSimulation(null);
    setError(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top navigation bar */}
      <header className="h-12 border-b bg-card flex items-center px-5 shrink-0">
        <div className="flex items-center gap-3 mr-8">
          <BeckerLogoMark className="h-8 w-8 shrink-0" />
          <BeckerLogo className="h-9 w-auto hidden sm:block" />
          <span className="text-sm font-semibold tracking-tight text-foreground sm:hidden">Becker</span>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Badge variant="secondary" className="font-normal text-xs cursor-default">DMD</Badge>
          <Badge variant="secondary" className="font-normal text-xs cursor-default">LGMD</Badge>
          <Badge variant="secondary" className="font-normal text-xs cursor-default">Usher</Badge>
          <Badge variant="secondary" className="font-normal text-xs cursor-default">DM1</Badge>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/validation"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Validation
          </Link>
          <span className="text-xs text-muted-foreground">
            Exon Skipping Analysis
          </span>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — input form */}
        <aside className="w-[380px] shrink-0 border-r bg-card overflow-y-auto">
          <div className="p-5">
            <MutationInputForm
              onSubmit={handleAnalyze}
              onGeneChange={setSelectedGene}
              isLoading={isLoading}
            />
          </div>
        </aside>

        {/* Right content — results or empty state */}
        <main className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-6">
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          )}

          {result ? (
            <div className="p-6 max-w-4xl">
              <div className="flex items-center justify-end mb-4">
                <button
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Clear results
                </button>
              </div>
              <ResultsDashboard result={result} simulation={simulation} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg px-6">
                {selectedGene ? (
                  <Suspense
                    fallback={
                      <div className="w-full max-w-[420px] aspect-square mx-auto rounded-2xl border bg-card flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs text-muted-foreground">Loading 3D model...</p>
                        </div>
                      </div>
                    }
                  >
                    <ProteinViewer3D gene={selectedGene} />
                    <p className="text-xs text-muted-foreground mt-6 leading-relaxed max-w-sm mx-auto">
                      Enter the affected exon(s) and click <strong>Analyze Mutation</strong> to check if exon skipping can restore the reading frame.
                    </p>
                  </Suspense>
                ) : (
                  <>
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4" />
                        <path d="M15 3h4a2 2 0 0 1 2 2v4" />
                        <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
                        <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      No analysis running
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Select a gene in the panel on the left to preview its protein structure, then enter mutation details to run an analysis.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-left">
                      <div className="p-3 rounded-md bg-card border">
                        <div className="text-xs font-medium text-primary mb-1">Step 1</div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          Select gene and enter the patient&apos;s mutation details.
                        </p>
                      </div>
                      <div className="p-3 rounded-md bg-card border">
                        <div className="text-xs font-medium text-primary mb-1">Step 2</div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          The engine finds exon-skipping strategies to restore the reading frame.
                        </p>
                      </div>
                      <div className="p-3 rounded-md bg-card border">
                        <div className="text-xs font-medium text-primary mb-1">Step 3</div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          View matched therapies, protein predictions, and trial info.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="h-8 border-t bg-card flex items-center justify-between px-5 shrink-0">
        <p className="text-[11px] text-muted-foreground">Becker — HackRare 2026</p>
        <p className="text-[11px] text-muted-foreground">Research tool only. Not for clinical decision-making.</p>
      </footer>
    </div>
  );
}
