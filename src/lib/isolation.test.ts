import { describe, expect, it } from "vitest";
import { applicationWhere, AuthError, noteWhere, reminderWhere, requireUserId } from "./isolation";

describe("isolation predicates", () => {
  it("refuses an empty user id", () => {
    expect(() => requireUserId(null)).toThrow(AuthError);
    expect(() => requireUserId(undefined)).toThrow(AuthError);
    expect(() => requireUserId("")).toThrow(AuthError);
    expect(() => applicationWhere("")).toThrow(AuthError);
  });

  it("always scopes application queries by user id", () => {
    expect(applicationWhere("user-a")).toEqual({ userId: "user-a" });
    expect(applicationWhere("user-a", "app-1")).toEqual({ id: "app-1", userId: "user-a" });
    expect(applicationWhere("user-a", "app-1")).not.toEqual({ id: "app-1" });
  });

  it("scopes notes and reminders through the owning application", () => {
    expect(noteWhere("user-a", "note-1")).toEqual({
      id: "note-1",
      application: { userId: "user-a" },
    });
    expect(reminderWhere("user-b", "rem-1")).toEqual({
      id: "rem-1",
      application: { userId: "user-b" },
    });
  });
});
