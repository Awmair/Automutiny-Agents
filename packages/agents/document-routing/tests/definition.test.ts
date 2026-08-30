import { describe, expect, it } from "vitest";

import { documentRoutingAgent } from "../src";

describe("documentRoutingAgent", () => {
  it("publishes the document route and human boundary", () => {
    expect(documentRoutingAgent.route).toBe("/documents");
    expect(documentRoutingAgent.humanBoundary).toContain("final routing");
  });
});
