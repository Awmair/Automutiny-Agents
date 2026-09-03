export const accountingDocumentChaseWorkflow = {
  heading: "Missing records become one clear client follow-up.",
  intro:
    "This live workflow uses a prepared client file. In an installation, it can read your portal, inbox and engagement checklist.",
  businessFlow: [
    ["Client records", "Portal, inbox and checklist"],
    ["Document Chase Agent", "Compares received and required items"],
    ["Priority checks", "Finds missing, stale and urgent records"],
    ["Accountant review", "Confirms the request and timing"],
    ["Prepared outcome", "One client-ready follow-up"],
  ],
  technicalFlow: [
    ["Firm source", "Portal, inbox or checklist"],
    ["Scoped connector", "Reads approved engagement records"],
    ["Document Chase package", "Loads checklist and deadlines"],
    ["Rules engine", "Compares status and due dates"],
    ["Safety checks", "Prevents duplicate or unsupported requests"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: false,
} as const;
