import {
  ClinicSnapshotSchema,
  type ClinicSnapshot,
  type Service,
  type WeeklyHours,
} from "@whynot/contracts";
import { addLocalDays, localDateDifference, resolveRecurringBoundary } from "@whynot/engine";
import { fillBackground } from "./load.js";

/** Resolve a demo-week wall time using the explicit Riverside timezone. */
export function riversideMinute(day: number, time: string, demoDate = "2026-11-16"): number {
  const date = addLocalDays(demoDate, day);
  if (!date.ok) throw new Error("Invalid Riverside demo date");
  const result = resolveRecurringBoundary(date.value, time, "Europe/London", time === "24:00");
  if (!result.ok) throw new Error("Unsupported Riverside demo boundary");
  return result.value;
}

const hours = (days: number[], from: string, to: string): WeeklyHours =>
  days.map((weekday) => ({ weekday, from, to }));
const weekdays = [1, 2, 3, 4, 5];

/** Fresh fictional Riverside clinic, seeded load relative to an explicit demo Monday.
 * Named scenario overrides are applied separately, never to this shared base.
 */
export function buildRiverside(demoDate = "2026-11-16", seed = 1729): ClinicSnapshot {
  const monday = localDateDifference("1970-01-05", demoDate);
  if (!monday.ok) throw new Error("Invalid demo date");
  // 1970-01-05 is Monday; date arithmetic stays in the engine time helpers.
  const start = riversideMinute(0, "00:00", demoDate);
  if (((monday.value % 7) + 7) % 7 !== 0) throw new Error("Demo date must be Monday");
  const service = (
    id: string,
    displayName: string,
    durationMin: number,
    requiredSkill: string,
    extra: Partial<Service> = {},
  ): Service => ({
    id,
    displayName,
    durationMin,
    requiredSkill,
    bufferAfterMin: 0,
    roomTurnoverMin: 0,
    eligibility: "any",
    ...extra,
  });
  const practitioners = [
    {
      id: "rao",
      displayName: "Dr. Asha Rao",
      role: "GP",
      skills: ["consult", "minor-procedure"],
      workingHours: hours(weekdays, "08:00", "16:00"),
      breaks: hours(weekdays, "12:30", "13:15"),
      timeOff: [],
    },
    {
      id: "mehta",
      displayName: "Dr. Vikram Mehta",
      role: "GP",
      skills: ["consult", "minor-procedure"],
      workingHours: hours([2, 3, 4, 5, 6], "08:00", "16:00"),
      breaks: [],
      timeOff: [
        {
          id: "mehta-leave",
          from: riversideMinute(1, "00:00", demoDate),
          to: riversideMinute(4, "00:00", demoDate),
          reason: "Fictional annual leave",
        },
      ],
    },
    {
      id: "okafor",
      displayName: "Dr. Lena Okafor",
      role: "GP",
      skills: ["consult"],
      workingHours: hours([1, 2, 3, 4], "10:00", "18:00"),
      breaks: [],
      timeOff: [],
    },
    {
      id: "iyer",
      displayName: "Nurse Priya Iyer",
      role: "Nurse",
      skills: ["vaccination", "dressing", "bloods"],
      workingHours: hours(weekdays, "08:00", "14:00"),
      breaks: [],
      timeOff: [],
    },
    {
      id: "harris",
      displayName: "Physio Tom Harris",
      role: "Physiotherapist",
      skills: ["physio"],
      workingHours: hours([1, 3, 5], "09:00", "17:00"),
      breaks: [],
      timeOff: [],
      dailyCap: 6,
    },
    {
      id: "chen",
      displayName: "Sonographer Mei Chen",
      role: "Sonographer",
      skills: ["ultrasound"],
      workingHours: hours([2, 4], "09:00", "15:00"),
      breaks: [],
      timeOff: [],
    },
  ];
  const snapshot = ClinicSnapshotSchema.parse({
    clinic: {
      id: "riverside",
      name: "Riverside Family Clinic",
      timezone: "Europe/London",
      slotGridMinutes: 15,
      openingHours: [...hours(weekdays, "08:00", "18:00"), ...hours([6], "09:00", "13:00")],
      closedDates: [],
    },
    coverage: { from: start, to: riversideMinute(31, "00:00", demoDate) },
    practitioners,
    rooms: [
      ["consult-1", "Consult 1", ["consult"]],
      ["consult-2", "Consult 2", ["consult"]],
      ["consult-3", "Consult 3", ["consult", "dressing"]],
      ["treatment", "Treatment Room", ["procedure", "dressing"]],
      ["physio", "Physio Studio", ["physio"]],
      ["imaging", "Imaging Room", ["ultrasound"]],
    ].map(([id, displayName, capabilities]) => ({
      id,
      displayName,
      capabilities,
      maintenance: [],
    })),
    equipment: [
      {
        id: "ultrasound-unit",
        displayName: "Ultrasound unit",
        type: "ultrasound",
        maintenance: [
          {
            id: "ultrasound-maintenance",
            from: riversideMinute(3, "09:00", demoDate),
            to: riversideMinute(3, "12:00", demoDate),
          },
        ],
      },
      { id: "cryo-unit", displayName: "Cryotherapy unit", type: "cryo", maintenance: [] },
    ],
    services: [
      service("consult", "GP consultation", 15, "consult", { requiredRoomCapability: "consult" }),
      service("long-consult", "Long consultation", 30, "consult", {
        requiredRoomCapability: "consult",
      }),
      service("minor-procedure", "Minor procedure", 30, "minor-procedure", {
        requiredRoomCapability: "procedure",
        requiredEquipmentType: "cryo",
        bufferAfterMin: 15,
        roomTurnoverMin: 10,
      }),
      service("vaccination", "Vaccination", 10, "vaccination"),
      service("dressing", "Wound dressing", 20, "dressing", { requiredRoomCapability: "dressing" }),
      service("bloods", "Blood test", 10, "bloods"),
      service("physio-assessment", "Physio assessment", 45, "physio", {
        requiredRoomCapability: "physio",
      }),
      service("physio-follow-up", "Physio follow-up", 30, "physio", {
        requiredRoomCapability: "physio",
        eligibility: "returning_only",
      }),
      service("ultrasound", "Ultrasound scan", 30, "ultrasound", {
        requiredRoomCapability: "ultrasound",
        requiredEquipmentType: "ultrasound",
        roomTurnoverMin: 15,
        eligibility: "referral_required",
      }),
    ],
    patients: Array.from({ length: 12 }, (_, i) => ({
      id: `patient-${i}`,
      displayName: `Fictional Patient ${i + 1}`,
      isReturning: i % 3 === 0,
      referrals: i % 2 === 0 ? ["ultrasound"] : [],
    })),
    bookings: [],
    policy: {
      versionId: "riverside-v1",
      minNoticeMin: 120,
      maxAdvanceDays: 30,
      patientMaxBookingsPerDay: 1,
    },
  });
  snapshot.rooms.find((room) => room.id === "treatment")!.maintenance = [
    {
      id: "treatment-maintenance",
      from: riversideMinute(1, "10:00", demoDate),
      to: riversideMinute(1, "11:30", demoDate),
    },
  ];
  return fillBackground(snapshot, demoDate, seed);
}
