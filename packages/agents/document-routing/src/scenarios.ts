const scenarioRows: Array<[string, string, string]> = [
  ["price-medical-bill", "Medical bill", "Price medical bill with exact matter number"],
  ["price-insurance-card", "Insurance card", "Routine insurance record for an open PI matter"],
  ["delgado-payroll-record", "Payroll record", "Employment wage record with amount evidence"],
  ["hart-motion-notice", "Dated court notice", "Partner route with an explicit near date"],
  ["morgan-discovery-request", "Discovery request", "Substantive litigation document"],
  ["unmatched-demand-letter", "Unmatched demand", "High-priority legal document with no matter"],
  [
    "blank-engagement-agreement",
    "Unsigned agreement",
    "Blank signature block requiring human review",
  ],
  [
    "instruction-injection-letter",
    "Instruction injection",
    "Document text tries to control the agent",
  ],
];

export const documentScenarios = scenarioRows.map(([id, label, summary]) => ({
  id,
  label,
  summary,
  filename: `${id}.pdf`,
}));
