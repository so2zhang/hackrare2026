const CTGOV_BASE = "https://clinicaltrials.gov/api/v2";

export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  sponsor: string;
  startDate?: string;
  url: string;
}

export interface TrialSearchResult {
  totalCount: number;
  trials: ClinicalTrial[];
}

/**
 * Search ClinicalTrials.gov for exon-skipping trials related to a condition.
 */
export async function searchTrials(
  condition: string,
  intervention?: string,
  maxResults: number = 10
): Promise<TrialSearchResult> {
  const params = new URLSearchParams({
    "query.cond": condition,
    "page_size": maxResults.toString(),
    format: "json",
  });

  if (intervention) {
    params.set("query.intr", intervention);
  }

  const url = `${CTGOV_BASE}/studies?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`ClinicalTrials.gov search failed: ${res.statusText}`);
  }

  const data = await res.json();
  const studies = data.studies ?? [];

  const trials: ClinicalTrial[] = studies.map((study: Record<string, unknown>) => {
    const proto = study.protocolSection as Record<string, unknown> | undefined;
    const ident = proto?.identificationModule as Record<string, unknown> | undefined;
    const status = proto?.statusModule as Record<string, unknown> | undefined;
    const design = proto?.designModule as Record<string, unknown> | undefined;
    const conditions = proto?.conditionsModule as Record<string, unknown> | undefined;
    const arms = proto?.armsInterventionsModule as Record<string, unknown> | undefined;
    const sponsor = proto?.sponsorCollaboratorsModule as Record<string, unknown> | undefined;
    const leadSponsor = sponsor?.leadSponsor as Record<string, unknown> | undefined;

    const nctId = (ident?.nctId as string) ?? "";

    const interventionList = (arms?.interventions as Array<Record<string, unknown>>) ?? [];

    return {
      nctId,
      title: (ident?.officialTitle as string) ?? (ident?.briefTitle as string) ?? "",
      status: (status?.overallStatus as string) ?? "Unknown",
      phase: ((design?.phases as string[]) ?? []).join(", ") || "N/A",
      conditions: (conditions?.conditions as string[]) ?? [],
      interventions: interventionList.map(
        (i) => (i.name as string) ?? ""
      ),
      sponsor: (leadSponsor?.name as string) ?? "Unknown",
      startDate: (status?.startDateStruct as Record<string, unknown>)?.date as string | undefined,
      url: `https://clinicaltrials.gov/study/${nctId}`,
    };
  });

  return {
    totalCount: data.totalCount ?? trials.length,
    trials,
  };
}
