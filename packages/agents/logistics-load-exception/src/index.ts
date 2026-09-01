import {
  defineAgent,
  type OperationalScenario,
  runOperationalCase,
} from "@automutiny/agent-runtime";
import type { OperationalOutput, SupabaseClient } from "@automutiny/db";

export type LoadExceptionInput = Record<string, unknown> & {
  load_id: string;
  customer: string;
  lane: string;
  pickup_delay_minutes: number;
  eta_variance_minutes: number;
  temperature_excursion: boolean;
  driver_checkin_minutes_ago: number;
};

export const logisticsLoadExceptionAgent = defineAgent({
  id: "logistics-load-exception",
  label: "Logistics Agent 1",
  name: "Load Exception Agent",
  purpose: "Finds service exceptions and prepares a dispatcher-ready escalation.",
  humanBoundary:
    "Dispatch confirms the event, customer update, recovery plan and appointment change.",
  route: "/logistics/load-exception",
});

export const logisticsLoadExceptionScenarios = [
  {
    id: "load-4821-critical",
    label: "Late reefer load",
    summary: "ETA slipped 110 minutes and a temperature excursion needs immediate verification.",
    subject: "Load 4821 · Phoenix to Los Angeles",
    input: {
      load_id: "4821",
      customer: "Western Grocers",
      lane: "Phoenix, AZ to Los Angeles, CA",
      pickup_delay_minutes: 45,
      eta_variance_minutes: 110,
      temperature_excursion: true,
      driver_checkin_minutes_ago: 78,
    },
  },
  {
    id: "load-5174-watch",
    label: "Appointment risk",
    summary: "The ETA moved 42 minutes and the latest driver check-in is stale.",
    subject: "Load 5174 · Dallas to Tulsa",
    input: {
      load_id: "5174",
      customer: "Redline Components",
      lane: "Dallas, TX to Tulsa, OK",
      pickup_delay_minutes: 10,
      eta_variance_minutes: 42,
      temperature_excursion: false,
      driver_checkin_minutes_ago: 68,
    },
  },
  {
    id: "load-5290-on-track",
    label: "On-track shipment",
    summary: "All monitored events remain inside the configured service thresholds.",
    subject: "Load 5290 · Reno to Sacramento",
    input: {
      load_id: "5290",
      customer: "Sierra Office Supply",
      lane: "Reno, NV to Sacramento, CA",
      pickup_delay_minutes: 0,
      eta_variance_minutes: 8,
      temperature_excursion: false,
      driver_checkin_minutes_ago: 21,
    },
  },
] satisfies readonly OperationalScenario<LoadExceptionInput>[];

export function analyzeLogisticsLoadException(input: LoadExceptionInput): OperationalOutput {
  const exceptions = [
    ...(input.pickup_delay_minutes >= 30
      ? [
          {
            title: "Pickup delay",
            evidence: `${input.pickup_delay_minutes} minutes behind pickup plan.`,
            impact: "Downstream appointment time may be affected.",
            action: "Confirm the actual departure time and recovery plan with dispatch.",
          },
        ]
      : []),
    ...(input.eta_variance_minutes >= 30
      ? [
          {
            title: "ETA variance",
            evidence: `Current ETA is ${input.eta_variance_minutes} minutes later than plan.`,
            impact: "Customer delivery expectations may no longer be accurate.",
            action: "Dispatcher should verify ETA before approving a customer update.",
          },
        ]
      : []),
    ...(input.temperature_excursion
      ? [
          {
            title: "Temperature excursion",
            evidence: "A monitored temperature event crossed the configured range.",
            impact: "Product condition may require shipper and receiver review.",
            action: "Verify sensor evidence and escalate through the temperature-control SOP.",
          },
        ]
      : []),
    ...(input.driver_checkin_minutes_ago >= 60
      ? [
          {
            title: "Stale driver check-in",
            evidence: `Last driver check-in was ${input.driver_checkin_minutes_ago} minutes ago.`,
            impact: "The current location and recovery estimate are not confirmed.",
            action: "Request a dispatcher-approved driver check-in.",
          },
        ]
      : []),
  ];
  const critical = input.temperature_excursion || input.eta_variance_minutes >= 90;
  const priority = critical ? "high" : exceptions.length ? "medium" : "low";

  return {
    headline: exceptions.length
      ? `${exceptions.length} live exception${exceptions.length === 1 ? "" : "s"} need dispatch review`
      : "Shipment remains inside the configured service thresholds",
    summary: `Load ${input.load_id} is moving on ${input.lane}. The current ETA variance is ${input.eta_variance_minutes} minutes.`,
    status: critical ? "blocked" : exceptions.length ? "needs_review" : "ready",
    priority,
    confidence: 0.99,
    signals: [
      {
        label: "Pickup variance",
        value: `${input.pickup_delay_minutes} min`,
        tone: input.pickup_delay_minutes >= 30 ? "watch" : "positive",
      },
      {
        label: "ETA variance",
        value: `${input.eta_variance_minutes} min`,
        tone:
          input.eta_variance_minutes >= 90
            ? "alert"
            : input.eta_variance_minutes >= 30
              ? "watch"
              : "positive",
      },
      {
        label: "Temperature",
        value: input.temperature_excursion ? "Excursion" : "In range",
        tone: input.temperature_excursion ? "alert" : "positive",
      },
      {
        label: "Driver check-in",
        value: `${input.driver_checkin_minutes_ago} min ago`,
        tone: input.driver_checkin_minutes_ago >= 60 ? "watch" : "positive",
      },
    ],
    exceptions: exceptions.map((exception) => ({
      title: exception.title,
      evidence: exception.evidence,
      impact: exception.impact,
      recommended_action: exception.action,
    })),
    checks: [
      {
        label: "Pickup threshold",
        status: input.pickup_delay_minutes >= 30 ? "review" : "pass",
        detail: "Escalates at 30 minutes behind plan.",
      },
      {
        label: "ETA threshold",
        status:
          input.eta_variance_minutes >= 90
            ? "fail"
            : input.eta_variance_minutes >= 30
              ? "review"
              : "pass",
        detail: "Reviews at 30 minutes and escalates at 90 minutes.",
      },
      {
        label: "Temperature event",
        status: input.temperature_excursion ? "fail" : "pass",
        detail: input.temperature_excursion
          ? "Recorded event needs human verification."
          : "No excursion is recorded.",
      },
      {
        label: "Driver contact",
        status: input.driver_checkin_minutes_ago >= 60 ? "review" : "pass",
        detail: "Reviews when no check-in is recorded for 60 minutes.",
      },
    ],
    recommended_action: exceptions.length
      ? "Dispatch should confirm current conditions, choose the recovery plan and approve any customer update."
      : "Continue monitoring. No customer update is prepared.",
    draft_message: exceptions.length
      ? `Update for load ${input.load_id}: the current estimated arrival is ${input.eta_variance_minutes} minutes later than plan. Our operations team is verifying the latest status and will confirm the recovery plan.`
      : `Load ${input.load_id} remains on track within the configured monitoring thresholds.`,
  };
}

export function submitLogisticsLoadException(
  scenarioId: string,
  options: { client?: SupabaseClient; visitorSessionId: string },
) {
  const scenario = logisticsLoadExceptionScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Unknown Load Exception scenario.");
  return runOperationalCase({
    agentId: logisticsLoadExceptionAgent.id,
    scenario,
    analyze: analyzeLogisticsLoadException,
    ...options,
  });
}
