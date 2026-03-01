import { ExonInfo, GeneProfile, MutationInput, Phase } from "./types";
import dmdData from "@/data/exon-tables/dmd-exons.json";
import lgmdData from "@/data/exon-tables/lgmd-exons.json";
import usherData from "@/data/exon-tables/usher-exons.json";

const GENE_PROFILES: Record<string, GeneProfile> = {
  DMD: dmdData as GeneProfile,
  DYSF: lgmdData as GeneProfile,
  USH2A: usherData as GeneProfile,
};

export function getGeneProfile(gene: string): GeneProfile | null {
  return GENE_PROFILES[gene.toUpperCase()] ?? null;
}

export function getSupportedGenes(): string[] {
  return Object.keys(GENE_PROFILES);
}

export function getExon(profile: GeneProfile, exonNumber: number): ExonInfo | undefined {
  return profile.exons.find((e) => e.number === exonNumber);
}

/**
 * Calculate total base pairs for a set of exons.
 */
export function totalBasePairs(profile: GeneProfile, exonNumbers: number[]): number {
  return exonNumbers.reduce((sum, n) => {
    const exon = getExon(profile, n);
    return sum + (exon?.lengthBp ?? 0);
  }, 0);
}

/**
 * Determine the reading frame shift caused by deleting the given exons.
 * Returns 0 if in-frame, 1 or 2 if frameshift.
 */
export function calculateFrameShift(profile: GeneProfile, deletedExons: number[]): number {
  const totalBp = totalBasePairs(profile, deletedExons);
  return totalBp % 3;
}

/**
 * Check whether a deletion is a frameshift mutation.
 */
export function isFrameshift(profile: GeneProfile, deletedExons: number[]): boolean {
  return calculateFrameShift(profile, deletedExons) !== 0;
}

/**
 * Check whether skipping additional exons would restore the reading frame.
 * The combined deletion (original + skipped) must be divisible by 3.
 */
export function wouldRestoreFrame(
  profile: GeneProfile,
  deletedExons: number[],
  skippedExons: number[]
): boolean {
  const allRemoved = [...deletedExons, ...skippedExons];
  const totalBp = totalBasePairs(profile, allRemoved);
  return totalBp % 3 === 0;
}

/**
 * Check phase compatibility between the exon before the skip region
 * and the exon after the skip region.
 */
export function checkPhaseCompatibility(
  profile: GeneProfile,
  beforeExon: number,
  afterExon: number
): boolean {
  const before = getExon(profile, beforeExon);
  const after = getExon(profile, afterExon);
  if (!before || !after) return false;
  return before.endPhase === after.startPhase;
}

/**
 * Calculate predicted protein length after removing exons.
 * Returns amino acid count (total remaining bp / 3).
 */
export function predictProteinLength(
  profile: GeneProfile,
  removedExons: number[]
): number {
  const removedBp = totalBasePairs(profile, removedExons);
  const totalBp = profile.exons.reduce((sum, e) => sum + e.lengthBp, 0);
  const remainingBp = totalBp - removedBp;
  return Math.floor(remainingBp / 3);
}

/**
 * Total coding sequence base pairs for a gene.
 */
export function totalGeneBp(profile: GeneProfile): number {
  return profile.exons.reduce((sum, e) => sum + e.lengthBp, 0);
}

/**
 * Get all functional domains that would be lost by removing the given exons.
 */
export function getLostDomains(
  profile: GeneProfile,
  removedExons: number[]
): string[] {
  const domains = new Set<string>();
  for (const exonNum of removedExons) {
    const exon = getExon(profile, exonNum);
    if (exon) {
      exon.criticalDomains.forEach((d) => domains.add(d));
    }
  }

  const remainingDomains = new Set<string>();
  for (const exon of profile.exons) {
    if (!removedExons.includes(exon.number)) {
      exon.criticalDomains.forEach((d) => remainingDomains.add(d));
    }
  }

  return Array.from(domains).filter((d) => !remainingDomains.has(d));
}

/**
 * Determine confidence level based on how much protein is preserved
 * and which domains are lost.
 */
export function assessConfidence(
  percentWildtype: number,
  lostDomains: string[]
): "high" | "medium" | "low" {
  const criticalDomains = [
    "cysteine-rich",
    "ZZ-domain",
    "C-terminal",
    "CH-domain",
    "EF-hand-1",
    "EF-hand-2",
    "dystroglycan-binding",
    "syntrophin-binding",
    "actin-binding-1",
    "C2-lipid-binding",
    "TM-domain",
    "PDZ-binding",
    "signal-peptide",
    "intracellular",
    "DysF",
    "Ferlin-C",
    "TM",
  ];

  const lostCritical = lostDomains.some((d) => criticalDomains.includes(d));

  if (percentWildtype >= 80 && !lostCritical) return "high";
  if (percentWildtype >= 60 && !lostCritical) return "medium";
  return "low";
}
