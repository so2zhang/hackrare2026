import { NextRequest, NextResponse } from "next/server";
import { searchClinVar } from "@/lib/clinvar";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const gene = searchParams.get("gene");
  const mutationType = searchParams.get("type") ?? undefined;

  if (!gene) {
    return NextResponse.json(
      { error: "Missing required parameter: gene" },
      { status: 400 }
    );
  }

  try {
    const result = await searchClinVar(gene, mutationType);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
