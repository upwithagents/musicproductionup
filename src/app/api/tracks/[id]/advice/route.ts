import { NextResponse } from "next/server";
import { generateAdvice, listAdvice } from "@/core/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const advice = await listAdvice(id);
  return NextResponse.json({ advice });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { notes?: string };
  try {
    const advice = await generateAdvice(id, body.notes ?? "");
    return NextResponse.json({ advice }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "advice failed" },
      { status: 500 },
    );
  }
}
