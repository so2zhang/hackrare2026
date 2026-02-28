import { MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { getGeneProfile, calculateFrameShift } from "@/lib/framemath/engine";
import { findSkipStrategies } from "@/lib/framemath/skip-finder";
import { getTherapiesForSkip } from "@/lib/therapies/mapping";

/**
 * Usher Syndrome Type 2A (USH2A) analysis rules.
 *
 * Key biology:
 * - Usherin (USH2A) has 72 exons, encoding a very large protein (5202 aa)
 * - Causes combined hearing loss and retinitis pigmentosa
 * - Most of the extracellular domain consists of FN3 repeats — partially redundant
 * - TM domain and intracellular/PDZ-binding domains are essential
 * - Exon 13 is a hotspot for pathogenic variants (c.2299delG is most common)
 * - Exon skipping for USH2A is in active clinical development
 */

const USH2A_ESSENTIAL_REGIONS = [
  { start: 1, end: 1, reason: "Exon 1 contains the signal peptide required for protein localization" },
  { start: 64, end: 72, reason: "C-terminal exons encode the transmembrane domain, intracellular domain, and PDZ-binding motif essential for protein anchoring and signaling" },
];

export function analyzeUsher(mutation: MutationInput): AnalysisResult {
  const profile = getGeneProfile("USH2A");
  if (!profile) throw new Error("USH2A gene profile not found");

  const warnings: string[] = [];
  const frameShift = calculateFrameShift(profile, mutation.affectedExons);
  const isFs = frameShift !== 0;

  if (!isFs) {
    warnings.push(
      "This deletion is in-frame. The FN3 repeat region is partially redundant, so a shortened protein may retain partial function."
    );
  }

  const affectsExon13 = mutation.affectedExons.includes(13);
  if (affectsExon13) {
    warnings.push(
      "Exon 13 is the most common site for pathogenic USH2A variants. Exon 13 skipping is in clinical development (QR-421a/Ultevursen)."
    );
  }

  for (const region of USH2A_ESSENTIAL_REGIONS) {
    const affectsEssential = mutation.affectedExons.some(
      (e) => e >= region.start && e <= region.end
    );
    if (affectsEssential) {
      warnings.push(`Mutation affects essential region: ${region.reason}`);
    }
  }

  const strategies = isFs ? findSkipStrategies(profile, mutation) : [];
  const bestStrategy = strategies.length > 0 ? strategies[0] : null;

  const therapies = bestStrategy
    ? getTherapiesForSkip("USH2A", bestStrategy.exonsToSkip)
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
