"use client";

import type {
  EditorialV2DraftAutosaveStatus,
  EditorialV2DraftHydrationStatus,
} from "../../lib/editorial-v2/draft-contracts";
import styles from "./DraftAutosaveStatus.module.css";

interface DraftAutosaveStatusProps {
  readonly status: EditorialV2DraftAutosaveStatus;
  readonly draftRevision: number | null;
  readonly draftHash: string | null;
  readonly lastSavedAt: string | null;
  readonly hydrationStatus: EditorialV2DraftHydrationStatus | "not_loaded" | "loading";
  readonly conflictMessage: string | null;
  readonly errorMessage: string | null;
  readonly canSaveNow: boolean;
  readonly canReload: boolean;
  readonly canStartFromApproved: boolean;
  readonly onSaveNow: () => void;
  readonly onReload: () => void;
  readonly onStartFromApproved: () => void;
}

const LABELS: Readonly<Record<EditorialV2DraftAutosaveStatus, string>> = {
  disabled: "Disabled",
  no_project: "No project",
  loading: "Loading",
  hydrating: "Hydrating",
  clean: "Clean",
  unsaved_changes: "Unsaved changes",
  saving: "Saving",
  saved: "Saved",
  conflict: "Conflict",
  corrupted: "Corrupted",
  error: "Error",
};

export default function DraftAutosaveStatus({
  status,
  draftRevision,
  draftHash,
  lastSavedAt,
  hydrationStatus,
  conflictMessage,
  errorMessage,
  canSaveNow,
  canReload,
  canStartFromApproved,
  onSaveNow,
  onReload,
  onStartFromApproved,
}: DraftAutosaveStatusProps) {
  return (
    <section className={styles.panel} aria-labelledby="draft-autosave-status-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Production Activation PA-2 · Local full draft</p><h2 id="draft-autosave-status-title">Draft Autosave</h2></div>
        <strong className={styles.badge} data-state={status}>{LABELS[status]}</strong>
      </header>
      <div className={styles.warning}>
        <strong>Approved checkpoint와 편집 draft는 별도 권위입니다.</strong>
        <span>Draft Resume ≠ Approval Resume · hydration은 canonical approval을 만들지 않습니다.</span>
        <span>로컬 장치의 암호화되지 않은 JSON입니다. secret/API key를 입력하거나 저장하지 마세요.</span>
        <span>Cloud backup이 아니며 외부 전송·동기화를 수행하지 않습니다.</span>
      </div>
      <dl className={styles.summary}>
        <div><dt>Status</dt><dd>{LABELS[status]}</dd></div>
        <div><dt>Draft revision</dt><dd>{draftRevision ?? "none"}</dd></div>
        <div><dt>Integrity</dt><dd>{draftHash ? `${draftHash.slice(0, 12)}…` : "none"}</dd></div>
        <div><dt>Last saved</dt><dd>{lastSavedAt ?? "never"}</dd></div>
        <div><dt>Hydration</dt><dd>{hydrationStatus}</dd></div>
        <div><dt>Storage</dt><dd>local-only · unencrypted</dd></div>
      </dl>
      {conflictMessage && <p role="alert" className={styles.alert}>Conflict · {conflictMessage} · autosave paused · automatic merge/overwrite 없음</p>}
      {errorMessage && <p role="alert" className={styles.alert}>Error · {errorMessage}</p>}
      <div className={styles.actions}>
        <button type="button" disabled={!canSaveNow} onClick={onSaveNow}>Save Draft Now</button>
        <button type="button" disabled={!canReload} onClick={onReload}>Reload Saved Draft</button>
        <button type="button" disabled={!canStartFromApproved} onClick={onStartFromApproved}>Start From Approved Checkpoint</button>
      </div>
      <small>Force Overwrite Conflict · Hard Delete Draft · filesystem picker는 제공하지 않습니다.</small>
    </section>
  );
}
