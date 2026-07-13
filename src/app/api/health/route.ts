import { NextResponse } from "next/server";
import { runFfprobe } from "@/core/analyzer/ffmpeg";

export async function GET() {
  let ffmpeg = true;
  try {
    await runFfprobe(["-version"]);
  } catch {
    ffmpeg = false;
  }
  return NextResponse.json({
    ok: ffmpeg,
    ffmpeg,
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
