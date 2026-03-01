import { AnalysisResult, SkipStrategy, TherapyMatch } from "@/lib/framemath/types";
import { ProteinSimulation } from "@/lib/framemath/protein-sim";

export interface FunctionalityScore {
  overall: number;
  lengthScore: number;
  domainScore: number;
  frameScore: number;
  label: "High" | "Moderate" | "Low" | "Very Low" | "None";
  color: "emerald" | "amber" | "orange" | "red" | "gray";
  summary: string;
}

export interface ClinicalCorrelation {
  knownPattern: boolean;
  patternDescription: string;
  severity: "Mild" | "Moderate" | "Severe" | "Unknown";
  ambulatory: "Likely" | "Possible" | "Unlikely" | "Unknown";
  precedent: string;
}

export interface TherapeuticContext {
  feasibility: "High" | "Moderate" | "Low";
  feasibilityReason: string;
  exonsToSkip: number;
  hasApprovedDrug: boolean;
  closestDrug: TherapyMatch | null;
  pipelineOptions: number;
}

const ESSENTIAL_DOMAINS: Record<string, string[]> = {
  DMD: ["actin-binding-1", "dystroglycan-binding", "syntrophin-binding", "nNOS-binding"],
  DYSF: ["C2A", "C2B", "transmembrane"],
  USH2A: ["laminin-G-1", "transmembrane"],
  DMPK: ["kinase-catalytic"],
};

const DISPENSABLE_DOMAINS: Record<string, string[]> = {
  DMD: [
    "spectrin-4", "spectrin-5", "spectrin-6", "spectrin-7", "spectrin-8",
    "spectrin-9", "spectrin-10", "spectrin-11", "spectrin-12", "spectrin-13",
    "spectrin-14", "spectrin-15", "spectrin-16", "spectrin-17", "spectrin-18",
    "spectrin-19", "spectrin-20",
  ],
};

const KNOWN_BECKER_DELETIONS: Record<string, { exons: string; severity: string; notes: string }[]> = {
  DMD: [
    { exons: "45-47", severity: "Mild", notes: "Common Becker deletion. Patients typically ambulatory into 40s-60s." },
    { exons: "45-48", severity: "Mild", notes: "Well-documented mild Becker phenotype with late-onset cardiomyopathy." },
    { exons: "45-49", severity: "Mild", notes: "Becker phenotype. Rod domain shortening with preserved terminal domains." },
    { exons: "45-51", severity: "Mild", notes: "In-frame deletion seen in mild Becker patients." },
    { exons: "45-55", severity: "Moderate", notes: "Large in-frame deletion. Some patients ambulatory, variable cardiac involvement." },
    { exons: "3-7", severity: "Mild", notes: "Classic mild Becker. N-terminal truncation with alternative start site usage." },
    { exons: "3-9", severity: "Mild", notes: "N-terminal deletion. Mild Becker with preserved ambulation." },
    { exons: "13-17", severity: "Moderate", notes: "Mid-rod deletion. Becker with moderate symptoms." },
    { exons: "48-51", severity: "Mild", notes: "Central rod domain deletion. Mild Becker phenotype." },
    { exons: "48-53", severity: "Moderate", notes: "Larger rod deletion. Variable severity." },
  ],
};

export function calculateFunctionalityScore(
  result: AnalysisResult,
  simulation: ProteinSimulation | null,
  strategy: SkipStrategy | null,
): FunctionalityScore {
  if (!strategy || !strategy.restoredFrame) {
    return {
      overall: 0,
      lengthScore: 0,
      domainScore: 0,
      frameScore: 0,
      label: "None",
      color: "gray",
      summary: "No viable exon-skipping strategy found to restore the reading frame.",
    };
  }

  const frameScore = strategy.restoredFrame ? 100 : 0;

  const pct = strategy.percentWildtype;
  let lengthScore: number;
  if (pct >= 90) lengthScore = 100;
  else if (pct >= 80) lengthScore = 85;
  else if (pct >= 70) lengthScore = 70;
  else if (pct >= 60) lengthScore = 55;
  else if (pct >= 50) lengthScore = 40;
  else lengthScore = Math.max(10, pct * 0.6);

  const gene = result.mutation.gene.toUpperCase();
  const essential = ESSENTIAL_DOMAINS[gene] ?? [];
  const dispensable = DISPENSABLE_DOMAINS[gene] ?? [];
  const lost = strategy.lostDomains;
  const essentialLost = lost.filter((d) => essential.some((e) => d.includes(e)));
  const dispensableLost = lost.filter((d) => dispensable.some((e) => d.includes(e)));
  const otherLost = lost.length - essentialLost.length - dispensableLost.length;

  let domainScore = 100;
  domainScore -= essentialLost.length * 30;
  domainScore -= otherLost * 10;
  domainScore -= dispensableLost.length * 2;
  domainScore = Math.max(0, Math.min(100, domainScore));

  const overall = Math.round(
    frameScore * 0.25 + lengthScore * 0.35 + domainScore * 0.40
  );

  let label: FunctionalityScore["label"];
  let color: FunctionalityScore["color"];
  let summary: string;

  if (overall >= 75) {
    label = "High";
    color = "emerald";
    summary = `The predicted protein retains ${pct}% of its original length with key functional domains intact. This pattern is consistent with a milder, Becker-like phenotype.`;
  } else if (overall >= 55) {
    label = "Moderate";
    color = "amber";
    summary = `The protein retains ${pct}% of its length. Some functional capacity is expected, but clinical severity depends on which specific domains are affected.`;
  } else if (overall >= 35) {
    label = "Low";
    color = "orange";
    summary = `Significant protein truncation (${pct}% retained) or loss of important domains. The resulting protein may have limited function.`;
  } else {
    label = "Very Low";
    color = "red";
    summary = `Major structural disruption with only ${pct}% of the protein retained and/or critical domain loss. Functional rescue is unlikely with this strategy alone.`;
  }

  return { overall, lengthScore, domainScore, frameScore, label, color, summary };
}

export function getClinicalCorrelation(
  result: AnalysisResult,
  strategy: SkipStrategy | null,
): ClinicalCorrelation {
  const gene = result.mutation.gene.toUpperCase();
  const affected = result.mutation.affectedExons;
  const allRemoved = strategy
    ? [...affected, ...strategy.exonsToSkip].sort((a, b) => a - b)
    : affected;
  const removedKey = `${allRemoved[0]}-${allRemoved[allRemoved.length - 1]}`;

  const knownPatterns = KNOWN_BECKER_DELETIONS[gene] ?? [];
  const match = knownPatterns.find((p) => p.exons === removedKey);

  if (match) {
    return {
      knownPattern: true,
      patternDescription: `Deletion of exons ${match.exons} is a known genotype in the Leiden/LOVD database.`,
      severity: match.severity as ClinicalCorrelation["severity"],
      ambulatory: match.severity === "Mild" ? "Likely" : match.severity === "Moderate" ? "Possible" : "Unlikely",
      precedent: match.notes,
    };
  }

  if (!strategy || !strategy.restoredFrame) {
    return {
      knownPattern: false,
      patternDescription: "No in-frame deletion pattern to correlate.",
      severity: "Severe",
      ambulatory: "Unlikely",
      precedent: "Out-of-frame mutations typically result in absence of functional protein (Duchenne-like phenotype).",
    };
  }

  const pct = strategy.percentWildtype;
  let severity: ClinicalCorrelation["severity"] = "Unknown";
  let ambulatory: ClinicalCorrelation["ambulatory"] = "Unknown";

  if (pct >= 80) { severity = "Mild"; ambulatory = "Likely"; }
  else if (pct >= 60) { severity = "Moderate"; ambulatory = "Possible"; }
  else { severity = "Severe"; ambulatory = "Unlikely"; }

  return {
    knownPattern: false,
    patternDescription: `Deletion of exons ${removedKey} is not a well-documented genotype. Predictions are based on protein length and domain analysis.`,
    severity,
    ambulatory,
    precedent: `No exact clinical precedent found, but ${pct}% protein retention with in-frame deletion suggests a ${severity.toLowerCase()} phenotype based on similar cases.`,
  };
}

export function getTherapeuticContext(
  result: AnalysisResult,
  strategy: SkipStrategy | null,
): TherapeuticContext {
  if (!strategy) {
    return {
      feasibility: "Low",
      feasibilityReason: "No viable exon-skipping strategy identified.",
      exonsToSkip: 0,
      hasApprovedDrug: false,
      closestDrug: null,
      pipelineOptions: 0,
    };
  }

  const n = strategy.exonsToSkip.length;
  const therapies = result.therapies;
  const approved = therapies.filter((t) => t.status === "approved");
  const pipeline = therapies.filter((t) => t.status !== "approved");

  let feasibility: TherapeuticContext["feasibility"];
  let feasibilityReason: string;

  if (n === 1 && approved.length > 0) {
    feasibility = "High";
    feasibilityReason = `Single-exon skip with an FDA-approved therapy available (${approved[0].drugName}).`;
  } else if (n === 1) {
    feasibility = pipeline.length > 0 ? "Moderate" : "Moderate";
    feasibilityReason = `Single-exon skip is technically feasible with antisense oligonucleotides.${pipeline.length > 0 ? ` ${pipeline.length} drug(s) in clinical trials.` : " No targeted drugs in trials yet."}`;
  } else if (n <= 3) {
    feasibility = "Moderate";
    feasibilityReason = `Multi-exon skip (${n} exons) is more complex but has been demonstrated in research. Cocktail ASO or U7 snRNA gene therapy approaches may apply.`;
  } else {
    feasibility = "Low";
    feasibilityReason = `Skipping ${n} exons simultaneously is technically challenging. This would likely require a gene therapy approach rather than antisense oligonucleotides.`;
  }

  return {
    feasibility,
    feasibilityReason,
    exonsToSkip: n,
    hasApprovedDrug: approved.length > 0,
    closestDrug: approved[0] ?? pipeline[0] ?? null,
    pipelineOptions: pipeline.length,
  };
}
