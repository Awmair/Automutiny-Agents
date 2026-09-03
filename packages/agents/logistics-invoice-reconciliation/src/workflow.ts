export const logisticsInvoiceReconciliationWorkflow = {
  heading: "Each carrier charge is matched before payment.",
  intro:
    "This live workflow uses prepared invoice records. In an installation, it can read approved invoices, rate confirmations, POD status and accessorial evidence.",
  businessFlow: [
    ["Billing records", "Invoice, rate confirmation and POD"],
    ["Invoice Agent", "Matches each charge to evidence"],
    ["Variance checks", "Finds rate, fuel and accessorial gaps"],
    ["AP review", "Approves, holds or disputes"],
    ["Prepared outcome", "Payment-ready result or exception"],
  ],
  technicalFlow: [
    ["Firm source", "AP inbox, TMS and rate records"],
    ["Scoped connector", "Reads the approved invoice package"],
    ["Invoice package", "Matches charges and supporting evidence"],
    ["Rules engine", "Runs rate and approval controls"],
    ["Safety checks", "Locks payment on any exception"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: false,
} as const;
