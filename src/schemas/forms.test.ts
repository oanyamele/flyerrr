import { describe, expect, it } from "vitest";

import { authFormSchema, eventFormSchema } from "@/schemas/forms";

const localDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const validEvent = () => ({
  title: "Career Fair",
  description: "Meet employers and explore internship opportunities.",
  category: "career" as const,
  date: localDate(new Date(Date.now() + 48 * 60 * 60 * 1000)),
  time: "12:00",
  location: "Blackburn Ballroom",
  capacity: "200",
  tags: "career, internships",
});

describe("authFormSchema", () => {
  it("requires a Howard email for sign in", () => {
    const result = authFormSchema("signin").safeParse({
      name: "",
      email: "student@gmail.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Use your @howard.edu email address.");
  });

  it("enforces password strength when an account is created", () => {
    const result = authFormSchema("signup").safeParse({
      name: "Brian Too",
      email: "brian@howard.edu",
      password: "password123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "password")).toBe(true);
  });

  it("does not retroactively reject an existing account during sign in", () => {
    const result = authFormSchema("signin").safeParse({
      name: "",
      email: "student@howard.edu",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });
});

describe("eventFormSchema", () => {
  it("accepts a complete future event", () => {
    expect(eventFormSchema.safeParse(validEvent()).success).toBe(true);
  });

  it("rejects an event in the past", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent(),
      date: localDate(new Date(Date.now() - 48 * 60 * 60 * 1000)),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["date"],
        message: "Event date and time must be in the future.",
      }),
    );
  });

  it("rejects an invalid capacity", () => {
    const result = eventFormSchema.safeParse({ ...validEvent(), capacity: "0" });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ["capacity"], message: "Capacity must be at least 1." }),
    );
  });
});
