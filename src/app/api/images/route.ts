import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR } from "@/core/service";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("path");
  if (!raw) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }
  const resolved = path.resolve(raw);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep) || !resolved.endsWith(".png")) {
    return NextResponse.json({ error: "invalid image path" }, { status: 400 });
  }
  try {
    return new NextResponse(new Uint8Array(readFileSync(resolved)), {
      headers: { "content-type": "image/png" },
    });
  } catch {
    return NextResponse.json({ error: "image not found" }, { status: 404 });
  }
}
