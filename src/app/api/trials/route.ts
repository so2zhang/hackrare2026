import { NextRequest, NextResponse } from "next/server";
import { searchTrials } from "@/lib/trials";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const condition = searchParams.get("condition");
  const intervention = searchParams.get("intervention") ?? undefined;

  if (!condition) {
    return NextResponse.json(
      { error: "Missing required parameter: condition" },
      { status: 400 }
    );
  }

  try {
    const result = await searchTrials(condition, intervention);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
