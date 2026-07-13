import { NextResponse } from "next/server";
import { getTrackDetail } from "@/core/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const track = await getTrackDetail(id);
  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }
  return NextResponse.json({ track });
}
