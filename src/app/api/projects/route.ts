import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/core/service";
import { PROFILES } from "@/core/references/profiles";

export async function GET() {
  return NextResponse.json({ projects: await listProjects(), profiles: PROFILES });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    referenceProfile?: string;
    notes?: string;
  } | null;
  if (!body?.name?.trim() || !body.referenceProfile) {
    return NextResponse.json(
      { error: "name and referenceProfile are required" },
      { status: 400 },
    );
  }
  try {
    const project = await createProject(
      body.name.trim(),
      body.referenceProfile,
      body.notes ?? "",
    );
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "create failed" },
      { status: 400 },
    );
  }
}
