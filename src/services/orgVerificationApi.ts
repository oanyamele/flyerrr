import { apiRequest } from "@/services/httpApi";

/**
 * Client for the server's organization verification queue. The server decides who may review
 * (an officer who does not lead the organization) and records every decision, so nothing here
 * can approve an organization by editing the page.
 */
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationItem {
  /** The organization's id. */
  id: string;
  orgName: string;
  handle: string;
  submittedBy: string;
  schoolEmail: string;
  submittedAt: string;
  status: VerificationStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  /** False when the signed-in officer leads this organization and so cannot review it. */
  canDecide: boolean;
}

export const verificationQueueKey = ["organization-verifications"] as const;

/** Officer: every organization with its review status, pending ones first. */
export const fetchVerificationQueue = () => apiRequest<VerificationItem[]>("/organization-verifications");

/** Officer: approve or reject an organization. Approving makes the organization show as verified. */
export const decideVerification = (organizationId: string, decision: "approved" | "rejected") =>
  apiRequest<VerificationItem>(`/organizations/${encodeURIComponent(organizationId)}/verification`, {
    method: "PUT", body: JSON.stringify({ decision }),
  });
