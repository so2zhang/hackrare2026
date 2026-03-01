import {
  getExon,
  totalBasePairs,
  totalGeneBp,
  getLostDomains,
  assessConfidence,
} from "./engine";
import { isExonSkippableForMutation } from "./skippability";
import { GeneProfile, MutationInput, SkipStrategy } from "./types";

const SEARCH_WINDOW = 6;
const MAX_SKIP_SPAN = 5;

/**
 * Find valid exon-skipping strategies that restore the reading frame.
 *
 * Returns MINIMAL strategies: single-exon skips preferred; double-exon only
 * if no single-exon solution exists. Matches clinical practice where simpler = better.
 * Ref: PMC11593839
 *
 * search_window=6 limits the search to 6 exons downstream of the deletion.
 * Distant skips are theoretically valid but not therapeutically practical —
 * ASOs need to target exons near the breakpoint.
 */
export function findSkipStrategies(
  profile: GeneProfile,
  mutation: MutationInput
): SkipStrategy[] {
  const deletedExons = mutation.affectedExons;
  const deletedBp = totalBasePairs(profile, deletedExons);
  const frameShift = deletedBp % 3;

  if (frameShift === 0) return [];

  const deletedSet = new Set(deletedExons);
  const maxDeleted = Math.max(...deletedExons);
  const geneCodingBp = totalGeneBp(profile);

  // Search only downstream of deletion, within SEARCH_WINDOW exons
  const searchStart = maxDeleted + 1;
  const searchEnd = Math.min(
    profile.totalExons,
    maxDeleted + SEARCH_WINDOW
  );

  // Try single-exon skips first
  let strategies = findStrategiesOfSpan(
    profile,
    mutation,
    deletedSet,
    geneCodingBp,
    searchStart,
    searchEnd,
    1
  );

  // If no single-exon solution, try double, then triple, etc.
  if (strategies.length === 0) {
    for (let spanLen = 2; spanLen <= MAX_SKIP_SPAN; spanLen++) {
      strategies = findStrategiesOfSpan(
        profile,
        mutation,
        deletedSet,
        geneCodingBp,
        searchStart,
        searchEnd,
        spanLen
      );
      if (strategies.length > 0) break;
    }
  }

  strategies.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    if (confOrder[a.confidence] !== confOrder[b.confidence]) {
      return confOrder[a.confidence] - confOrder[b.confidence];
    }
    if (a.exonsToSkip.length !== b.exonsToSkip.length) {
      return a.exonsToSkip.length - b.exonsToSkip.length;
    }
    return b.percentWildtype - a.percentWildtype;
  });

  return strategies;
}

function findStrategiesOfSpan(
  profile: GeneProfile,
  mutation: MutationInput,
  deletedSet: Set<number>,
  geneCodingBp: number,
  searchStart: number,
  searchEnd: number,
  spanLen: number
): SkipStrategy[] {
  const strategies: SkipStrategy[] = [];

  for (let start = searchStart; start <= searchEnd - spanLen + 1; start++) {
    const candidateExons: number[] = [];
    let valid = true;

    for (let i = 0; i < spanLen; i++) {
      const exonNum = start + i;
      if (!isExonSkippableForMutation(profile, exonNum, mutation)) {
        valid = false;
        break;
      }
      candidateExons.push(exonNum);
    }

    if (!valid) continue;

    const allRemovedExons = [...mutation.affectedExons, ...candidateExons];
    const allRemovedBp = totalBasePairs(profile, allRemovedExons);

    if (allRemovedBp % 3 !== 0) continue;

    const remainingBp = geneCodingBp - allRemovedBp;
    const predictedProteinLength = Math.max(
      0,
      Math.floor((remainingBp - 3) / 3)
    );
    const percentWildtype = Math.min(
      100,
      Math.round((predictedProteinLength / profile.proteinLength) * 100)
    );
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
      rationale: buildRationale(
        candidateExons,
        mutation.affectedExons,
        percentWildtype,
        lostDomains
      ),
    });
  }

  return strategies;
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
