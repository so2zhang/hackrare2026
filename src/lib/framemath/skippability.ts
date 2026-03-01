import { getExon } from "./engine";
import { GeneProfile, MutationInput } from "./types";

/**
 * Determines if an exon can be skipped for a given mutation.
 *
 * Base rule: static skippable flag from exon table (Exon 1 and exons 75-79
 * are non-skippable per Leiden DMD guidelines).
 *
 * Edge cases (mutation-dependent) can be added here:
 * - Exon adjacent to deletion boundary may have different therapeutic feasibility
 * - Multi-exon skip strategies may have phase-compatibility requirements
 * - Gene-specific rules (e.g. DMD vs USH2A)
 */
export function isExonSkippableForMutation(
  profile: GeneProfile,
  exonNum: number,
  mutation: MutationInput
): boolean {
  const exon = getExon(profile, exonNum);
  if (!exon) return false;

  // Base: static skippable from curated exon table
  if (!exon.skippable) return false;

  // Exon cannot be in the deleted set
  if (mutation.affectedExons.includes(exonNum)) return false;

  // Future: mutation-dependent edge cases
  // e.g. if exon is too far from deletion, ASO delivery may be impractical
  // e.g. phase compatibility with adjacent exons in multi-skip scenarios

  return true;
}
