const apiKey = process.env.GROQ_API_KEY;
const model = process.env.MODEL_ID ?? "qwen/qwen3.6-27b";

if (!apiKey) throw new Error("GROQ_API_KEY is required for the live schema check.");

const checks = [
  {
    name: "intake",
    prompt:
      'Return only JSON with keys practice_area, fit_score, fit_reasons, disqualifiers, missing_facts, conflict_check_required, urgency, sol_flag, confidence. Use practice_area "unknown", fit_score 5 and confidence 0.7.',
    validate: (value) =>
      value.practice_area === "unknown" &&
      Number.isFinite(value.fit_score) &&
      Array.isArray(value.missing_facts),
  },
  {
    name: "document",
    prompt:
      'Return only JSON with keys doc_type, signed, parties, dates, amounts, key_fields, is_scanned, confidence, evidence. Use doc_type "unknown", signed null and confidence 0.6.',
    validate: (value) =>
      value.doc_type === "unknown" && Array.isArray(value.evidence) && value.signed === null,
  },
  {
    name: "stalled",
    prompt:
      'Return only JSON with key assessments containing one item with item_id "fixture", severity "medium", why under 40 words, recommended_action "internal_nudge", owner_role "paralegal", confidence 0.7.',
    validate: (value) =>
      Array.isArray(value.assessments) &&
      value.assessments[0]?.item_id === "fixture" &&
      value.assessments[0]?.severity === "medium",
  },
];

for (const check of checks) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "This is a synthetic schema check. Do not add prose or markdown.",
        },
        { role: "user", content: check.prompt },
      ],
      reasoning_effort: "none",
      temperature: 0,
      max_completion_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok)
    throw new Error(`${check.name} schema check failed with HTTP ${response.status}.`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content ?? "null");
  if (!check.validate(parsed)) throw new Error(`${check.name} schema check returned invalid JSON.`);
  console.log(`PASS ${check.name}: ${model}`);
}
