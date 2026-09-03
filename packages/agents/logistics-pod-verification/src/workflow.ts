export const logisticsPodVerificationWorkflow = {
  heading: "Delivery evidence becomes a billing-ready decision.",
  intro:
    "This live workflow uses a prepared POD record. In an installation, evidence can arrive from your driver app, inbox, scanner or document system.",
  businessFlow: [
    ["Delivery evidence", "Driver app, inbox or scan"],
    ["POD Agent", "Matches the document to the load"],
    ["Evidence checks", "Checks signature, image and damage"],
    ["Operations review", "Confirms authenticity and acceptance"],
    ["Prepared outcome", "Billing release or evidence hold"],
  ],
  technicalFlow: [
    ["Firm source", "Driver app or document system"],
    ["Scoped connector", "Reads the approved delivery record"],
    ["POD package", "Matches evidence to the shipment"],
    ["Rules engine", "Checks required billing fields"],
    ["Safety checks", "Locks billing on any exception"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: false,
} as const;
