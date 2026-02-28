import { MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { getGeneProfile, calculateFrameShift } from "@/lib/framemath/engine";
import { findSkipStrategies } from "@/lib/framemath/skip-finder";
import { getTherapiesForSkip } from "@/lib/therapies/mapping";

/**
 * LGMD2B / Dysferlinopathy analysis rules.
 *
 * Key biology:
 * - Dysferlin (DYSF) has 55 exons
 * - Involved in membrane repair — loss causes LGMD2B / Miyoshi myopathy
 * - C2 lipid-binding domains at C-terminus are critical for membrane fusion
 * - FerA domain is important for calcium-dependent membrane binding
 * - Exon skipping less well-validated than DMD but being actively researched
 */

const DYSF_ESSENTIAL_REGIONS = [
  { start: 1, end: 1, reason: "Exon 1 contains the translation start site and signal sequence" },
  { start: 52, end: 55, reason: "C-terminal exons encode C2 lipid-binding domains essential for membrane repair function" },
];

export function analyzeLGMD(mutation: MutationInput): AnalysisResult {
  const profile = getGeneProfile("DYSF");
  if (!profile) throw new Error("DYSF gene profile not found");

  const warnings: string[] = [];
  const frameShift = calculateFrameShift(profile, mutation.affectedExons);
  const isFs = frameShift !== 0;

  if (!isFs) {
    warnings.push(
      "This deletion is in-frame. Depending on which domains are removed, the protein may retain partial function."
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
    strategies,
    bestStrategy,
    therapies,
    warnings,
  };
}
