import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { documentScenarios } from "./scenarios";

export async function readDocumentFixture(filename: string) {
  const candidates = [
    resolve(process.cwd(), "packages/agents/document-routing/fixtures/pdfs", filename),
    resolve(process.cwd(), "../../packages/agents/document-routing/fixtures/pdfs", filename),
  ];
  for (const path of candidates) {
    try {
      return new Uint8Array(await readFile(path));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  throw new Error(`Prepared document fixture could not be found: ${filename}`);
}

export async function readDocumentScenario(id: string) {
  const scenario = documentScenarios.find((item) => item.id === id);
  if (!scenario) throw new Error("Choose a valid prepared document scenario.");
  return {
    bytes: await readDocumentFixture(scenario.filename),
    filename: scenario.filename,
    mime: "application/pdf",
  };
}
