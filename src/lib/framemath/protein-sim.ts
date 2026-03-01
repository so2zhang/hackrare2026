import { GeneProfile, ExonInfo, MutationType } from "./types";
import { getCodingBp } from "./engine";

export interface ProteinSegment {
  exonNumber: number;
  status: "present" | "deleted" | "duplicated" | "inserted" | "skipped";
  aminoAcids: number;
  domains: string[];
}

export interface ProteinSimulation {
  wildtypeLength: number;
  predictedLength: number;
  percentRetained: number;
  segments: ProteinSegment[];
  isInFrame: boolean;
  gapRegion: { start: number; end: number } | null;
}

/**
 * Simulate the protein that would result from the mutation + skip strategy.
 * Uses CDS-only bp (excluding UTR).
 *
 * Deletion:    affected exons are missing → skip restores frame by removing more.
 * Duplication: affected exons are present twice → skip removes all copies (ASO
 *              can't distinguish original from duplicate).
 *              Net result after skipping the duplicated exons = same as deletion.
 */
export function simulateProtein(
  profile: GeneProfile,
  affectedExons: number[],
  skippedExons: number[],
  mutationType: MutationType = "deletion"
): ProteinSimulation {
  const affectedSet = new Set(affectedExons);
  const skippedSet = new Set(skippedExons);
  const isDeletion = mutationType === "deletion";

  const segments: ProteinSegment[] = [];
  let totalRemovedCodingBp = 0;
  let totalCodingBp = 0;
  let gapStart: number | null = null;
  let gapEnd: number | null = null;

  for (const exon of profile.exons) {
    const codingBp = getCodingBp(profile, exon);
    totalCodingBp += codingBp;

    let status: ProteinSegment["status"] = "present";
    const isAffected = affectedSet.has(exon.number);
    const isSkipped = skippedSet.has(exon.number);

    if (isDeletion) {
      if (isAffected) {
        status = "deleted";
        totalRemovedCodingBp += codingBp;
        if (gapStart === null) gapStart = exon.number;
        gapEnd = exon.number;
      } else if (isSkipped) {
        status = "skipped";
        totalRemovedCodingBp += codingBp;
        if (gapStart === null) gapStart = exon.number;
        gapEnd = exon.number;
      }
    } else {
      if (isSkipped) {
        status = "skipped";
        totalRemovedCodingBp += codingBp;
        if (gapStart === null) gapStart = exon.number;
        gapEnd = exon.number;
      } else if (isAffected) {
        status = mutationType === "duplication" ? "duplicated" : "inserted";
      }
    }

    segments.push({
      exonNumber: exon.number,
      status,
      aminoAcids: Math.floor(codingBp / 3),
      domains: exon.criticalDomains,
    });
  }

  const isInFrame = totalRemovedCodingBp % 3 === 0;
  const remainingCodingBp = totalCodingBp - totalRemovedCodingBp;
  const predictedLength = Math.max(
    0,
    Math.floor((remainingCodingBp - 3) / 3)
  );
  const percentRetained = Math.min(
    100,
    Math.round((predictedLength / profile.proteinLength) * 100)
  );

  return {
    wildtypeLength: profile.proteinLength,
    predictedLength,
    percentRetained,
    segments,
    isInFrame,
    gapRegion:
      gapStart !== null && gapEnd !== null
        ? { start: gapStart, end: gapEnd }
        : null,
  };
}
