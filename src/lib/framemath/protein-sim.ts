import { GeneProfile, ExonInfo } from "./types";
import { getCodingBp } from "./engine";

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
 * Uses CDS-only bp (excluding UTR) so the predicted protein length is
 * always <= the wildtype.
 */
export function simulateProtein(
  profile: GeneProfile,
  deletedExons: number[],
  skippedExons: number[]
): ProteinSimulation {
  const deletedSet = new Set(deletedExons);
  const skippedSet = new Set(skippedExons);

  const segments: ProteinSegment[] = [];
  let totalRemovedCodingBp = 0;
  let totalCodingBp = 0;
  let gapStart: number | null = null;
  let gapEnd: number | null = null;

  for (const exon of profile.exons) {
    const codingBp = getCodingBp(profile, exon);
    totalCodingBp += codingBp;

    let status: ProteinSegment["status"] = "present";

    if (deletedSet.has(exon.number)) {
      status = "deleted";
      totalRemovedCodingBp += codingBp;
      if (gapStart === null) gapStart = exon.number;
      gapEnd = exon.number;
    } else if (skippedSet.has(exon.number)) {
      status = "skipped";
      totalRemovedCodingBp += codingBp;
      if (gapStart === null) gapStart = exon.number;
      gapEnd = exon.number;
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
