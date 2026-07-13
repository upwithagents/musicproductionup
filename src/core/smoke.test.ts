import { expect, test } from "vitest";
import { prisma } from "@/core/db";

test("db roundtrip: create and read a project", async () => {
  const p = await prisma.project.create({
    data: { name: "Smoke", referenceProfile: "streaming-master" },
  });
  const found = await prisma.project.findUnique({ where: { id: p.id } });
  expect(found?.name).toBe("Smoke");
});
