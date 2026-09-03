export const accountingFilingReadinessWorkflow = {
  heading: "Every filing blocker appears before release.",
  intro:
    "This live workflow uses a prepared filing package. In an installation, it can read approved status fields from your tax software and filing tracker.",
  businessFlow: [
    ["Filing package", "Return, checklist and deadline"],
    ["Readiness Agent", "Checks every required gate"],
    ["Blocker ranking", "Shows missing review, signature or payment"],
    ["Practitioner review", "Confirms professional approval"],
    ["Prepared outcome", "Ready packet or blocker list"],
  ],
  technicalFlow: [
    ["Firm source", "Tax software and filing tracker"],
    ["Scoped connector", "Reads approved status fields"],
    ["Readiness package", "Loads checklist and deadline"],
    ["Rules engine", "Runs filing release gates"],
    ["Safety checks", "Locks filing until every gate passes"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: false,
} as const;
