export type DemoRole = "admin" | "engineer";

/** Whitelist of approver identities. Matches sql/03 backfill + JKH (Job). */
export const APPROVERS = ["PPI", "CCH", "LRO", "SPE", "JKH"] as const;
export type ApproverCode = (typeof APPROVERS)[number];
export const DEFAULT_APPROVER: ApproverCode = "PPI";
