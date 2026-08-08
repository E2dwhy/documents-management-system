import { describe, it, expect, beforeEach } from "vitest";
import {
  enqueueScan,
  getOutboxItems,
  getOutboxItem,
  getOutboxCount,
  updateOutboxItemStatus,
  removeOutboxItem,
} from "./outbox";
import type { OutboxItem } from "./types";

function makeItem(overrides: Partial<OutboxItem> = {}): OutboxItem {
  return {
    clientUuid: crypto.randomUUID(),
    dossierId: crypto.randomUUID(),
    dossierReference: "DOS-2026-00001",
    dossierTitle: "Test dossier",
    action: "scan",
    toServiceId: null,
    newStatus: "valide",
    note: null,
    createdAt: new Date().toISOString(),
    status: "pending",
    ...overrides,
  };
}

async function clearOutbox() {
  const items = await getOutboxItems();
  await Promise.all(items.map((i) => removeOutboxItem(i.clientUuid)));
}

describe("offline outbox", () => {
  beforeEach(async () => {
    await clearOutbox();
  });

  it("enqueues and retrieves an item by id", async () => {
    const item = makeItem();
    await enqueueScan(item);

    const fetched = await getOutboxItem(item.clientUuid);
    expect(fetched).toEqual(item);
  });

  it("counts items correctly", async () => {
    expect(await getOutboxCount()).toBe(0);
    await enqueueScan(makeItem());
    await enqueueScan(makeItem());
    expect(await getOutboxCount()).toBe(2);
  });

  it("orders items oldest-first by createdAt", async () => {
    const older = makeItem({ createdAt: "2026-01-01T00:00:00.000Z", dossierReference: "DOS-2026-OLD" });
    const newer = makeItem({ createdAt: "2026-06-01T00:00:00.000Z", dossierReference: "DOS-2026-NEW" });
    // insert newer first, to prove ordering comes from the index, not insertion order
    await enqueueScan(newer);
    await enqueueScan(older);

    const items = await getOutboxItems();
    expect(items.map((i) => i.dossierReference)).toEqual(["DOS-2026-OLD", "DOS-2026-NEW"]);
  });

  it("updates status and error message, and clears errorMessage on success", async () => {
    const item = makeItem();
    await enqueueScan(item);

    await updateOutboxItemStatus(item.clientUuid, "error", "Conflit de test");
    let fetched = await getOutboxItem(item.clientUuid);
    expect(fetched?.status).toBe("error");
    expect(fetched?.errorMessage).toBe("Conflit de test");

    await updateOutboxItemStatus(item.clientUuid, "pending");
    fetched = await getOutboxItem(item.clientUuid);
    expect(fetched?.status).toBe("pending");
    expect(fetched?.errorMessage).toBeUndefined();
  });

  it("removes an item", async () => {
    const item = makeItem();
    await enqueueScan(item);
    await removeOutboxItem(item.clientUuid);

    expect(await getOutboxItem(item.clientUuid)).toBeUndefined();
    expect(await getOutboxCount()).toBe(0);
  });

  it("put is idempotent on the same clientUuid (no duplicate rows)", async () => {
    const item = makeItem();
    await enqueueScan(item);
    await enqueueScan({ ...item, note: "updated note" });

    expect(await getOutboxCount()).toBe(1);
    const fetched = await getOutboxItem(item.clientUuid);
    expect(fetched?.note).toBe("updated note");
  });
});
