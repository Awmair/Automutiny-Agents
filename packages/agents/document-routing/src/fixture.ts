import { readFile } from "node:fs/promises";
import { documentScenarios } from "./scenarios";

export async function readDocumentScenario(id: string) {
  const scenario = documentScenarios.find((item) => item.id === id);
  if (!scenario) throw new Error("Choose a valid prepared document scenario.");
  return {
    bytes: new Uint8Array(
      await readFile(new URL(`../fixtures/pdfs/${scenario.filename}`, import.meta.url)),
    ),
    filename: scenario.filename,
    mime: "application/pdf",
  };
}
