import { getOfflineDb } from "@/lib/offline/db";
import type { OutboxItem, OutboxStatus } from "@/lib/offline/types";

/** Fired after any outbox mutation so `useOutbox` (TanStack Query) knows to
 * refetch — IndexedDB has no built-in React reactivity. */
const OUTBOX_CHANGED_EVENT = "dms:outbox-changed";

function notifyOutboxChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OUTBOX_CHANGED_EVENT));
  }
}

export function onOutboxChanged(handler: () => void): () => void {
  window.addEventListener(OUTBOX_CHANGED_EVENT, handler);
  return () => window.removeEventListener(OUTBOX_CHANGED_EVENT, handler);
}

export async function enqueueScan(item: OutboxItem): Promise<void> {
  const db = await getOfflineDb();
  await db.put("outbox", item);
  notifyOutboxChanged();
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  const db = await getOfflineDb();
  // getAll() + sort rather than getAllFromIndex("by-createdAt"): an index
  // silently omits any record missing the indexed field instead of
  // erroring, which would make a malformed row vanish from every listing
  // (including the sync loop) without a trace. A full scan + explicit
  // sort can't hide that failure mode, and the outbox is small enough
  // (per-device pending scans) that this costs nothing in practice.
  const items = await db.getAll("outbox");
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // oldest (first scanned) synced first
}

export async function getOutboxItem(clientUuid: string): Promise<OutboxItem | undefined> {
  const db = await getOfflineDb();
  return db.get("outbox", clientUuid);
}

export async function getOutboxCount(): Promise<number> {
  const db = await getOfflineDb();
  return db.count("outbox");
}

export async function updateOutboxItemStatus(
  clientUuid: string,
  status: OutboxStatus,
  errorMessage?: string,
): Promise<void> {
  const db = await getOfflineDb();
  const item = await db.get("outbox", clientUuid);
  if (!item) return;
  item.status = status;
  item.errorMessage = errorMessage;
  await db.put("outbox", item);
  notifyOutboxChanged();
}

export async function removeOutboxItem(clientUuid: string): Promise<void> {
  const db = await getOfflineDb();
  await db.delete("outbox", clientUuid);
  notifyOutboxChanged();
}
