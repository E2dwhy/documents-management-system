import { createClient } from "@/lib/supabase/client";
import { translateRpcError } from "@/lib/data/errors";
import { isSupabaseReachable } from "@/lib/offline/network";
import {
  enqueueScan,
  getOutboxItem,
  getOutboxItems,
  removeOutboxItem,
  updateOutboxItemStatus,
} from "@/lib/offline/outbox";
import type { DossierRow } from "@/lib/data/dossiers";
import type { OutboxItem } from "@/lib/offline/types";

export interface ScanInput {
  clientUuid: string;
  dossierId: string;
  dossierReference: string;
  dossierTitle: string;
  action: "scan" | "transfert";
  toServiceId: string | null;
  newStatus: "en_cours" | "valide" | "rejete" | null;
  note: string | null;
}

export type SubmitOutcome =
  | { outcome: "synced"; dossier: DossierRow }
  | { outcome: "queued" }
  | { outcome: "rejected"; message: string };

/**
 * Attempts the RPC for one outbox item. Distinguishes two very different
 * failure modes:
 *  - a network/transport failure (request never reached Supabase) — the
 *    item stays "pending" for a later retry, no error shown;
 *  - an RPC-level rejection (request reached Supabase and was refused,
 *    e.g. the dossier was closed by someone else in the meantime) — a real
 *    conflict, marked "error" and left visible for the user to resolve
 *    rather than silently dropped or endlessly retried.
 */
async function trySyncItem(item: OutboxItem): Promise<SubmitOutcome> {
  const supabase = createClient();

  let response;
  try {
    response = await supabase.rpc("register_scan", {
      p_dossier_id: item.dossierId,
      p_action: item.action,
      p_client_uuid: item.clientUuid,
      p_to_service_id: item.toServiceId,
      p_new_status: item.newStatus,
      p_note: item.note,
    });
  } catch {
    // Transport-level failure (offline, DNS, timeout…) — not a rejection.
    return { outcome: "queued" };
  }

  const { data, error } = response;

  if (error) {
    const message = translateRpcError(error.message);
    await updateOutboxItemStatus(item.clientUuid, "error", message);
    return { outcome: "rejected", message };
  }

  await removeOutboxItem(item.clientUuid);
  return { outcome: "synced", dossier: data };
}

/**
 * The single entry point the scan-confirmation UI calls. Always writes to
 * the outbox first (durability before anything else — the outbox pattern),
 * then makes one immediate attempt to sync just that item. Whether the
 * result is "we're offline" or "the server rejected it" or "it's done",
 * the caller gets a clear outcome to show the user.
 */
export async function submitOrQueueScan(input: ScanInput): Promise<SubmitOutcome> {
  const item: OutboxItem = {
    ...input,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  await enqueueScan(item);

  const reachable = await isSupabaseReachable();
  if (!reachable) {
    return { outcome: "queued" };
  }

  return trySyncItem(item);
}

export interface SyncSummary {
  synced: number;
  rejected: number;
  stillPending: number;
}

/**
 * Flushes the whole outbox, oldest first, stopping at the first network
 * failure (no point hammering a dead connection — the remaining items stay
 * pending for the next trigger). RPC rejections don't stop the batch —
 * each dossier's conflict is independent.
 */
export async function syncOutbox(): Promise<SyncSummary> {
  const summary: SyncSummary = { synced: 0, rejected: 0, stillPending: 0 };

  const reachable = await isSupabaseReachable();
  if (!reachable) {
    summary.stillPending = (await getOutboxItems()).length;
    return summary;
  }

  const items = await getOutboxItems();
  let networkFailed = false;

  for (const item of items) {
    // Skip items already marked "error" from a previous pass — they wait
    // for an explicit user retry (see retryOutboxItem), not automatic
    // re-attempts, so a persistent conflict doesn't spam the server. Once
    // a network failure hits, stop attempting the rest of the batch too
    // (no point hammering a dead connection) but still count them.
    if (networkFailed || item.status === "error") {
      summary.stillPending += 1;
      continue;
    }

    const result = await trySyncItem(item);
    if (result.outcome === "synced") {
      summary.synced += 1;
    } else if (result.outcome === "rejected") {
      summary.rejected += 1;
    } else {
      networkFailed = true;
      summary.stillPending += 1;
    }
  }

  return summary;
}

/** User-triggered retry for one item stuck in "error" status. */
export async function retryOutboxItem(clientUuid: string): Promise<SubmitOutcome | null> {
  const item = await getOutboxItem(clientUuid);
  if (!item) return null;
  await updateOutboxItemStatus(clientUuid, "pending");
  return trySyncItem({ ...item, status: "pending" });
}

export async function discardOutboxItem(clientUuid: string): Promise<void> {
  await removeOutboxItem(clientUuid);
}
