export const accountingTransactionReviewWorkflow = {
  heading: "Ledger noise becomes a short exception queue.",
  intro:
    "This live workflow uses a prepared transaction batch. In an installation, it can read approved ledger, bank-feed and expense records.",
  businessFlow: [
    ["Transactions", "Ledger, bank feed and receipts"],
    ["Transaction Agent", "Normalizes records and evidence"],
    ["Exception checks", "Finds duplicates, gaps and unknown vendors"],
    ["Accountant review", "Confirms treatment and posting"],
    ["Prepared outcome", "A focused review queue"],
  ],
  technicalFlow: [
    ["Firm source", "Ledger or expense system"],
    ["Scoped connector", "Reads the approved transaction batch"],
    ["Transaction package", "Normalizes records and evidence"],
    ["Rules engine", "Runs duplicate, category and value controls"],
    ["Safety checks", "Locks every ledger change"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: false,
} as const;
