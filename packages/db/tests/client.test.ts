import { describe, expect, it } from "vitest";

import { readDatabaseEnvironment } from "../src/client";

describe("database environment", () => {
  it("returns the private server credentials", () => {
    expect(
      readDatabaseEnvironment({
        SUPABASE_SERVICE_ROLE_KEY: "secret",
        SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual({
      serviceRoleKey: "secret",
      url: "https://example.supabase.co",
    });
  });

  it("prefers the current Supabase secret key", () => {
    expect(
      readDatabaseEnvironment({
        SUPABASE_SECRET_KEY: "current-secret",
        SUPABASE_SERVICE_ROLE_KEY: "legacy-secret",
        SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual({
      serviceRoleKey: "current-secret",
      url: "https://example.supabase.co",
    });
  });

  it("rejects incomplete configuration", () => {
    expect(() => readDatabaseEnvironment({})).toThrow(
      "SUPABASE_URL and SUPABASE_SECRET_KEY are required",
    );
  });
});
