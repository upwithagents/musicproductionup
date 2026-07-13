import { NextResponse } from "next/server";
import { saveUpload, startAnalysis, UploadError } from "@/core/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'multipart form with a "file" field is required' },
      { status: 400 },
    );
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const track = await saveUpload(id, file.name, bytes);
    startAnalysis(track.id);
    return NextResponse.json({ track }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) {
      const status =
        e.reason === "no_project" ? 404 : e.reason === "too_large" ? 413 : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 500 },
    );
  }
}
