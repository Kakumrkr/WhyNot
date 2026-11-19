type Scenario = {
  id: string;
  label: string;
  day: number;
  time: string;
  serviceId: string;
  patientId?: string;
  practitionerId?: string;
  now?: { day: number; time: string };
  days?: number;
};

export const scenarios: Scenario[] = [
  { id: "H1", label: "Minor procedure", day: 1, time: "14:30", serviceId: "minor-procedure" },
  { id: "H2", label: "Ultrasound", day: 3, time: "10:00", serviceId: "ultrasound" },
  { id: "H3", label: "Same-day consultation", day: 0, time: "10:00", serviceId: "consult" },
  {
    id: "H4",
    label: "Physiotherapy follow-up",
    day: 2,
    time: "11:00",
    serviceId: "physio-follow-up",
    patientId: "patient-1",
  },
  {
    id: "H5",
    label: "Physiotherapy assessment",
    day: 2,
    time: "16:00",
    serviceId: "physio-assessment",
  },
  { id: "H6", label: "Wound dressing", day: 1, time: "11:00", serviceId: "dressing" },
  {
    id: "H7",
    label: "Consultation with Dr. Okafor",
    day: 2,
    time: "09:00",
    serviceId: "consult",
    practitionerId: "okafor",
  },
  { id: "H8", label: "Blood test", day: 1, time: "11:00", serviceId: "bloods" },
  {
    id: "H9",
    label: "Ultrasound without a referral",
    day: 0,
    time: "10:00",
    serviceId: "ultrasound",
    patientId: "patient-1",
    now: { day: 0, time: "06:00" },
    days: 5,
  },
  {
    id: "H10",
    label: "Friday with Dr. Okafor",
    day: 4,
    time: "10:00",
    serviceId: "consult",
    practitionerId: "okafor",
    now: { day: 3, time: "09:00" },
  },
  {
    id: "H11",
    label: "Fully booked Tuesday for minor procedures",
    day: 1,
    time: "14:30",
    serviceId: "minor-procedure",
    now: { day: 1, time: "08:30" },
  },
];
