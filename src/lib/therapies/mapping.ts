import { TherapyMatch } from "@/lib/framemath/types";

interface TherapyEntry extends TherapyMatch {
  gene: string;
}

/**
 * Curated therapy mapping: gene + exon skip target → known drugs/trials.
 * This is the core lookup table your biology partner should review and expand.
 */
const THERAPY_DATABASE: TherapyEntry[] = [
  // --- DMD Approved Therapies ---
  {
    gene: "DMD",
    drugName: "Eteplirsen (Exondys 51)",
    genericName: "Eteplirsen",
    targetExons: [51],
    status: "approved",
    sponsor: "Sarepta Therapeutics",
    trialId: "NCT01396239",
    notes: "FDA-approved 2016 for DMD amenable to exon 51 skipping. Applicable to ~13% of DMD patients. Phosphorodiamidate morpholino oligomer (PMO).",
  },
  {
    gene: "DMD",
    drugName: "Viltolarsen (Viltepso)",
    genericName: "Viltolarsen",
    targetExons: [53],
    status: "approved",
    sponsor: "NS Pharma",
    trialId: "NCT02740972",
    notes: "FDA-approved 2020 for DMD amenable to exon 53 skipping. Applicable to ~8% of DMD patients.",
  },
  {
    gene: "DMD",
    drugName: "Golodirsen (Vyondys 53)",
    genericName: "Golodirsen",
    targetExons: [53],
    status: "approved",
    sponsor: "Sarepta Therapeutics",
    trialId: "NCT02310906",
    notes: "FDA-approved 2019 for DMD amenable to exon 53 skipping.",
  },
  {
    gene: "DMD",
    drugName: "Casimersen (Amondys 45)",
    genericName: "Casimersen",
    targetExons: [45],
    status: "approved",
    sponsor: "Sarepta Therapeutics",
    trialId: "NCT03532542",
    notes: "FDA-approved 2021 for DMD amenable to exon 45 skipping. Applicable to ~8% of DMD patients.",
  },

  // --- DMD Clinical Trials ---
  {
    gene: "DMD",
    drugName: "SRP-5051",
    genericName: "Vesleteplirsen",
    targetExons: [51],
    status: "phase3",
    sponsor: "Sarepta Therapeutics",
    trialId: "NCT04004065",
    notes: "Next-generation PPMO (peptide-conjugated PMO) for exon 51 skipping. ~10x more dystrophin production than eteplirsen in early data.",
  },
  {
    gene: "DMD",
    drugName: "NS-089/NCNP-02",
    targetExons: [44],
    status: "phase2",
    sponsor: "NS Pharma / Nippon Shinyaku",
    trialId: "NCT04129294",
    notes: "Antisense oligonucleotide for exon 44 skipping. Applicable to ~6% of DMD patients.",
  },
  {
    gene: "DMD",
    drugName: "Renadirsen (DS-5141b)",
    targetExons: [45],
    status: "phase2",
    sponsor: "Daiichi Sankyo",
    trialId: "NCT02667483",
    notes: "ENA-modified antisense oligonucleotide for exon 45 skipping.",
  },
  {
    gene: "DMD",
    drugName: "WVE-N531",
    targetExons: [53],
    status: "phase2",
    sponsor: "Wave Life Sciences",
    trialId: "NCT04906460",
    notes: "Stereopure antisense oligonucleotide for exon 53 skipping.",
  },
  {
    gene: "DMD",
    drugName: "ScAAV9.U7.ACCA",
    targetExons: [2],
    status: "phase1",
    sponsor: "Nationwide Children's Hospital",
    trialId: "NCT04240314",
    notes: "Gene therapy delivering U7 snRNA to skip exon 2. For patients with exon 2 duplications.",
  },

  // --- USH2A Therapies ---
  {
    gene: "USH2A",
    drugName: "QR-421a (Ultevursen)",
    genericName: "Ultevursen",
    targetExons: [13],
    status: "phase3",
    sponsor: "ProQR Therapeutics",
    trialId: "NCT05176717",
    notes: "Antisense oligonucleotide for exon 13 skipping in USH2A. STELLAR and SIRIUS trials. Targets the most common USH2A pathogenic variant region.",
  },

  // --- DYSF (LGMD) ---
  {
    gene: "DYSF",
    drugName: "Dysferlin exon-skipping AON (preclinical)",
    targetExons: [32],
    status: "preclinical",
    sponsor: "Various academic groups",
    notes: "Antisense-mediated exon 32 skipping has shown proof-of-concept in cell models. Not yet in clinical trials.",
  },
];

/**
 * Find therapies that match a given exon skip for a gene.
 * Matches if ANY of the therapy's target exons overlap with the skip.
 */
export function getTherapiesForSkip(
  gene: string,
  skippedExons: number[]
): TherapyMatch[] {
  const geneUpper = gene.toUpperCase();
  const skipSet = new Set(skippedExons);

  return THERAPY_DATABASE
    .filter(
      (t) =>
        t.gene === geneUpper &&
        t.targetExons.some((e) => skipSet.has(e))
    )
    .map(({ gene: _gene, ...therapy }) => therapy);
}

/**
 * Get all therapies for a gene regardless of skip target.
 */
export function getAllTherapiesForGene(gene: string): TherapyMatch[] {
  const geneUpper = gene.toUpperCase();
  return THERAPY_DATABASE
    .filter((t) => t.gene === geneUpper)
    .map(({ gene: _gene, ...therapy }) => therapy);
}
