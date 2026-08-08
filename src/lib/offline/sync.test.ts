import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DossierRow } from "@/lib/data/dossiers";

// --- mocks -------------------------------------------------------------
// Controlled per-test via `rpcMock.mockImplementation(...)` /
// `reachableMock.mockResolvedValue(...)`.
const rpcMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: rpcMock }),
}));

const reachableMock = vi.fn();
vi.mock("@/lib/offline/network", () => ({
  isSupabaseReachable: () => reachableMock(),
  isOnline: () => true,
}));

// Imported *after* the mocks above so the module under test picks them up.
const { submitOrQueueScan, syncOutbox, retryOutboxItem } = await import("./sync");
const { getOutboxItems, getOutboxItem, removeOutboxItem, enqueueScan } = await import("./outbox");

function makeDossierRow(overrides: Partial<DossierRow> = {}): DossierRow {
  return {
    id: crypto.randomUUID(),
    reference: "DOS-2026-00042",
    qr_token: crypto.randomUUID(),
    title: "Dossier test",
    owner_name: null,
    type_id: crypto.randomUUID(),
    current_service_id: crypto.randomUUID(),
    status: "en_cours",
    scan_count: 1,
    max_scans: 3,
    is_locked: false,
    created_by: null,
    closed_by: null,
    closed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function baseScanInput(overrides: Partial<Parameters<typeof submitOrQueueScan>[0]> = {}) {
  return {
    clientUuid: crypto.randomUUID(),
    dossierId: crypto.randomUUID(),
    dossierReference: "DOS-2026-00042",
    dossierTitle: "Dossier test",
    action: "scan" as const,
    toServiceId: null,
    newStatus: "valide" as const,
    note: null,
    ...overrides,
  };
}

async function clearOutbox() {
  const items = await getOutboxItems();
  await Promise.all(items.map((i) => removeOutboxItem(i.clientUuid)));
}

beforeEach(async () => {
  await clearOutbox();
  rpcMock.mockReset();
  reachableMock.mockReset();
});

describe("submitOrQueueScan", () => {
  it("removes the outbox item and returns 'synced' on success", async () => {
    reachableMock.mockResolvedValue(true);
    rpcMock.mockResolvedValue({ data: makeDossierRow({ scan_count: 2 }), error: null });

    const input = baseScanInput();
    const result = await submitOrQueueScan(input);

    expect(result.outcome).toBe("synced");
    expect(await getOutboxItem(input.clientUuid)).toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith(
      "register_scan",
      expect.objectContaining({ p_dossier_id: input.dossierId, p_client_uuid: input.clientUuid }),
    );
  });

  it("leaves the item pending and returns 'queued' when unreachable (offline)", async () => {
    reachableMock.mockResolvedValue(false);

    const input = baseScanInput();
    const result = await submitOrQueueScan(input);

    expect(result.outcome).toBe("queued");
    expect(rpcMock).not.toHaveBeenCalled();
    const stored = await getOutboxItem(input.clientUuid);
    expect(stored?.status).toBe("pending");
  });

  it("marks the item 'error' and returns 'rejected' on an RPC-level conflict (e.g. dossier closed)", async () => {
    reachableMock.mockResolvedValue(true);
    rpcMock.mockResolvedValue({ data: null, error: { message: "DOSSIER_LOCKED: dossier is closed" } });

    const input = baseScanInput();
    const result = await submitOrQueueScan(input);

    expect(result.outcome).toBe("rejected");
    if (result.outcome === "rejected") {
      expect(result.message).toMatch(/clôturé/i);
    }
    const stored = await getOutboxItem(input.clientUuid);
    expect(stored?.status).toBe("error");
  });

  it("leaves the item pending (not 'error') when the RPC call itself throws (network failure)", async () => {
    reachableMock.mockResolvedValue(true); // reachability check passed, but the actual call still fails
    rpcMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const input = baseScanInput();
    const result = await submitOrQueueScan(input);

    expect(result.outcome).toBe("queued");
    const stored = await getOutboxItem(input.clientUuid);
    expect(stored?.status).toBe("pending");
  });

  it("replaying the exact same clientUuid never double-enqueues (idempotency at the queue level)", async () => {
    reachableMock.mockResolvedValue(false);
    const input = baseScanInput();

    await submitOrQueueScan(input);
    await submitOrQueueScan(input);

    const items = await getOutboxItems();
    expect(items.filter((i) => i.clientUuid === input.clientUuid)).toHaveLength(1);
  });
});

describe("syncOutbox", () => {
  it("syncs multiple pending items oldest-first and reports the summary", async () => {
    reachableMock.mockResolvedValue(true);
    rpcMock.mockResolvedValue({ data: makeDossierRow(), error: null });

    await enqueueScan({ ...baseScanInput(), createdAt: "2026-01-01T00:00:00.000Z", status: "pending" });
    await enqueueScan({ ...baseScanInput(), createdAt: "2026-01-02T00:00:00.000Z", status: "pending" });

    const summary = await syncOutbox();

    expect(summary).toEqual({ synced: 2, rejected: 0, stillPending: 0 });
    expect(await getOutboxItems()).toHaveLength(0);
  });

  it("stops attempting further items after a network failure, counting the rest as still pending", async () => {
    reachableMock.mockResolvedValue(true);
    rpcMock
      .mockResolvedValueOnce({ data: makeDossierRow(), error: null }) // item 1 succeeds
      .mockRejectedValueOnce(new TypeError("Failed to fetch")); // item 2 fails at the network level

    await enqueueScan({ ...baseScanInput(), createdAt: "2026-01-01T00:00:00.000Z", status: "pending" });
    await enqueueScan({ ...baseScanInput(), createdAt: "2026-01-02T00:00:00.000Z", status: "pending" });
    await enqueueScan({ ...baseScanInput(), createdAt: "2026-01-03T00:00:00.000Z", status: "pending" });

    const summary = await syncOutbox();

    expect(summary.synced).toBe(1);
    expect(summary.stillPending).toBe(2); // the one that network-failed + the untried third
    expect(rpcMock).toHaveBeenCalledTimes(2); // never even attempted the third
  });

  it("does not automatically retry items already marked 'error' — they wait for an explicit retry", async () => {
    reachableMock.mockResolvedValue(true);

    await enqueueScan({
      ...baseScanInput(),
      createdAt: new Date().toISOString(),
      status: "error",
      errorMessage: "Conflit précédent",
    });

    const summary = await syncOutbox();

    expect(rpcMock).not.toHaveBeenCalled();
    expect(summary).toEqual({ synced: 0, rejected: 0, stillPending: 1 });
  });

  it("reports everything as stillPending without calling the RPC when unreachable", async () => {
    reachableMock.mockResolvedValue(false);
    await enqueueScan({ ...baseScanInput(), createdAt: new Date().toISOString(), status: "pending" });

    const summary = await syncOutbox();

    expect(rpcMock).not.toHaveBeenCalled();
    expect(summary).toEqual({ synced: 0, rejected: 0, stillPending: 1 });
  });
});

describe("retryOutboxItem", () => {
  it("re-attempts a previously-'error' item and removes it on success", async () => {
    reachableMock.mockResolvedValue(true);
    const input = baseScanInput();
    await enqueueScan({ ...input, createdAt: new Date().toISOString(), status: "error", errorMessage: "old" });

    rpcMock.mockResolvedValue({ data: makeDossierRow(), error: null });
    const result = await retryOutboxItem(input.clientUuid);

    expect(result?.outcome).toBe("synced");
    expect(await getOutboxItem(input.clientUuid)).toBeUndefined();
  });

  it("returns null for an item that no longer exists", async () => {
    const result = await retryOutboxItem(crypto.randomUUID());
    expect(result).toBeNull();
  });
});
