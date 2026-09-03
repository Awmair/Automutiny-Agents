export const stalledWorkWorkflow = {
  heading: "Quiet work becomes a prioritized owner brief.",
  intro:
    "This live workflow scans prepared firm records. In an installation, it reads approved matters, tasks and deadlines from your practice system.",
  businessFlow: [
    ["Open work", "Matters, tasks and deadlines"],
    ["SLA scan", "Finds quiet, late or blocked work"],
    ["Risk ranking", "Explains urgency and ownership"],
    ["Owner review", "Approves, snoozes or dismisses"],
    ["Prepared outcome", "Monday brief and follow-up drafts"],
  ],
  technicalFlow: [
    ["Practice system", "Approved matter records"],
    ["Scoped connector", "Reads tasks, activity and deadlines"],
    ["Stalled Work package", "Applies firm SLA rules"],
    ["Groq + Qwen", "Ranks and explains bounded detections"],
    ["Safety checks", "Validates priority and allowed actions"],
    ["Firm-owned Supabase", "Stores the brief and run trace"],
    ["Named reviewer", "Approves, snoozes or dismisses"],
  ],
  usesModel: true,
} as const;
