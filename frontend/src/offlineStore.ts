export type DraftState = 'draft' | 'pending' | 'conflict';

export interface ClinicalDraft {
  id: string;
  beneficiaryId: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  state: DraftState;
  updatedAt: string;
  idempotencyKey: string;
}

const DATABASE_NAME = 'medvault-offline';
const DATABASE_VERSION = 1;
const STORE_NAME = 'clinical-drafts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open offline storage'));
  });
}

export async function saveClinicalDraft(draft: ClinicalDraft): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(draft);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save draft'));
  });
  database.close();
}

export async function getClinicalDraft(id: string): Promise<ClinicalDraft | undefined> {
  const database = await openDatabase();
  const draft = await new Promise<ClinicalDraft | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as ClinicalDraft | undefined);
    request.onerror = () => reject(request.error ?? new Error('Unable to read draft'));
  });
  database.close();
  return draft;
}

export async function deleteClinicalDraft(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to delete draft'));
  });
  database.close();
}

export async function listPendingClinicalDrafts(): Promise<ClinicalDraft[]> {
  const database = await openDatabase();
  const drafts = await new Promise<ClinicalDraft[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as ClinicalDraft[]).filter((draft) => draft.state === 'pending'));
    request.onerror = () => reject(request.error ?? new Error('Unable to list pending drafts'));
  });
  database.close();
  return drafts;
}

export async function syncPendingClinicalDrafts(
  submit: (draft: ClinicalDraft) => Promise<void>,
): Promise<{ synced: number; conflicts: number }> {
  const pendingDrafts = await listPendingClinicalDrafts();
  let synced = 0;
  let conflicts = 0;

  for (const draft of pendingDrafts) {
    try {
      await submit(draft);
      await deleteClinicalDraft(draft.id);
      synced += 1;
    } catch (error: any) {
      if (error?.status === 409) {
        await saveClinicalDraft({ ...draft, state: 'conflict' });
        conflicts += 1;
      }
    }
  }

  return { synced, conflicts };
}
