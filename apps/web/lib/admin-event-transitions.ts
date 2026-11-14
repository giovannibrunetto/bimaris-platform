/**
 * Allowed transitions in the administrative event review flow.
 * These predicates must be applied in the UPDATE itself to avoid stale actions.
 * An approved event remains unpublished until an explicit publish request.
 */
export type AdminEventAction = "approve" | "reject" | "publish";
export type EventVerificationStatus = "pending" | "verified" | "rejected";

export function eventTransition(action: string) {
  switch (action) {
    case "approve":
      return {
        update: { verification_status: "verified" as EventVerificationStatus, published: false },
        expectedStatus: "pending" as EventVerificationStatus,
        expectedPublished: false,
        successStatus: "approved",
      };
    case "reject":
      return {
        update: { verification_status: "rejected" as EventVerificationStatus, published: false },
        expectedStatus: "pending" as EventVerificationStatus,
        expectedPublished: false,
        successStatus: "rejected",
      };
    case "publish":
      return {
        update: { published: true },
        expectedStatus: "verified" as EventVerificationStatus,
        expectedPublished: false,
        successStatus: "published",
      };
    default:
      return null;
  }
}
