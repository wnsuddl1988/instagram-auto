"use client";

import { useEffect, useMemo, useReducer, useState } from "react";

import type {
  ApprovedDetailedScriptSessionSnapshot,
  ApprovedTrendBriefSessionSnapshot,
  DetailedScriptPackage,
  DetailedScriptValidationIssue,
  DetailedScriptValidationSummary,
  FieldRepairPackage,
  ImportIssue,
  PromptPackage,
  SelectedAngleDraft,
  TopicCandidate,
} from "../../lib/editorial-v2/contracts";
import { buildEvidencePackDraft, validateEvidencePackDraft } from "../../lib/editorial-v2/evidence-pack";
import {
  createInitialEditorialIntelligenceSession,
  reduceEditorialIntelligenceSession,
} from "../../lib/editorial-v2/intelligence-session";
import { parseFieldRepairPackage } from "../../lib/editorial-v2/import-repair";
import { hashNormalizedImport, isDuplicateImportHash, sha256Utf8 } from "../../lib/editorial-v2/import-session";
import { cloneApprovedDetailedScriptSnapshot } from "../../lib/editorial-v2/planning-session";
import {
  applyDetailedScriptRepairs,
  buildDetailedScriptRepairPrompt,
  canApproveDetailedScript,
  getDetailedScriptRepairAllowedPaths,
  normalizeDetailedScriptResponse,
  readDetailedScriptPackage,
  validateDetailedScriptPackage,
} from "../../lib/editorial-v2/script-import";
import { buildDetailedScriptPrompt } from "../../lib/editorial-v2/script-prompt";
import {
  canApproveSelectedAngle,
  createSelectedAngleDraft,
  validateSelectedAngleDraft,
} from "../../lib/editorial-v2/selected-angle";
import { generateTopicCandidates } from "../../lib/editorial-v2/topic-candidates";
import { rankTopicCandidates, topicEvaluationWeightsTotal } from "../../lib/editorial-v2/topic-evaluation";
import styles from "./EditorialIntelligenceWorkbench.module.css";

interface EditorialIntelligenceWorkbenchProps {
  readonly approvedSnapshot: ApprovedTrendBriefSessionSnapshot;
  readonly onApprovedScriptChange?: (snapshot: ApprovedDetailedScriptSessionSnapshot | null) => void;
}

type CopyState = "idle" | "copied" | "failed";

function normalizationIssues(issues: readonly ImportIssue[]): readonly DetailedScriptValidationIssue[] {
  return issues.map((entry) => ({ ...entry }));
}

function mergeValidation(
  summary: DetailedScriptValidationSummary,
  extraIssues: readonly DetailedScriptValidationIssue[],
): DetailedScriptValidationSummary {
  const issues = [...extraIssues, ...summary.issues];
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    ...summary,
    issues,
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
  };
}

export default function EditorialIntelligenceWorkbench({
  approvedSnapshot,
  onApprovedScriptChange,
}: EditorialIntelligenceWorkbenchProps) {
  const [session, dispatch] = useReducer(
    reduceEditorialIntelligenceSession,
    approvedSnapshot,
    createInitialEditorialIntelligenceSession,
  );
  const [promptCopyState, setPromptCopyState] = useState<CopyState>("idle");
  const [repairCopyState, setRepairCopyState] = useState<CopyState>("idle");
  const [normalizationMethod, setNormalizationMethod] = useState("not_imported");
  const [scriptRawHash, setScriptRawHash] = useState("");
  const [scriptNormalizedHash, setScriptNormalizedHash] = useState("");
  const [rawImportHashes, setRawImportHashes] = useState<readonly string[]>([]);
  const [repairPrompt, setRepairPrompt] = useState<PromptPackage | null>(null);
  const [repairPackage, setRepairPackage] = useState<FieldRepairPackage | null>(null);
  const [repairIssues, setRepairIssues] = useState<readonly ImportIssue[]>([]);

  const selectedAngleSummary = useMemo(
    () => session.selectedAngle && session.evidencePack
      ? validateSelectedAngleDraft(session.selectedAngle, session.evidencePack)
      : null,
    [session.selectedAngle, session.evidencePack],
  );
  const selectedEvaluation = session.selectedAngle
    ? session.topicEvaluations.find((entry) => entry.candidateId === session.selectedAngle?.candidateId) ?? null
    : null;
  const scriptRepairPaths = getDetailedScriptRepairAllowedPaths(session.scriptValidation);

  useEffect(() => () => onApprovedScriptChange?.(null), [onApprovedScriptChange]);

  function invalidateApprovedScript(): void {
    onApprovedScriptChange?.(null);
  }

  function clearScriptImportUi(): void {
    invalidateApprovedScript();
    setNormalizationMethod("not_imported");
    setScriptRawHash("");
    setScriptNormalizedHash("");
    setRepairPrompt(null);
    setRepairPackage(null);
    setRepairIssues([]);
    setPromptCopyState("idle");
    setRepairCopyState("idle");
  }

  async function copyText(text: string, setter: (state: CopyState) => void): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setter("copied");
    } catch {
      setter("failed");
    }
  }

  function buildEvidence(): void {
    const evidencePack = buildEvidencePackDraft(approvedSnapshot);
    const review = validateEvidencePackDraft(evidencePack, approvedSnapshot.normalizedHash);
    dispatch({ type: "evidence_changed", evidencePack, review });
    clearScriptImportUi();
  }

  function approveEvidence(): void {
    if (!session.evidencePack || session.evidenceReview.blockingIssues.length > 0) return;
    dispatch({
      type: "evidence_review_changed",
      review: { ...session.evidenceReview, status: "approved" },
    });
    clearScriptImportUi();
  }

  function cancelEvidenceApproval(): void {
    dispatch({
      type: "evidence_review_changed",
      review: { ...session.evidenceReview, status: "not_reviewed" },
    });
    clearScriptImportUi();
  }

  function generateCandidates(): void {
    if (!session.evidencePack || session.evidenceReview.status !== "approved") return;
    const candidates = generateTopicCandidates(session.evidencePack);
    const evaluations = rankTopicCandidates(candidates, session.evidencePack);
    dispatch({ type: "candidates_regenerated", candidates, evaluations });
    clearScriptImportUi();
  }

  function selectCandidate(candidate: TopicCandidate): void {
    dispatch({ type: "selected_candidate_changed", selectedAngle: createSelectedAngleDraft(candidate) });
    clearScriptImportUi();
  }

  function updateSelectedAngle(field: "workingTitle" | "hookPromise" | "angleStatement" | "viewerQuestion", value: string): void {
    if (!session.selectedAngle) return;
    const selectedAngle: SelectedAngleDraft = { ...session.selectedAngle, [field]: value };
    dispatch({ type: "selected_angle_text_changed", selectedAngle });
    clearScriptImportUi();
  }

  function approveSelectedAngle(): void {
    if (!canApproveSelectedAngle(selectedAngleSummary) || selectedEvaluation?.blockingIssues.length) return;
    dispatch({ type: "selected_angle_approved" });
  }

  function generateScriptPrompt(): void {
    if (!session.selectedAngle || !selectedAngleSummary || !session.evidencePack || session.selectedAngleApproval !== "approved") return;
    dispatch({
      type: "script_prompt_generated",
      prompt: buildDetailedScriptPrompt({
        projectId: approvedSnapshot.expectedInput.projectId,
        selectedAngle: session.selectedAngle,
        selectedAngleValidation: selectedAngleSummary,
        evidencePack: session.evidencePack,
        audience: approvedSnapshot.expectedInput.audience,
        durationSeconds: approvedSnapshot.expectedInput.targetDurationSeconds,
      }),
    });
    clearScriptImportUi();
  }

  function updateScriptRaw(rawText: string): void {
    invalidateApprovedScript();
    dispatch({ type: "script_raw_changed", rawText });
    setNormalizationMethod("not_imported");
    setScriptRawHash("");
    setScriptNormalizedHash("");
    setRepairPrompt(null);
    setRepairPackage(null);
    setRepairIssues([]);
  }

  async function previewScriptImport(): Promise<void> {
    if (!session.evidencePack || !session.selectedAngle) return;
    invalidateApprovedScript();
    const normalized = normalizeDetailedScriptResponse(session.scriptRawText);
    const rawHash = await sha256Utf8(session.scriptRawText);
    const duplicate = isDuplicateImportHash(rawHash, rawImportHashes);
    const baseSummary = validateDetailedScriptPackage(normalized.value, {
      selectedAngle: session.selectedAngle,
      evidencePack: session.evidencePack,
      audience: approvedSnapshot.expectedInput.audience,
      durationSeconds: approvedSnapshot.expectedInput.targetDurationSeconds,
    });
    const duplicateWarning: DetailedScriptValidationIssue[] = duplicate
      ? [{ code: "duplicate_session_script_import", severity: "warning", blocking: false, fieldPath: "", message: "현재 세션에서 같은 script raw response를 이미 검토했습니다.", repairable: false }]
      : [];
    const summary = mergeValidation(baseSummary, [...normalizationIssues(normalized.issues), ...duplicateWarning]);
    setNormalizationMethod(normalized.method);
    setScriptRawHash(rawHash);
    setScriptNormalizedHash(normalized.value === null ? "" : await hashNormalizedImport(normalized.value));
    if (!duplicate) setRawImportHashes((previous) => [...previous, rawHash]);
    dispatch({
      type: "script_preview_changed",
      scriptPackage: readDetailedScriptPackage(normalized.value),
      validation: summary,
    });
  }

  function generateRepairPrompt(): void {
    if (!session.scriptValidation || scriptRepairPaths.length === 0) return;
    setRepairPrompt(buildDetailedScriptRepairPrompt({
      projectId: approvedSnapshot.expectedInput.projectId,
      rawText: session.scriptRawText,
      summary: session.scriptValidation,
      allowedPaths: scriptRepairPaths,
      researchCutoffDate: approvedSnapshot.expectedInput.researchCutoffDate,
    }));
    setRepairCopyState("idle");
  }

  function previewRepair(): void {
    const parsed = parseFieldRepairPackage(session.scriptRepairText);
    setRepairPackage(parsed.package);
    setRepairIssues(parsed.issues);
  }

  function applyRepair(): void {
    if (!repairPackage || !session.scriptPackage || !session.evidencePack || !session.selectedAngle) return;
    invalidateApprovedScript();
    const applied = applyDetailedScriptRepairs(session.scriptPackage, repairPackage, scriptRepairPaths);
    const summary = mergeValidation(validateDetailedScriptPackage(applied.value, {
      selectedAngle: session.selectedAngle,
      evidencePack: session.evidencePack,
      audience: approvedSnapshot.expectedInput.audience,
      durationSeconds: approvedSnapshot.expectedInput.targetDurationSeconds,
    }), normalizationIssues(applied.issues));
    dispatch({
      type: "script_repair_applied",
      scriptPackage: readDetailedScriptPackage(applied.value),
      validation: summary,
    });
    setRepairIssues(applied.issues);
  }

  function reset(): void {
    invalidateApprovedScript();
    dispatch({ type: "reset" });
    setRawImportHashes([]);
    clearScriptImportUi();
  }

  function approveDetailedScript(): void {
    if (!session.scriptPackage || !session.scriptValidation || !session.evidencePack || !session.selectedAngle) return;
    if (!scriptRawHash || !scriptNormalizedHash || !canApproveDetailedScript(session.scriptValidation)) return;
    dispatch({ type: "script_approved" });
    onApprovedScriptChange?.(cloneApprovedDetailedScriptSnapshot({
      approvedScript: session.scriptPackage,
      evidencePack: session.evidencePack,
      selectedAngle: session.selectedAngle,
      scriptRawHash,
      scriptNormalizedHash,
      evidenceIdentity: session.evidencePack.provenance.normalizedHash,
      validation: session.scriptValidation,
      approvalState: "approved",
      audience: approvedSnapshot.expectedInput.audience,
      durationSeconds: approvedSnapshot.expectedInput.targetDurationSeconds,
    }));
  }

  function cancelDetailedScriptApproval(): void {
    dispatch({ type: "script_repair_response_changed", repairText: session.scriptRepairText });
    invalidateApprovedScript();
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Shorts Editorial OS V2 · Slice 3</p>
        <h1>Evidence · Topic · Detailed Script Intelligence</h1>
        <p>구조 검증과 사용자 세션 승인만 제공합니다. URL 존재·출처 진위는 검증하지 않으며 저장되지 않습니다.</p>
      </header>

      <section className={styles.step} aria-labelledby="intelligence-evidence">
        <h2 id="intelligence-evidence"><span>1</span> Evidence Pack</h2>
        <div className={styles.actions}><button type="button" onClick={buildEvidence}>Evidence Pack 생성</button><small>verification: structural-only</small></div>
        {session.evidencePack && <>
          <dl className={styles.meta}><div><dt>Raw hash</dt><dd>{session.evidencePack.provenance.rawHash}</dd></div><div><dt>Normalized hash</dt><dd>{session.evidencePack.provenance.normalizedHash}</dd></div><div><dt>Coverage</dt><dd>source {session.evidencePack.coverage.sourceCount} · claim {session.evidencePack.coverage.signalCount} · number {session.evidencePack.coverage.numberCount} · fresh {session.evidencePack.coverage.freshSourceCount}</dd></div></dl>
          <p className={styles.notice}>URL 존재·publisher 신뢰도·출처 진위는 확인하지 않았습니다. Evidence Gate PASS가 아닙니다.</p>
          <div className={styles.tableWrap}><table><thead><tr><th>Source</th><th>Publisher</th><th>Title</th><th>Freshness</th></tr></thead><tbody>{session.evidencePack.sources.map((source) => <tr key={source.sourceId}><td>{source.sourceId}</td><td>{source.publisher}</td><td>{source.title}</td><td>{source.freshness}</td></tr>)}</tbody></table></div>
          <ul className={styles.issues}>{session.evidenceReview.blockingIssues.map((entry) => <li key={entry} data-kind="error">차단 · {entry}</li>)}{session.evidenceReview.warnings.map((entry) => <li key={entry} data-kind="warning">경고 · {entry}</li>)}</ul>
          <div className={styles.actions}><button type="button" onClick={approveEvidence} disabled={session.evidenceReview.blockingIssues.length > 0 || session.evidenceReview.status === "approved"}>Evidence 확인</button><button type="button" className={styles.secondary} onClick={cancelEvidenceApproval} disabled={session.evidenceReview.status !== "approved"}>Evidence 확인 취소</button><strong>{session.evidenceReview.status === "approved" ? "사용자 확인 완료" : "확인 대기"}</strong></div>
        </>}
      </section>

      <section className={styles.step} aria-labelledby="intelligence-topics">
        <h2 id="intelligence-topics"><span>2</span> Topic Candidates</h2>
        <div className={styles.actions}><button type="button" onClick={generateCandidates} disabled={session.evidenceReview.status !== "approved"}>후보 생성·평가</button><small>가중치 합계 {topicEvaluationWeightsTotal()} · heuristic pre-score, quality gate PASS 아님</small></div>
        <div className={styles.cards}>{session.topicCandidates.map((candidate) => {
          const evaluation = session.topicEvaluations.find((entry) => entry.candidateId === candidate.candidateId);
          return <article key={candidate.candidateId} className={styles.card}><p className={styles.tag}>{candidate.angleType} · #{evaluation?.rank ?? "-"}</p><h3>{candidate.workingTitle}</h3><p>{candidate.hookPromise}</p><strong>Score {evaluation?.totalScore ?? 0}</strong><details><summary>점수 근거</summary>{evaluation?.scoreBreakdown.map((metric) => <p key={metric.name}>{metric.label} {metric.score}/100 × {metric.weight}% — {metric.reasons.join(", ")}</p>)}</details>{evaluation?.blockingIssues.map((entry) => <p key={entry} className={styles.error}>차단 · {entry}</p>)}<button type="button" onClick={() => selectCandidate(candidate)} disabled={Boolean(evaluation?.blockingIssues.length)}>이 후보 선택</button></article>;
        })}</div>
      </section>

      <section className={styles.step} aria-labelledby="intelligence-angle">
        <h2 id="intelligence-angle"><span>3</span> Selected Angle</h2>
        {!session.selectedAngle ? <p className={styles.muted}>차단 이슈가 없는 후보를 선택하세요.</p> : <>
          <div className={styles.formGrid}><label>Working title<input value={session.selectedAngle.workingTitle} onChange={(event) => updateSelectedAngle("workingTitle", event.target.value)} /></label><label>Hook promise<textarea value={session.selectedAngle.hookPromise} onChange={(event) => updateSelectedAngle("hookPromise", event.target.value)} /></label><label>Angle statement<textarea value={session.selectedAngle.angleStatement} onChange={(event) => updateSelectedAngle("angleStatement", event.target.value)} /></label><label>Viewer question<input value={session.selectedAngle.viewerQuestion} onChange={(event) => updateSelectedAngle("viewerQuestion", event.target.value)} /></label></div>
          <p>Evidence refs: {[...session.selectedAngle.sourceRefs, ...session.selectedAngle.claimRefs, ...session.selectedAngle.numberRefs].join(", ")}</p>
          <ul className={styles.issues}>{selectedAngleSummary?.issues.map((entry) => <li key={`${entry.code}:${entry.fieldPath}`} data-kind={entry.blocking ? "error" : "warning"}>{entry.blocking ? "차단" : "경고"} · {entry.code} · {entry.message}</li>)}</ul>
          <div className={styles.actions}><button type="button" onClick={approveSelectedAngle} disabled={!canApproveSelectedAngle(selectedAngleSummary) || Boolean(selectedEvaluation?.blockingIssues.length)}>선택 angle 사용자 승인</button><strong>{session.selectedAngleApproval}</strong></div>
        </>}
      </section>

      <section className={styles.step} aria-labelledby="intelligence-prompt">
        <h2 id="intelligence-prompt"><span>4</span> Script Prompt Export</h2>
        <div className={styles.actions}><button type="button" onClick={generateScriptPrompt} disabled={session.selectedAngleApproval !== "approved"}>상세 대본 프롬프트 생성</button>{session.scriptPrompt && <small>{session.scriptPrompt.promptVersion} · angle {session.selectedAngle?.selectedAngleId} · evidence {session.evidencePack?.provenance.normalizedHash}</small>}</div>
        {session.scriptPrompt && <><textarea className={styles.largeTextarea} readOnly aria-label="Detailed Script prompt" value={session.scriptPrompt.instructions} /><div className={styles.actions}><button type="button" onClick={() => void copyText(session.scriptPrompt?.instructions ?? "", setPromptCopyState)}>프롬프트 복사</button><span role="status">{promptCopyState === "copied" ? "복사 완료" : promptCopyState === "failed" ? "복사 실패 — 직접 선택하세요." : ""}</span></div></>}
      </section>

      <section className={styles.step} aria-labelledby="intelligence-import">
        <h2 id="intelligence-import"><span>5</span> Script Import</h2>
        <label>External LLM raw script response<textarea className={styles.largeTextarea} value={session.scriptRawText} onChange={(event) => updateScriptRaw(event.target.value)} disabled={!session.scriptPrompt} /></label>
        <div className={styles.actions}><button type="button" onClick={() => void previewScriptImport()} disabled={!session.scriptPrompt || !session.scriptRawText}>Script Import Preview</button><small>raw 변경 시 preview·repair·approval이 무효화됩니다.</small></div>
        <div className={styles.compare}><article><h3>Raw</h3><pre>{session.scriptRawText || "아직 없음"}</pre></article><article><h3>Normalized</h3><pre>{session.scriptPackage ? JSON.stringify(session.scriptPackage, null, 2) : "canonical script 없음"}</pre></article></div>
        <dl className={styles.meta}><div><dt>Normalization</dt><dd>{normalizationMethod}</dd></div><div><dt>Raw hash</dt><dd>{scriptRawHash || "없음"}</dd></div><div><dt>Normalized hash</dt><dd>{scriptNormalizedHash || "없음"}</dd></div></dl>
        {session.scriptValidation && <><p>Blocking {session.scriptValidation.blockingIssueCount} · Warning {session.scriptValidation.warningCount}</p><ul className={styles.issues}>{session.scriptValidation.issues.map((entry, index) => <li key={`${entry.code}:${entry.fieldPath}:${index}`} data-kind={entry.blocking ? "error" : "warning"}>{entry.blocking ? "차단" : "경고"} · {entry.code} · {entry.fieldPath || "/"} · {entry.message}</li>)}</ul></>}
      </section>

      <section className={styles.step} aria-labelledby="intelligence-repair">
        <h2 id="intelligence-repair"><span>6</span> Script Repair and Approval</h2>
        <div className={styles.actions}><button type="button" onClick={generateRepairPrompt} disabled={!session.scriptValidation || scriptRepairPaths.length === 0}>Repair prompt 생성</button><small>허용된 기존 leaf field만 수정합니다.</small></div>
        {repairPrompt && <><textarea className={styles.largeTextarea} readOnly aria-label="Script repair prompt" value={repairPrompt.instructions} /><div className={styles.actions}><button type="button" onClick={() => void copyText(repairPrompt.instructions, setRepairCopyState)}>Repair prompt 복사</button><span role="status">{repairCopyState === "copied" ? "복사 완료" : repairCopyState === "failed" ? "복사 실패" : ""}</span></div><label>Repair response<textarea value={session.scriptRepairText} onChange={(event) => { invalidateApprovedScript(); dispatch({ type: "script_repair_response_changed", repairText: event.target.value }); setRepairPackage(null); }} /></label><div className={styles.actions}><button type="button" onClick={previewRepair} disabled={!session.scriptRepairText}>적용 전 preview</button><button type="button" onClick={applyRepair} disabled={!repairPackage}>Field-level 적용·재검증</button></div>{repairPackage && <pre>{JSON.stringify(repairPackage, null, 2)}</pre>}{repairIssues.map((entry, index) => <p className={styles.error} key={`${entry.code}:${index}`}>{entry.message}</p>)}</>}
        <div className={styles.actions}><button type="button" onClick={approveDetailedScript} disabled={!canApproveDetailedScript(session.scriptValidation) || !scriptRawHash || !scriptNormalizedHash}>Detailed Script Package 사용자 승인</button><button type="button" className={styles.secondary} onClick={cancelDetailedScriptApproval} disabled={session.scriptApproval !== "approved"}>Script 승인 취소</button><button type="button" className={styles.secondary} onClick={reset}>Slice 3 session reset</button></div>
        <p className={session.scriptApproval === "approved" ? styles.success : styles.muted} role="status">{session.scriptApproval === "approved" ? "세션 승인, 저장되지 않음" : session.scriptApproval === "invalidated" ? "변경으로 승인이 무효화됐습니다." : "승인되지 않음"}</p>
        <p className={styles.notice}>Scene Card와 Visual Planning은 아직 생성되지 않았습니다.</p>
      </section>
    </main>
  );
}
