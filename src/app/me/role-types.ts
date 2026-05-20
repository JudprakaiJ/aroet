export type DemoRole = "admin" | "engineer";
export const ROLE_COOKIE = "aroet_role";
export const ACTING_AS_COOKIE = "aroet_acting_as";

/** Whitelist of demo approver identities. Matches sql/03 backfill + JKH (Job). */
export const APPROVERS = ["PPI", "CCH", "LRO", "SPE", "JKH"] as const;
export type ApproverCode = (typeof APPROVERS)[number];
export const DEFAULT_APPROVER: ApproverCode = "PPI";
