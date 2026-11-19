import { z } from "zod";

export type AuthMode = "signin" | "signup";

const howardEmailSchema = z
  .string()
  .trim()
  .max(254, "Email address is too long.")
  .min(1, "University email is required.")
  .email("Enter a valid email address.")
  .refine((email) => email.toLowerCase().endsWith("@howard.edu"), {
    message: "Use your @howard.edu email address.",
  });

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password cannot exceed 128 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/\d/, "Password must include a number.");

export const authFormSchema = (mode: AuthMode) =>
  z.object({
    name:
      mode === "signup"
        ? z.string().trim().min(2, "Enter your full name.").max(100)
        : z.string().trim(),
    email: howardEmailSchema,
    // Sign-in intentionally checks only presence. Existing accounts may predate the
    // current password policy; strength belongs at credential creation/change time.
    password:
      mode === "signup"
        ? strongPasswordSchema
        : z.string().min(1, "Password is required.").max(128, "Password cannot exceed 128 characters."),
  });

export type AuthFormValues = z.infer<ReturnType<typeof authFormSchema>>;

export const EVENT_CATEGORIES = ["social", "academic", "career", "sports", "arts"] as const;

const isFutureLocalDateTime = (date: string, time: string) => {
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

const isCalendarDate = (date: string) => {
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, "Event title must be at least 3 characters.").max(200),
    description: z
      .string()
      .trim()
      .min(10, "Event description must be at least 10 characters."),
    category: z.enum(EVENT_CATEGORIES),
    startsAt: z.string().datetime({ offset: true }).optional(),
    timezone: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid event date.").refine(isCalendarDate, "Enter a valid calendar date."),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid event time."),
    location: z.string().trim().min(3, "Location must be at least 3 characters."),
    capacity: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d+$/.test(value), {
        message: "Capacity must be a whole number.",
      })
      .refine((value) => value === "" || Number(value) >= 1, {
        message: "Capacity must be at least 1.",
      })
      .refine((value) => value === "" || Number(value) <= 10_000, {
        message: "Capacity cannot exceed 10,000.",
      }),
    tags: z.string().trim(),
  })
  .superRefine((values, context) => {
    if (values.startsAt) {
      try {
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: values.timezone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(new Date(values.startsAt));
        const part = (type: string) => parts.find(p => p.type === type)?.value;
        if (`${part("year")}-${part("month")}-${part("day")}` !== values.date || `${part("hour")}:${part("minute")}` !== values.time) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: "Event time does not match its timezone.", path: ["time"] });
        }
      } catch {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid event timezone.", path: ["time"] });
      }
    }
    if (values.date && values.time && !(values.startsAt ? new Date(values.startsAt).getTime() > Date.now() : isFutureLocalDateTime(values.date, values.time))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Event date and time must be in the future.",
        path: ["date"],
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
