import { GeneProfile, ExonInfo } from "./types";
import { getExon } from "./engine";

export interface ProteinSegment {
  exonNumber: number;
  status: "present" | "deleted" | "skipped";
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
 * Returns a segment-by-segment breakdown.
 */
export function simulateProtein(
  profile: GeneProfile,
  deletedExons: number[],
  skippedExons: number[]
): ProteinSimulation {
  const deletedSet = new Set(deletedExons);
  const skippedSet = new Set(skippedExons);
  const allRemoved = new Set([...deletedExons, ...skippedExons]);

  const segments: ProteinSegment[] = [];
  let totalRemainingBp = 0;
  let totalRemovedBp = 0;
  let gapStart: number | null = null;
  let gapEnd: number | null = null;

  for (const exon of profile.exons) {
    let status: ProteinSegment["status"] = "present";

    if (deletedSet.has(exon.number)) {
      status = "deleted";
      totalRemovedBp += exon.lengthBp;
      if (gapStart === null) gapStart = exon.number;
      gapEnd = exon.number;
    } else if (skippedSet.has(exon.number)) {
      status = "skipped";
      totalRemovedBp += exon.lengthBp;
      if (gapStart === null) gapStart = exon.number;
      gapEnd = exon.number;
    } else {
      totalRemainingBp += exon.lengthBp;
    }

    segments.push({
      exonNumber: exon.number,
      status,
      aminoAcids: Math.floor(exon.lengthBp / 3),
      domains: exon.criticalDomains,
    });
  }

  const isInFrame = totalRemovedBp % 3 === 0;
  const predictedLength = Math.floor(totalRemainingBp / 3);
  const percentRetained = Math.round(
    (predictedLength / profile.proteinLength) * 100
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
