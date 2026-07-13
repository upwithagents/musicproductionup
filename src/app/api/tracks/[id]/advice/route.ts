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
    const message = e instanceof Error ? e.message : "advice failed";
    const recoverable =
      /analysis has not completed|ANTHROPIC_API_KEY/i.test(message);
    return NextResponse.json({ error: message }, { status: recoverable ? 400 : 500 });
  }
}
