"use client";

import { useMemo, useState } from "react";

import type {
  ApprovedTrendBriefSessionSnapshot,
  FieldRepairPackage,
  ImportApprovalState,
  ImportIssue,
  PromptPackage,
  ResearchWindowPreset,
  TargetDurationSeconds,
  TrendBriefImportValidationSummary,
  TrendBriefImportCandidate,
  TrendResearchPromptInput,
} from "../../lib/editorial-v2/contracts";
import {
  applyFieldLevelRepairs,
  buildImportRepairPrompt,
  parseFieldRepairPackage,
} from "../../lib/editorial-v2/import-repair";
import {
  normalizeExternalLlmResponse,
  type ExternalLlmNormalizationResult,
} from "../../lib/editorial-v2/import-normalizer";
import {
  canApproveImport,
  hashNormalizedImport,
  invalidateImportApproval,
  isDuplicateImportHash,
  sha256Utf8,
} from "../../lib/editorial-v2/import-session";
import {
  summarizeImportValidation,
  validateTrendBriefImport,
} from "../../lib/editorial-v2/import-validation";
import { buildTrendBriefResearchPrompt } from "../../lib/editorial-v2/research-prompt";
import styles from "./ResearchImportWorkbench.module.css";

const DOMAINS = [
  "생활경제", "물가", "금리", "환율", "정책", "월급·직장", "소비·카드값",
  "대출·주거비", "저축·보험·연금", "소비심리·행동경제", "산업·기업", "경제 구조",
] as const;
const AUDIENCES = [
  "일반 성인", "직장인", "사회초년생", "자녀가 있는 가구", "주거비·대출 관심층", "은퇴 준비층",
] as const;

type CopyState = "idle" | "copied" | "failed";

export interface ResearchImportWorkbenchProps {
  readonly onApprovedImportChange?: (snapshot: ApprovedTrendBriefSessionSnapshot | null) => void;
}

function cloneTrendBriefCandidate(candidate: TrendBriefImportCandidate): TrendBriefImportCandidate {
  return {
    ...candidate,
    sources: candidate.sources.map((source) => ({ ...source })),
    signals: candidate.signals.map((signal) => ({
      ...signal,
      sourceRefs: [...signal.sourceRefs],
      numbers: signal.numbers.map((number) => ({ ...number })),
    })),
  };
}

function duplicateIssue(): ImportIssue {
  return {
    code: "duplicate_session_import",
    severity: "warning",
    blocking: false,
    fieldPath: "",
    message: "현재 브라우저 세션에서 같은 원문을 이미 검토했습니다.",
    repairable: false,
  };
}

export default function ResearchImportWorkbench({ onApprovedImportChange }: ResearchImportWorkbenchProps) {
  const [researchCutoffDate, setResearchCutoffDate] = useState("");
  const [researchWindow, setResearchWindow] = useState<ResearchWindowPreset>("7d");
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>("생활경제");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("일반 성인");
  const [targetDurationSeconds, setTargetDurationSeconds] = useState<TargetDurationSeconds>(30);
  const [additionalFocus, setAdditionalFocus] = useState("");
  const [promptPackage, setPromptPackage] = useState<PromptPackage | null>(null);
  const [promptCopyState, setPromptCopyState] = useState<CopyState>("idle");
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<ExternalLlmNormalizationResult | null>(null);
  const [rawHash, setRawHash] = useState("");
  const [normalizedHash, setNormalizedHash] = useState("");
  const [summary, setSummary] = useState<TrendBriefImportValidationSummary | null>(null);
  const [sessionHashes, setSessionHashes] = useState<readonly string[]>([]);
  const [repairPrompt, setRepairPrompt] = useState<PromptPackage | null>(null);
  const [repairCopyState, setRepairCopyState] = useState<CopyState>("idle");
  const [repairText, setRepairText] = useState("");
  const [repairPackage, setRepairPackage] = useState<FieldRepairPackage | null>(null);
  const [repairIssues, setRepairIssues] = useState<readonly ImportIssue[]>([]);
  const [approvalState, setApprovalState] = useState<ImportApprovalState>("not_approved");

  const expectedInput = useMemo<TrendResearchPromptInput>(() => ({
    projectId: "session-only-editorial-v2",
    researchCutoffDate,
    researchWindow,
    domain,
    audience,
    targetDurationSeconds,
    additionalFocus,
  }), [researchCutoffDate, researchWindow, domain, audience, targetDurationSeconds, additionalFocus]);

  function invalidatePreview(): void {
    onApprovedImportChange?.(null);
    setPreview(null);
    setRawHash("");
    setNormalizedHash("");
    setSummary(null);
    setRepairPrompt(null);
    setRepairText("");
    setRepairPackage(null);
    setRepairIssues([]);
    setApprovalState((previous) => invalidateImportApproval(previous));
  }

  function updateRawText(value: string): void {
    setRawText(value);
    invalidatePreview();
  }

  function invalidateResearchConfiguration(): void {
    setPromptPackage(null);
    setPromptCopyState("idle");
    invalidatePreview();
  }

  function generatePrompt(): void {
    if (!researchCutoffDate) return;
    setPromptPackage(buildTrendBriefResearchPrompt(expectedInput));
    setPromptCopyState("idle");
    invalidatePreview();
  }

  async function copyText(text: string, setter: (state: CopyState) => void): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setter("copied");
    } catch {
      setter("failed");
    }
  }

  async function importPreview(): Promise<void> {
    onApprovedImportChange?.(null);
    const normalization = normalizeExternalLlmResponse(rawText);
    const nextRawHash = await sha256Utf8(rawText);
    const duplicate = isDuplicateImportHash(nextRawHash, sessionHashes);
    const validationIssues = normalization.value === null
      ? normalization.issues
      : [...normalization.issues, ...validateTrendBriefImport(normalization.value, expectedInput)];
    const issues = duplicate ? [...validationIssues, duplicateIssue()] : validationIssues;
    setPreview(normalization);
    setRawHash(nextRawHash);
    setNormalizedHash(normalization.value === null ? "" : await hashNormalizedImport(normalization.value));
    setSummary(summarizeImportValidation(issues));
    if (!duplicate) setSessionHashes((previous) => [...previous, nextRawHash]);
    setApprovalState((previous) => invalidateImportApproval(previous));
    setRepairPrompt(null);
    setRepairPackage(null);
    setRepairIssues([]);
  }

  const allowedRepairPaths = summary?.issues
    .filter((entry) => entry.repairable && entry.fieldPath.startsWith("/"))
    .map((entry) => entry.fieldPath) ?? [];
  const needsFullReformat = summary?.issues.some(
    (entry) => entry.code === "full_reformat_required" || entry.code === "canonical_reformat_required",
  ) ?? false;

  function generateRepairPrompt(): void {
    if (!summary || allowedRepairPaths.length === 0 || needsFullReformat || !researchCutoffDate) return;
    setRepairPrompt(buildImportRepairPrompt({
      projectId: expectedInput.projectId,
      rawText,
      issues: summary.issues,
      allowedPaths: allowedRepairPaths,
      researchCutoffDate,
    }));
    setRepairCopyState("idle");
  }

  function previewRepair(): void {
    onApprovedImportChange?.(null);
    const parsed = parseFieldRepairPackage(repairText);
    setRepairPackage(parsed.package);
    setRepairIssues(parsed.issues);
    setApprovalState((previous) => invalidateImportApproval(previous));
  }

  async function applyRepair(): Promise<void> {
    if (!preview?.value || !repairPackage) return;
    onApprovedImportChange?.(null);
    const result = applyFieldLevelRepairs(preview.value, repairPackage, allowedRepairPaths);
    const issues = [...result.issues, ...validateTrendBriefImport(result.value, expectedInput)];
    setPreview({ ...preview, value: result.value, issues: result.issues });
    setNormalizedHash(await hashNormalizedImport(result.value));
    setSummary(summarizeImportValidation(issues));
    setRepairIssues(result.issues);
    setApprovalState("invalidated");
  }

  function resetWorkbench(): void {
    onApprovedImportChange?.(null);
    setPromptPackage(null);
    setPromptCopyState("idle");
    setRawText("");
    setSessionHashes([]);
    setRepairCopyState("idle");
    setApprovalState("not_approved");
    invalidatePreview();
  }

  function approveImport(): void {
    if (!preview?.value || !summary || !canApproveImport(summary)) return;
    const candidate = cloneTrendBriefCandidate(preview.value as TrendBriefImportCandidate);
    const snapshot: ApprovedTrendBriefSessionSnapshot = {
      candidate,
      rawHash,
      normalizedHash,
      expectedInput: { ...expectedInput },
      validationSummary: {
        ...summary,
        issues: summary.issues.map((entry) => ({ ...entry })),
      },
      approvalState: "approved",
    };
    setApprovalState("approved");
    onApprovedImportChange?.(snapshot);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Shorts Editorial OS V2 · Slice 2</p>
        <h1>Trend Brief 조사·가져오기 워크벤치</h1>
        <p>외부 검색형 LLM과 복사·붙여넣기로만 연결됩니다. 네트워크 요청과 영구 저장은 없습니다.</p>
      </header>

      <section className={styles.step} aria-labelledby="step-1">
        <h2 id="step-1"><span>1</span> 조사 설정</h2>
        <div className={styles.grid}>
          <label>조사 기준일<input type="date" value={researchCutoffDate} onChange={(event) => { setResearchCutoffDate(event.target.value); invalidateResearchConfiguration(); }} /></label>
          <label>기간<select value={researchWindow} onChange={(event) => { setResearchWindow(event.target.value as ResearchWindowPreset); invalidateResearchConfiguration(); }}><option value="24h">24시간</option><option value="7d">7일</option><option value="30d">30일</option></select><small>24시간은 rolling 24시간이 아니라 cutoff date의 UTC calendar-day 기준입니다.</small></label>
          <label>분야<select value={domain} onChange={(event) => { setDomain(event.target.value as (typeof DOMAINS)[number]); invalidateResearchConfiguration(); }}>{DOMAINS.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
          <label>시청자<select value={audience} onChange={(event) => { setAudience(event.target.value as (typeof AUDIENCES)[number]); invalidateResearchConfiguration(); }}>{AUDIENCES.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
          <label>목표 영상 길이<select value={targetDurationSeconds} onChange={(event) => { setTargetDurationSeconds(Number(event.target.value) as TargetDurationSeconds); invalidateResearchConfiguration(); }}><option value={30}>30초</option><option value={45}>45초</option><option value={60}>60초</option></select></label>
          <label className={styles.wide}>추가 조사 초점 (선택)<input value={additionalFocus} onChange={(event) => { setAdditionalFocus(event.target.value); invalidateResearchConfiguration(); }} placeholder="예: 직장인 월급에 미치는 영향" /></label>
        </div>
      </section>

      <section className={styles.step} aria-labelledby="step-2">
        <h2 id="step-2"><span>2</span> Prompt Export</h2>
        <div className={styles.actions}><button type="button" onClick={generatePrompt} disabled={!researchCutoffDate}>프롬프트 생성</button>{promptPackage && <small>Prompt version: {promptPackage.promptVersion}</small>}</div>
        {promptPackage && <><textarea className={styles.largeTextarea} readOnly aria-label="생성된 조사 프롬프트" value={promptPackage.instructions} /><div className={styles.actions}><button type="button" onClick={() => void copyText(promptPackage.instructions, setPromptCopyState)}>프롬프트 복사</button><span role="status">{promptCopyState === "copied" ? "복사 완료" : promptCopyState === "failed" ? "클립보드 복사 실패 — 직접 선택해 복사하세요." : ""}</span></div></>}
      </section>

      <section className={styles.step} aria-labelledby="step-3">
        <h2 id="step-3"><span>3</span> LLM Import</h2>
        <label>외부 LLM raw response<textarea className={styles.largeTextarea} value={rawText} onChange={(event) => updateRawText(event.target.value)} placeholder="JSON, JSON code fence 또는 구조화 Markdown을 붙여넣으세요." /></label>
        <div className={styles.actions}><button type="button" onClick={() => void importPreview()} disabled={!rawText}>Import Preview</button><small>입력 변경 시 이전 preview·approval은 자동 무효화됩니다.</small></div>
      </section>

      <section className={styles.step} aria-labelledby="step-4">
        <h2 id="step-4"><span>4</span> Raw / Normalized Preview</h2>
        {!preview ? <p className={styles.muted}>아직 가져온 응답이 없습니다.</p> : <><div className={styles.compare}><article><h3>Raw response</h3><pre>{preview.rawText}</pre></article><article><h3>Normalized preview</h3><pre>{preview.value === null ? JSON.stringify(preview.markdownStructure, null, 2) : JSON.stringify(preview.value, null, 2)}</pre></article></div><dl className={styles.meta}><div><dt>Normalization</dt><dd>{preview.method}</dd></div><div><dt>Raw hash</dt><dd>{rawHash}</dd></div><div><dt>Normalized hash</dt><dd>{normalizedHash || "canonical value 없음"}</dd></div><div><dt>자동 추론 필드</dt><dd>{preview.automaticInferences.length === 0 ? "없음" : preview.automaticInferences.join(", ")}</dd></div></dl></>}
      </section>

      <section className={styles.step} aria-labelledby="step-5">
        <h2 id="step-5"><span>5</span> Validation & Repair</h2>
        {!summary ? <p className={styles.muted}>Import Preview 후 validation summary가 표시됩니다.</p> : <><div className={styles.counts}><strong>Blocking {summary.blockingIssueCount}</strong><strong>Warning {summary.warningCount}</strong></div><ul className={styles.issues}>{summary.issues.map((entry, index) => <li key={`${entry.code}-${entry.fieldPath}-${index}`} data-severity={entry.severity}><strong>{entry.code}</strong><code>{entry.fieldPath || "/"}</code><span>{entry.message}</span><small>{entry.repairable ? "field repair 가능" : "전체 재포맷 또는 사용자 확인 필요"}</small></li>)}</ul></>}
        <div className={styles.actions}><button type="button" onClick={generateRepairPrompt} disabled={!summary || allowedRepairPaths.length === 0 || needsFullReformat}>보완 프롬프트 생성</button>{needsFullReformat && <span>구조 전체 재포맷이 필요해 field repair가 비활성화됐습니다.</span>}</div>
        {repairPrompt && <><textarea className={styles.largeTextarea} readOnly aria-label="보완 프롬프트" value={repairPrompt.instructions} /><div className={styles.actions}><button type="button" onClick={() => void copyText(repairPrompt.instructions, setRepairCopyState)}>보완 프롬프트 복사</button><span role="status">{repairCopyState === "copied" ? "복사 완료" : repairCopyState === "failed" ? "복사 실패" : ""}</span></div><label>Repair response<textarea value={repairText} onChange={(event) => { onApprovedImportChange?.(null); setRepairText(event.target.value); setRepairPackage(null); setApprovalState((previous) => invalidateImportApproval(previous)); }} /></label><div className={styles.actions}><button type="button" onClick={previewRepair} disabled={!repairText}>Repair 적용 전 preview</button><button type="button" onClick={() => void applyRepair()} disabled={!repairPackage || !preview?.value}>허용 field repair 적용·재검증</button></div>{repairPackage && <pre>{JSON.stringify(repairPackage, null, 2)}</pre>}{repairIssues.map((entry) => <p key={`${entry.code}-${entry.fieldPath}`} className={styles.error}>{entry.message}</p>)}</>}
      </section>

      <section className={styles.step} aria-labelledby="step-6">
        <h2 id="step-6"><span>6</span> Session Approval</h2>
        <p>승인은 현재 브라우저 세션에만 적용되며 Trend Brief artifact로 저장되지 않습니다.</p>
        <div className={styles.actions}><button type="button" onClick={approveImport} disabled={!canApproveImport(summary)}>사용자 명시적 승인</button><button type="button" className={styles.secondary} onClick={resetWorkbench}>작업 초기화</button></div>
        <p className={approvalState === "approved" ? styles.success : styles.muted} role="status">{approvalState === "approved" ? "세션 승인, 아직 저장되지 않음" : approvalState === "invalidated" ? "입력 또는 repair 변경으로 승인이 무효화됐습니다." : "승인되지 않음"}</p>
      </section>
    </main>
  );
}
