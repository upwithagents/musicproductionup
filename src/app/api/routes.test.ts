import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { fixturePath } from "@/core/analyzer/fixtures";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as projectsGet, POST as projectsPost } from "@/app/api/projects/route";
import { POST as tracksPost } from "@/app/api/projects/[id]/tracks/route";

describe("api routes", () => {
  test("health reports ffmpeg and api key presence", async () => {
    const res = await healthGet();
    const body = await res.json();
    expect(body.ffmpeg).toBe(true);
    expect(typeof body.anthropicKey).toBe("boolean");
  });

  test("project create + list roundtrip", async () => {
    const created = await projectsPost(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "API Song", referenceProfile: "vocal-pop" }),
      }),
    );
    expect(created.status).toBe(201);
    const list = await (await projectsGet()).json();
    expect(list.projects.some((p: { name: string }) => p.name === "API Song")).toBe(true);
    expect(list.profiles.length).toBeGreaterThan(2);
  });

  test("project create validates profile id", async () => {
    const res = await projectsPost(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "X", referenceProfile: "bogus" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test("project create rejects non-string name without throwing", async () => {
    const res = await projectsPost(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: 42, referenceProfile: "vocal-pop" }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("name and referenceProfile are required");
  });

  test("track upload accepts multipart wav and starts analysis", async () => {
    const created = await projectsPost(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Upload Song", referenceProfile: "live-band" }),
      }),
    );
    const { project } = await created.json();
    const form = new FormData();
    form.set(
      "file",
      new File([readFileSync(fixturePath("sine1k"))], "take1.wav", {
        type: "audio/wav",
      }),
    );
    const res = await tracksPost(
      new Request("http://localhost/x", { method: "POST", body: form }),
      { params: Promise.resolve({ id: project.id }) },
    );
    expect(res.status).toBe(201);
    const { track } = await res.json();
    expect(track.version).toBe(1);
  });
});
