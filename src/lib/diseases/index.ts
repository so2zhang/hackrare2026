import { MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { analyzeDMD } from "./dmd";
import { analyzeLGMD } from "./lgmd";
import { analyzeUsher } from "./usher";
import { analyzeMyotonic } from "./myotonic";

export type DiseaseKey = "DMD" | "DYSF" | "USH2A" | "DMPK";

export const DISEASE_INFO: Record<DiseaseKey, { name: string; gene: string; description: string }> = {
  DMD: {
    name: "Duchenne / Becker Muscular Dystrophy",
    gene: "DMD",
    description: "Progressive muscle wasting caused by mutations in the dystrophin gene. Exon skipping is the most advanced therapeutic approach.",
  },
  DYSF: {
    name: "Limb-Girdle Muscular Dystrophy 2B",
    gene: "DYSF",
    description: "Proximal muscle weakness caused by dysferlin deficiency. Exon skipping research is in early stages.",
  },
  USH2A: {
    name: "Usher Syndrome Type 2A",
    gene: "USH2A",
    description: "Combined hearing loss and progressive vision loss (retinitis pigmentosa) caused by usherin mutations.",
  },
  DMPK: {
    name: "Myotonic Dystrophy Type 1",
    gene: "DMPK",
    description: "Multi-system disorder caused by CTG repeat expansion. Treatment targets toxic RNA, not frameshifts.",
  },
};

export function analyzeDisease(mutation: MutationInput): AnalysisResult {
  const gene = mutation.gene.toUpperCase();

  switch (gene) {
    case "DMD":
      return analyzeDMD(mutation);
    case "DYSF":
      return analyzeLGMD(mutation);
    case "USH2A":
      return analyzeUsher(mutation);
    case "DMPK":
      return analyzeMyotonic(mutation);
    default:
      throw new Error(`Unsupported gene: ${gene}. Supported genes: DMD, DYSF, USH2A, DMPK`);
  }
}
