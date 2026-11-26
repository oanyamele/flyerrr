/**
 * Resume Builder data (F2.3, #20).
 * Each signed-in user's resume is saved in this browser under one key, and the
 * Campus Involvement section is built from that user's real attendance records.
 */
import type { AttendanceRecord } from "@/data/attendanceStore";
import { DataAccessError } from "@/data/repository";

export interface ResumeData {
  university: string;
  major: string;
  minor: string;
  gpa: string;
  graduationYear: string;
  experience: string;
  skills: string;
}

/** Follows the flyerrr_<name>_v<version> convention from F5.4 (#28). */
export const RESUME_STORAGE_KEY = "flyerrr_resume_v1";

export const emptyResume = (): ResumeData => ({
  university: "",
  major: "",
  minor: "",
  gpa: "",
  graduationYear: "",
  experience: "",
  skills: "",
});

const FIELDS = Object.keys(emptyResume()) as (keyof ResumeData)[];

const isResume = (value: unknown): value is ResumeData =>
  !!value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  FIELDS.every((field) => typeof (value as Record<string, unknown>)[field] === "string");

/** Reads every saved resume. Unreadable data is an error, never silently replaced. */
const readAll = (): Record<string, ResumeData> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(localStorage.getItem(RESUME_STORAGE_KEY) ?? "{}");
  } catch {
    throw new DataAccessError("We couldn't load your resume.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !Object.values(parsed).every(isResume)) {
    throw new DataAccessError("We couldn't load your resume.");
  }
  return parsed as Record<string, ResumeData>;
};

export const loadResume = async (userId: string | null): Promise<ResumeData> => {
  if (!userId) return emptyResume();
  return readAll()[userId] ?? emptyResume();
};

/** Saves one user's resume. A failed write rejects, so the UI never reports a false save. */
export const saveResume = async (userId: string | null, resume: ResumeData): Promise<void> => {
  if (!userId) throw new Error("Sign in to save your resume.");
  const trimmed = Object.fromEntries(FIELDS.map((field) => [field, resume[field].trim()])) as unknown as ResumeData;
  localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify({ ...readAll(), [userId]: trimmed }));
};

/** One line per attended event, newest first, e.g. "24-Hour Hackathon · CS Society, Sep 2025". */
export const buildCampusInvolvement = (records: AttendanceRecord[]): string[] => {
  const seen = new Set<string>();
  return [...records]
    .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
    .filter((record) => !seen.has(record.eventId) && seen.add(record.eventId))
    .map((record) => {
      const when = new Date(record.checkedInAt).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      return `${record.eventTitle} · ${record.orgName}, ${when}`;
    });
};
