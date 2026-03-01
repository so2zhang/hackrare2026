import { MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { getGeneProfile, calculateFrameShift } from "@/lib/framemath/engine";
import { findSkipStrategies } from "@/lib/framemath/skip-finder";
import { getTherapiesForSkip } from "@/lib/therapies/mapping";

/**
 * LGMD2B / Dysferlinopathy analysis rules.
 *
 * Key biology (NP_003485.1, 2080 aa, NM_003494.4):
 * - Dysferlin (DYSF) has 55 exons; 3 non-skippable: exon 1 (start codon), exon 54 (TM anchor), exon 55 (stop/3'UTR)
 * - Domain structure: C2A, C2B, FerI, C2C, FerA, FerB, DysF, C2D, linker-3 (exons 35-42), C2E, linker-4, C2F, Ferlin-C, TM
 * - Exons 26-27 deletion (common in LGMD2B): phase 0→0, already in-frame — no skip needed, but DysF domain disrupted (PMC11171558)
 * - Exon 44 deletion: frameshift (0→2), rescued by skipping exon 47 (linker-4, phase 0→0)
 * - Linker-3 (exons 35-42): ~300 aa uncharacterized; 8 consecutive phase-symmetric exons, all skippable
 * - Exon skipping less clinically validated than DMD
 */

const DYSF_ESSENTIAL_REGIONS = [
  { start: 1, end: 1, reason: "Exon 1 contains the translation start site" },
  { start: 54, end: 54, reason: "Exon 54 encodes the TM anchor essential for membrane insertion" },
  { start: 55, end: 55, reason: "Exon 55 contains the stop codon and 3' UTR" },
];

export function analyzeLGMD(mutation: MutationInput): AnalysisResult {
  const profile = getGeneProfile("DYSF");
  if (!profile) throw new Error("DYSF gene profile not found");

  const warnings: string[] = [];
  const frameShift = calculateFrameShift(profile, mutation.affectedExons);
  const isFs = frameShift !== 0;

  if (!isFs) {
    warnings.push(
      "This deletion is in-frame. No exon skip needed; consider symptomatic care or experimental membrane-repair approaches."
    );
    const affectsDysF = mutation.affectedExons.some((e) => e >= 25 && e <= 28);
    if (affectsDysF) {
      warnings.push(
        "Exons 26-27 deletion is common in LGMD2B (PMC11171558). Already in-frame, but DysF domain is disrupted — protein function may be impaired."
      );
    }
  }

  const affectsExon44 = mutation.affectedExons.includes(44);
  if (affectsExon44 && isFs) {
    warnings.push(
      "Exon 44 deletion causes frameshift (0→2). Skipping exon 47 (linker-4, phase 0→0) can restore the reading frame."
    );
  }

  for (const region of DYSF_ESSENTIAL_REGIONS) {
    const affectsEssential = mutation.affectedExons.some(
      (e) => e >= region.start && e <= region.end
    );
    if (affectsEssential) {
      warnings.push(`Mutation affects essential region: ${region.reason}`);
    }
  }

  warnings.push(
    "Note: Exon skipping therapy for dysferlin is still in preclinical/early research stages. Results should be interpreted with caution."
  );

  const strategies = isFs ? findSkipStrategies(profile, mutation) : [];
  const bestStrategy = strategies.length > 0 ? strategies[0] : null;

  const therapies = bestStrategy
    ? getTherapiesForSkip("DYSF", bestStrategy.exonsToSkip)
    : [];

  return {
    mutation,
    originalFrameShift: frameShift,
    isFrameshift: isFs,
    alreadyInFrame: !isFs,
    strategies,
    bestStrategy,
    therapies,
    warnings,
  };
}
