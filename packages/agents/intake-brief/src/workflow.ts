export const intakeBriefWorkflow = {
  heading: "An inquiry enters once. Your team gets a clear next step.",
  intro:
    "This live workflow uses the form below. In a firm installation, the same inquiry can arrive from your website, inbox, ads or CRM.",
  businessFlow: [
    ["New inquiry", "Website form, email, ad or CRM"],
    ["Intake Agent", "Structures the facts and history"],
    ["Qualification", "Checks fit, risk, urgency and gaps"],
    ["Firm review", "Confirms conflicts, fit and reply"],
    ["Prepared outcome", "Brief and response draft"],
  ],
  technicalFlow: [
    ["Firm source", "Approved inquiry channel"],
    ["Scoped connector", "Reads only the submitted record"],
    ["Intake package", "Loads firm rules and context"],
    ["Groq + Qwen", "Interprets bounded fields"],
    ["Safety checks", "Validates structure, limits and claims"],
    ["Firm-owned Supabase", "Stores the result and run trace"],
    ["Named reviewer", "Approves, edits or rejects"],
  ],
  usesModel: true,
} as const;
