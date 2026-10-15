import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApplication, createNote, deleteApplication, listApplications, updateApplication } from "./repository";

describe("per-user data isolation", () => {
  let db: PrismaClient;
  let dir = "";
  let userA = "";
  let userB = "";

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "jobtrackr-"));
    const url = `file:${path.join(dir, "test.db")}`;
    execSync("npx prisma db push --schema prisma/.generated/schema.prisma --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });
    db = new PrismaClient({ datasources: { db: { url } } });
    userA = (await db.user.create({ data: { email: "a@example.com", name: "A" } })).id;
    userB = (await db.user.create({ data: { email: "b@example.com", name: "B" } })).id;
  }, 60_000);

  afterAll(async () => {
    await db?.$disconnect();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("hides another user's applications, notes, and deletes", async () => {
    const created = await createApplication(
      userA,
      { company: "Initech", role: "Product Engineer", stage: "SAVED" },
      db,
    );
    expect(created.ok).toBe(true);
    const applicationId = created.applications[0]?.id;
    expect(applicationId).toBeTruthy();

    expect(await listApplications(userB, db)).toEqual([]);
    expect((await listApplications(userA, db)).map((app) => app.company)).toEqual(["Initech"]);

    const stolen = await updateApplication(
      userB,
      applicationId!,
      { company: "Stolen", role: "Product Engineer", stage: "OFFER" },
      db,
    );
    expect(stolen.ok).toBe(false);
    expect(stolen.error).toBe("Not found");
    expect((await listApplications(userA, db))[0]?.company).toBe("Initech");
    expect((await listApplications(userA, db))[0]?.stage).toBe("SAVED");

    const note = await createNote(userB, applicationId!, { body: "not yours" }, db);
    expect(note.ok).toBe(false);
    expect((await listApplications(userA, db))[0]?.notes).toEqual([]);

    const removed = await deleteApplication(userB, applicationId!, db);
    expect(removed.ok).toBe(false);
    expect(await listApplications(userA, db)).toHaveLength(1);

    const gone = await deleteApplication(userA, applicationId!, db);
    expect(gone.ok).toBe(true);
    expect(await listApplications(userA, db)).toEqual([]);
    expect(await listApplications(userB, db)).toEqual([]);
  });
});
