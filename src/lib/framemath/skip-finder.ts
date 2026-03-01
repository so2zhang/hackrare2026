import {
  getExon,
  totalBasePairs,
  totalGeneBp,
  getLostDomains,
  assessConfidence,
} from "./engine";
import { isExonSkippableForMutation } from "./skippability";
import { GeneProfile, MutationInput, MutationType, SkipStrategy } from "./types";

const SEARCH_WINDOW = 6;
const MAX_SKIP_SPAN = 5;

/**
 * Find valid exon-skipping strategies that restore the reading frame.
 *
 * For **deletions**: search downstream of the deleted region for exons whose
 * removal restores divisibility by 3.
 *
 * For **duplications**: the primary strategy is to skip the duplicated exons
 * themselves (ASO removes ALL copies, cancelling the extra bp). Downstream
 * alternatives are also searched as fallbacks.
 *
 * Returns MINIMAL strategies: single-exon skips preferred; double-exon only
 * if no single-exon solution exists. Ref: PMC11593839
 */
export function findSkipStrategies(
  profile: GeneProfile,
  mutation: MutationInput
): SkipStrategy[] {
  const affectedExons = mutation.affectedExons;
  const affectedBp = totalBasePairs(profile, affectedExons);
  const frameShift = affectedBp % 3;
  const isDeletion = mutation.mutationType === "deletion";

  if (frameShift === 0 && isDeletion) return [];

  const affectedSet = new Set(affectedExons);
  const geneCodingBp = totalGeneBp(profile);
  const strategies: SkipStrategy[] = [];

  // ── Duplication/Insertion: primary strategy is skipping the affected exons ──
  if (!isDeletion) {
    const allSkippable = affectedExons.every((n) => {
      const exon = getExon(profile, n);
      return exon?.skippable;
    });

    if (allSkippable) {
      const skippedBp = totalBasePairs(profile, affectedExons);
      const remainingBp = geneCodingBp - skippedBp;
      const predictedProteinLength = Math.max(0, Math.floor((remainingBp - 3) / 3));
      const percentWildtype = Math.min(100, Math.round((predictedProteinLength / profile.proteinLength) * 100));
      const lostDomains = getLostDomains(profile, affectedExons);
      const confidence = assessConfidence(percentWildtype, lostDomains);

      strategies.push({
        exonsToSkip: [...affectedExons],
        restoredFrame: true,
        totalSkippedBp: skippedBp,
        predictedProteinLength,
        percentWildtype,
        lostDomains,
        confidence,
        rationale: buildRationale(affectedExons, affectedExons, percentWildtype, lostDomains, mutation.mutationType),
      });
    }
  }

  // ── Downstream search (works for both deletions and duplications) ──
  if (frameShift !== 0) {
    const maxAffected = Math.max(...affectedExons);
    const searchStart = maxAffected + 1;
    const searchEnd = Math.min(profile.totalExons, maxAffected + SEARCH_WINDOW);

    for (let spanLen = 1; spanLen <= MAX_SKIP_SPAN; spanLen++) {
      const downstream = findStrategiesOfSpan(
        profile, mutation, affectedSet, geneCodingBp,
        searchStart, searchEnd, spanLen, mutation.mutationType
      );
      if (downstream.length > 0) {
        strategies.push(...downstream);
        break;
      }
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
    // Prefer skip targets closest to the deletion boundary (clinically practical)
    const aProximity = Math.min(...a.exonsToSkip);
    const bProximity = Math.min(...b.exonsToSkip);
    if (aProximity !== bProximity) {
      return aProximity - bProximity;
    }
    return b.percentWildtype - a.percentWildtype;
  });

  return strategies;
}

function findStrategiesOfSpan(
  profile: GeneProfile,
  mutation: MutationInput,
  affectedSet: Set<number>,
  geneCodingBp: number,
  searchStart: number,
  searchEnd: number,
  spanLen: number,
  mutType: MutationType = "deletion"
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

    if (mutType !== "deletion") {
      // For duplications/insertions: the extra bp must be cancelled by skipped bp
      const dupBp = totalBasePairs(profile, mutation.affectedExons);
      const skipBp = totalBasePairs(profile, candidateExons);
      if ((dupBp - skipBp) % 3 !== 0) continue;
    } else {
      const allRemovedBp = totalBasePairs(profile, [...mutation.affectedExons, ...candidateExons]);
      if (allRemovedBp % 3 !== 0) continue;
    }

    const allRemovedExons = [...mutation.affectedExons, ...candidateExons];
    const allRemovedBp = totalBasePairs(profile, allRemovedExons);
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
        lostDomains,
        mutType
      ),
    });
  }

  return strategies;
}

function buildRationale(
  skippedExons: number[],
  affectedExons: number[],
  percentWt: number,
  lostDomains: string[],
  mutType: MutationType = "deletion"
): string {
  const skipStr =
    skippedExons.length === 1
      ? `exon ${skippedExons[0]}`
      : `exons ${skippedExons[0]}-${skippedExons[skippedExons.length - 1]}`;

  const affectedStr =
    affectedExons.length === 1
      ? `exon ${affectedExons[0]}`
      : `exons ${affectedExons[0]}-${affectedExons[affectedExons.length - 1]}`;

  let rationale: string;

  if (mutType !== "deletion") {
    const sameExons = skippedExons.length === affectedExons.length &&
      skippedExons.every((e, i) => e === affectedExons[i]);
    const mutLabel = mutType === "duplication" ? "duplicated" : "affected";

    if (sameExons) {
      rationale = `Skipping the ${mutLabel} ${affectedStr} removes the ${mutType === "duplication" ? "extra copies" : "disrupted sequence"} via ASO, restoring the reading frame. The resulting protein is ~${percentWt}% of wildtype length.`;
    } else {
      rationale = `Skipping ${skipStr} alongside the ${mutType} of ${affectedStr} restores the reading frame, producing a protein ~${percentWt}% of wildtype length.`;
    }
  } else {
    rationale = `Skipping ${skipStr} alongside the deletion of ${affectedStr} restores the reading frame, producing a protein ~${percentWt}% of wildtype length.`;
  }

  if (lostDomains.length > 0) {
    rationale += ` This removes the ${lostDomains.join(", ")} domain(s), which may reduce protein function.`;
  } else {
    rationale += ` No exclusively critical domains are fully lost.`;
  }

  return rationale;
}
