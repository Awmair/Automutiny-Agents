export const documentRoutingWorkflow = {
  heading: "A document arrives once. Your team gets the right route.",
  intro:
    "This live workflow uses a prepared or uploaded PDF. In a firm installation, documents can arrive from your portal, inbox, scanner or document system.",
  businessFlow: [
    ["New document", "Portal, inbox, scanner or upload"],
    ["Document Agent", "Extracts facts and evidence"],
    ["Routing checks", "Checks type, matter, signature and priority"],
    ["Firm review", "Confirms authenticity and destination"],
    ["Prepared outcome", "Route or client-request draft"],
  ],
  technicalFlow: [
    ["Firm source", "Approved document channel"],
    ["Scoped connector", "Reads one submitted document"],
    ["Document package", "Extracts text and loads matter context"],
    ["Groq + Qwen", "Classifies bounded content"],
    ["Safety checks", "Validates evidence and routing limits"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: true,
} as const;
