export const logisticsLoadExceptionWorkflow = {
  heading: "Shipment signals become a ranked recovery decision.",
  intro:
    "This live workflow uses a prepared load record. In an installation, it can read approved events from your TMS, ELD, GPS and operations inbox.",
  businessFlow: [
    ["Live load events", "TMS, ELD, GPS and inbox"],
    ["Load Exception Agent", "Combines shipment signals"],
    ["Risk checks", "Finds delay, temperature and service risk"],
    ["Dispatcher review", "Confirms recovery and communication"],
    ["Prepared outcome", "Ranked exception and update draft"],
  ],
  technicalFlow: [
    ["Firm source", "TMS, ELD, GPS or inbox"],
    ["Scoped connector", "Reads approved shipment events"],
    ["Load Exception package", "Combines the current load state"],
    ["Rules engine", "Runs delay and service thresholds"],
    ["Safety checks", "Locks dispatch and customer actions"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: false,
} as const;
