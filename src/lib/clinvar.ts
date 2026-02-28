const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export interface ClinVarVariant {
  uid: string;
  title: string;
  clinicalSignificance: string;
  geneSymbol: string;
  molecularConsequence: string;
  variationType: string;
}

export interface ClinVarSearchResult {
  totalCount: number;
  variants: ClinVarVariant[];
}

/**
 * Search ClinVar for variants in a gene with a specific mutation type.
 */
export async function searchClinVar(
  gene: string,
  mutationType?: string,
  maxResults: number = 10
): Promise<ClinVarSearchResult> {
  let query = `${gene}[gene]`;
  if (mutationType) {
    query += ` AND ${mutationType}[vartype]`;
  }

  const searchUrl = `${EUTILS_BASE}/esearch.fcgi?db=clinvar&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`ClinVar search failed: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  const ids: string[] = searchData.esearchresult?.idlist ?? [];

  if (ids.length === 0) {
    return { totalCount: 0, variants: [] };
  }

  const summaryUrl = `${EUTILS_BASE}/esummary.fcgi?db=clinvar&id=${ids.join(",")}&retmode=json`;
  const summaryRes = await fetch(summaryUrl);
  if (!summaryRes.ok) {
    throw new Error(`ClinVar summary failed: ${summaryRes.statusText}`);
  }

  const summaryData = await summaryRes.json();
  const result = summaryData.result ?? {};

  const variants: ClinVarVariant[] = ids
    .map((id) => {
      const entry = result[id];
      if (!entry) return null;

      return {
        uid: id,
        title: entry.title ?? "",
        clinicalSignificance:
          entry.clinical_significance?.description ?? "Unknown",
        geneSymbol: entry.genes?.[0]?.symbol ?? gene,
        molecularConsequence:
          entry.molecular_consequence_list?.[0] ?? "Unknown",
        variationType: entry.variation_type ?? "Unknown",
      };
    })
    .filter(Boolean) as ClinVarVariant[];

  return {
    totalCount: parseInt(searchData.esearchresult?.count ?? "0", 10),
    variants,
  };
}
