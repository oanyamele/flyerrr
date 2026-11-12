import { z } from "zod";

import type { EventCategory } from "@/data/mockEvents";

export type AuthMode = "signin" | "signup";

const howardEmailSchema = z
  .string()
  .trim()
  .min(1, "University email is required.")
  .email("Enter a valid email address.")
  .refine((email) => email.toLowerCase().endsWith("@howard.edu"), {
    message: "Use your @howard.edu email address.",
  });

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/\d/, "Password must include a number.");

export const authFormSchema = (mode: AuthMode) =>
  z.object({
    name:
      mode === "signup"
        ? z.string().trim().min(2, "Enter your full name.")
        : z.string().trim(),
    email: howardEmailSchema,
    // Sign-in intentionally checks only presence. Existing accounts may predate the
    // current password policy; strength belongs at credential creation/change time.
    password:
      mode === "signup"
        ? strongPasswordSchema
        : z.string().min(1, "Password is required."),
  });

export type AuthFormValues = z.infer<ReturnType<typeof authFormSchema>>;

export const EVENT_CATEGORIES = ["social", "academic", "career", "sports", "arts"] as const satisfies readonly EventCategory[];

const isFutureLocalDateTime = (date: string, time: string) => {
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, "Event title must be at least 3 characters."),
    description: z
      .string()
      .trim()
      .min(10, "Event description must be at least 10 characters."),
    category: z.enum(EVENT_CATEGORIES),
    date: z.string().min(1, "Event date is required."),
    time: z.string().min(1, "Event time is required."),
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
    if (values.date && values.time && !isFutureLocalDateTime(values.date, values.time)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Event date and time must be in the future.",
        path: ["date"],
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

