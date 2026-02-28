import { NextRequest, NextResponse } from "next/server";
import { MutationInput } from "@/lib/framemath/types";
import { analyzeDisease } from "@/lib/diseases";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { gene, mutationType, affectedExons, description } = body as Partial<MutationInput>;

    if (!gene || !mutationType || !affectedExons || affectedExons.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: gene, mutationType, and affectedExons (non-empty array)",
        },
        { status: 400 }
      );
    }

    const validTypes = ["deletion", "duplication", "point", "insertion"];
    if (!validTypes.includes(mutationType)) {
      return NextResponse.json(
        { error: `Invalid mutationType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const mutation: MutationInput = {
      gene: gene.toUpperCase(),
      mutationType,
      affectedExons: affectedExons.map(Number).sort((a, b) => a - b),
      description,
    };

    const result = analyzeDisease(mutation);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
