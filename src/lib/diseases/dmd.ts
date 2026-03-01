import { GeneProfile, MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { getGeneProfile, isFrameshift, calculateFrameShift, predictProteinLength, getLostDomains } from "@/lib/framemath/engine";
import { findSkipStrategies } from "@/lib/framemath/skip-finder";
import { getTherapiesForSkip } from "@/lib/therapies/mapping";

/**
 * DMD-specific analysis rules.
 *
 * Key biology:
 * - Dystrophin has 79 exons spanning the central rod domain (spectrin repeats)
 * - Deletions in the "hotspot" region (exons 45-55) account for ~60% of mutations
 * - Exons 1 and 70-79 encode critical N/C-terminal binding domains
 * - The central rod region is partially dispensable (Becker patients prove this)
 */

const DMD_DELETION_HOTSPOT = { start: 45, end: 55 };
const DMD_ESSENTIAL_REGIONS = [
  { start: 1, end: 1, reason: "Exon 1 contains the translation start site" },
  { start: 75, end: 79, reason: "C-terminal exons (75-79) encode dystroglycan and syntrophin binding sites essential for membrane anchoring" },
];

export function analyzeDMD(mutation: MutationInput): AnalysisResult {
  const profile = getGeneProfile("DMD");
  if (!profile) throw new Error("DMD gene profile not found");

  const warnings: string[] = [];
  const frameShift = calculateFrameShift(profile, mutation.affectedExons);
  const isFs = frameShift !== 0;

  const isDeletion = mutation.mutationType === "deletion";

  if (!isFs && isDeletion) {
    warnings.push(
      "This patient may already have a Becker-like phenotype — no skip needed, consider dystrophin-stabilizing approaches instead."
    );
  }

  for (const region of DMD_ESSENTIAL_REGIONS) {
    const affectsEssential = mutation.affectedExons.some(
      (e) => e >= region.start && e <= region.end
    );
    if (affectsEssential) {
      warnings.push(`Mutation affects essential region: ${region.reason}`);
    }
  }

  const inHotspot = mutation.affectedExons.some(
    (e) => e >= DMD_DELETION_HOTSPOT.start && e <= DMD_DELETION_HOTSPOT.end
  );
  if (inHotspot) {
    warnings.push(
      "Mutation is in the exon 45-55 hotspot region — this is the most common DMD mutation area and multiple exon-skipping therapies are in development."
    );
  }

  const strategies = (isFs || !isDeletion) ? findSkipStrategies(profile, mutation) : [];
  const bestStrategy = strategies.length > 0 ? strategies[0] : null;

  const therapies = bestStrategy
    ? getTherapiesForSkip("DMD", bestStrategy.exonsToSkip)
    : [];

  return {
    mutation,
    originalFrameShift: frameShift,
    isFrameshift: isFs,
    alreadyInFrame: !isFs && isDeletion,
    strategies,
    bestStrategy,
    therapies,
    warnings,
  };
}
