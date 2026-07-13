import { NextResponse } from "next/server";
import { compareTracks } from "@/core/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // project id is implicit in the track pair; validated in service
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to track ids are required" },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json({ rows: await compareTracks(from, to) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "compare failed" },
      { status: 400 },
    );
  }
}
