import type { Booking, ClinicSnapshot } from "@whynot/contracts";
import { buildRiverside, riversideMinute } from "./clinic.js";

/** Isolated named hero overrides; unrelated background load cannot obscure the authored story. */
export function buildScenario(id: string, demoDate = "2026-11-16"): ClinicSnapshot {
  if (!/^H[1-8]$/.test(id)) throw new Error("Unknown Riverside scenario");
  const snapshot = buildRiverside(demoDate);
  const minute = (day: number, time: string) => riversideMinute(day, time, demoDate);
  const protectedWindows: Record<string, [number, string, string][]> = {
    H1: [[1, "13:30", "16:00"]],
    H2: [[3, "09:00", "13:00"]],
    H3: [[0, "09:00", "12:00"]],
    H4: [[2, "10:00", "12:00"]],
    H5: [
      [2, "00:00", "24:00"],
      [4, "15:00", "17:00"],
    ],
    H6: [[1, "10:00", "12:00"]],
    H7: [[2, "08:00", "11:00"]],
    H8: [
      [1, "10:00", "12:00"],
      [2, "10:00", "12:00"],
    ],
  };
  const windows = protectedWindows[id]!.map(([day, from, to]) => ({
    from: minute(day, from),
    to: minute(day, to),
  }));
  snapshot.bookings = snapshot.bookings.filter(
    (b) => !windows.some((w) => b.start < w.to && b.end + 60 > w.from),
  );
  const add = (booking: Omit<Booking, "status">) =>
    snapshot.bookings.push({ ...booking, status: "confirmed" });
  if (id === "H1")
    add({
      id: "h1-procedure",
      patientId: "patient-2",
      serviceId: "minor-procedure",
      practitionerId: "rao",
      roomId: "treatment",
      equipmentId: "cryo-unit",
      start: minute(1, "14:00"),
      end: minute(1, "14:30"),
    });
  if (id === "H5") {
    for (let i = 0; i < 6; i++)
      add({
        id: `h5-cap-${i}`,
        patientId: `patient-${i + 2}`,
        serviceId: "physio-assessment",
        practitionerId: "harris",
        roomId: "physio",
        start: minute(2, "09:00") + i * 60,
        end: minute(2, "09:00") + i * 60 + 45,
      });
    // Protect Friday's same-time opening from an incidental daily-cap blocker.
    snapshot.bookings = snapshot.bookings.filter(
      (b) =>
        b.practitionerId !== "harris" ||
        b.start < minute(4, "00:00") ||
        b.start >= minute(5, "00:00"),
    );
  }
  if (id === "H6")
    add({
      id: "h6-dressing",
      patientId: "patient-2",
      serviceId: "long-consult",
      practitionerId: "rao",
      roomId: "consult-3",
      start: minute(1, "11:00"),
      end: minute(1, "11:30"),
    });
  if (id === "H8")
    add({
      id: "h8-existing",
      patientId: "patient-0",
      serviceId: "consult",
      practitionerId: "rao",
      roomId: "consult-1",
      start: minute(1, "08:00"),
      end: minute(1, "08:15"),
    });
  return snapshot;
}
