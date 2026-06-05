import { z } from "zod";

// ---------------------------------------------------------------------------
// Domain DTOs — JSON shapes: timestamps are epoch-ms numbers, active is boolean
// ---------------------------------------------------------------------------

export interface Task {
  id: number;
  title: string;
  notes: string | null;
  position: number;
  status: "active" | "completed";
  origin: "manual" | "daily" | "weekly" | "monthly";
  ruleId: number | null;
  occurrenceKey: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface RecurringRule {
  id: number;
  title: string;
  type: "daily" | "weekly" | "monthly";
  timeOfDay: string; // "HH:MM" local
  dayOfWeek: number | null; // 0=Sun..6=Sat (weekly)
  dayOfMonth: number | null; // 1–31 (monthly)
  active: boolean;
  nextRunAt: number; // UTC epoch ms
  lastFiredAt: number | null;
  createdAt: number;
}

export interface Birthday {
  id: number;
  name: string;
  birthMonth: number; // 1–12
  birthDay: number; // 1–31
  birthYear: number | null;
  note: string | null;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// View DTOs
// ---------------------------------------------------------------------------

export interface UpcomingBirthday {
  id: number;
  name: string;
  birthMonth: number;
  birthDay: number;
  birthYear: number | null;
  note: string | null;
  daysUntil: number;
  label: string; // "today" | "in N days"
  turning: number | null; // age they're turning, if birthYear set
}

export interface BirthdayMonthGroup {
  month: number; // 1–12
  monthName: string;
  contacts: Array<
    Birthday & {
      currentAge: number | null;
    }
  >;
}

export interface CustomMonth {
  start: number; // epoch ms of the 25th 00:00 local
  end: number; // epoch ms of the 24th 23:59:59.999 local
  monthKey: string; // "YYYY-MM" of the start date
}

// ---------------------------------------------------------------------------
// Devices (ECDSA P-256 auth)
// ---------------------------------------------------------------------------

export interface Device {
  id: string;
  nickname: string;
  createdAt: number;
}

/** ECDSA P-256 private JWK exported by Web Crypto. */
export type EcdsaPrivateJwk = {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
  d: string;
};

export interface DeviceCredential {
  deviceId: string;
  nickname: string;
  privateKey: EcdsaPrivateJwk;
}

// ---------------------------------------------------------------------------
// Request DTOs + zod schemas — the API contract
// ---------------------------------------------------------------------------

export const CreateTaskInput = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(2000).nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export const ReorderInput = z.union([
  z.object({ order: z.array(z.number().int().positive()) }),
  z.object({
    id: z.number().int().positive(),
    direction: z.enum(["up", "down", "top"]),
  }),
]);
export type ReorderInput = z.infer<typeof ReorderInput>;

export const CreateRuleInput = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(["daily", "weekly", "monthly"]),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
});
export type CreateRuleInput = z.infer<typeof CreateRuleInput>;

export const UpdateRuleInput = z.object({
  title: z.string().min(1).max(500).optional(),
  type: z.enum(["daily", "weekly", "monthly"]).optional(),
  timeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  active: z.boolean().optional(),
});
export type UpdateRuleInput = z.infer<typeof UpdateRuleInput>;

export const CreateBirthdayInput = z.object({
  name: z.string().min(1).max(200),
  birthMonth: z.number().int().min(1).max(12),
  birthDay: z.number().int().min(1).max(31),
  birthYear: z.number().int().min(1900).max(2100).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});
export type CreateBirthdayInput = z.infer<typeof CreateBirthdayInput>;

export const UpdateBirthdayInput = z.object({
  name: z.string().min(1).max(200).optional(),
  birthMonth: z.number().int().min(1).max(12).optional(),
  birthDay: z.number().int().min(1).max(31).optional(),
  birthYear: z.number().int().min(1900).max(2100).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});
export type UpdateBirthdayInput = z.infer<typeof UpdateBirthdayInput>;

const DeviceId = z.string().min(1).max(200);
const DeviceNickname = z.string().trim().min(1).max(100);
const PublicKeyJwk = z.object({}).passthrough();

export const CreateDeviceInput = z.object({
  deviceId: DeviceId,
  nickname: DeviceNickname,
  publicKeyJwk: PublicKeyJwk,
});
export type CreateDeviceInput = z.infer<typeof CreateDeviceInput>;

// ---------------------------------------------------------------------------
// Error shape
// ---------------------------------------------------------------------------

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
