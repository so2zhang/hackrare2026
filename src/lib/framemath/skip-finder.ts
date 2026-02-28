import {
  getExon,
  totalBasePairs,
  getLostDomains,
  assessConfidence,
} from "./engine";
import { GeneProfile, MutationInput, SkipStrategy } from "./types";

const MAX_SKIP_SPAN = 5;

/**
 * Find all valid exon-skipping strategies that restore the reading frame.
 * Searches single exon skips first, then multi-exon contiguous skips up to MAX_SKIP_SPAN.
 */
export function findSkipStrategies(
  profile: GeneProfile,
  mutation: MutationInput
): SkipStrategy[] {
  const deletedExons = mutation.affectedExons;
  const deletedBp = totalBasePairs(profile, deletedExons);
  const frameShift = deletedBp % 3;

  if (frameShift === 0) return [];

  const strategies: SkipStrategy[] = [];
  const deletedSet = new Set(deletedExons);

  const minDeleted = Math.min(...deletedExons);
  const maxDeleted = Math.max(...deletedExons);

  const totalGeneBp = profile.exons.reduce((s, e) => s + e.lengthBp, 0);

  const searchStart = Math.max(2, minDeleted - MAX_SKIP_SPAN);
  const searchEnd = Math.min(profile.totalExons, maxDeleted + MAX_SKIP_SPAN);

  for (let spanLen = 1; spanLen <= MAX_SKIP_SPAN; spanLen++) {
    for (let start = searchStart; start <= searchEnd - spanLen + 1; start++) {
      const candidateExons: number[] = [];
      let valid = true;

      for (let i = 0; i < spanLen; i++) {
        const exonNum = start + i;
        const exon = getExon(profile, exonNum);

        if (!exon || !exon.skippable || deletedSet.has(exonNum)) {
          valid = false;
          break;
        }
        candidateExons.push(exonNum);
      }

      if (!valid) continue;

      const allRemovedExons = [...deletedExons, ...candidateExons];
      const allRemovedBp = totalBasePairs(profile, allRemovedExons);

      if (allRemovedBp % 3 !== 0) continue;

      const remainingBp = totalGeneBp - allRemovedBp;
      const predictedProteinLength = Math.floor(remainingBp / 3);
      const percentWildtype = Math.round((remainingBp / totalGeneBp) * 100);
      const lostDomains = getLostDomains(profile, allRemovedExons);
      const confidence = assessConfidence(percentWildtype, lostDomains);

      const skippedBp = totalBasePairs(profile, candidateExons);

      strategies.push({
        exonsToSkip: candidateExons,
        restoredFrame: true,
        totalSkippedBp: skippedBp,
        predictedProteinLength,
        percentWildtype,
        lostDomains,
        confidence,
        rationale: buildRationale(candidateExons, deletedExons, percentWildtype, lostDomains),
      });
    }
  }

  strategies.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    if (confOrder[a.confidence] !== confOrder[b.confidence]) {
      return confOrder[a.confidence] - confOrder[b.confidence];
    }

    const aAdj = adjacencyScore(a.exonsToSkip, minDeleted, maxDeleted);
    const bAdj = adjacencyScore(b.exonsToSkip, minDeleted, maxDeleted);
    if (aAdj !== bAdj) return aAdj - bAdj;

    // Prefer skipping after deletion over before (single contiguous gap)
    const aAfter = Math.min(...a.exonsToSkip) > maxDeleted ? 0 : 1;
    const bAfter = Math.min(...b.exonsToSkip) > maxDeleted ? 0 : 1;
    if (aAfter !== bAfter) return aAfter - bAfter;

    if (a.exonsToSkip.length !== b.exonsToSkip.length) {
      return a.exonsToSkip.length - b.exonsToSkip.length;
    }

    return b.percentWildtype - a.percentWildtype;
  });

  return strategies;
}

/**
 * Score how close the skipped exons are to the deletion boundary.
 * Lower is better (0 = immediately adjacent).
 */
function adjacencyScore(skippedExons: number[], minDel: number, maxDel: number): number {
  const minSkip = Math.min(...skippedExons);
  const maxSkip = Math.max(...skippedExons);

  const gapBefore = minDel - maxSkip - 1;
  const gapAfter = minSkip - maxDel - 1;

  if (gapBefore <= 0 && gapAfter <= 0) return 0;
  if (gapBefore <= 0) return gapAfter;
  if (gapAfter <= 0) return gapBefore;
  return Math.min(gapBefore, gapAfter);
}

function buildRationale(
  skippedExons: number[],
  deletedExons: number[],
  percentWt: number,
  lostDomains: string[]
): string {
  const skipStr =
    skippedExons.length === 1
      ? `exon ${skippedExons[0]}`
      : `exons ${skippedExons[0]}-${skippedExons[skippedExons.length - 1]}`;

  const delStr =
    deletedExons.length === 1
      ? `exon ${deletedExons[0]}`
      : `exons ${deletedExons[0]}-${deletedExons[deletedExons.length - 1]}`;

  let rationale = `Skipping ${skipStr} alongside the deletion of ${delStr} restores the reading frame, producing a protein ~${percentWt}% of wildtype length.`;

  if (lostDomains.length > 0) {
    rationale += ` This removes the ${lostDomains.join(", ")} domain(s), which may reduce protein function.`;
  } else {
    rationale += ` No exclusively critical domains are fully lost.`;
  }

  return rationale;
}
