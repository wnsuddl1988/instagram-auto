"use client";

/**
 * ManualImageBridge
 *
 * 수동 AI 이미지 생성 브리지 UI.
 * - Chrome 프로필 선택 + 실행
 * - 이미지 프롬프트 복사
 * - 다운로드 폴더 새 이미지 감지
 * - 선택 이미지 → 프로젝트 관리 폴더 복사 → 씬 등록
 * - reviewing_image / accepted / rejected 상태 관리
 *
 * 보안:
 *  - 프로필 목록은 CHROME_PROFILES allowlist 에서만 표시
 *  - 임의 경로·URL·명령 입력 없음
 *  - 자동 로그인·자동 클릭·자동 생성 없음
 *  - 계정 인증정보·쿠키·세션 접근 없음
 *  - register: fileName 만 전달 (서버에서 경로 resolve)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { CHROME_PROFILES, type ChromeProfile } from "@/lib/chromeProfiles";

export interface SceneForBridge {
  sceneNumber: number;
  caption: string;
  imagePrompt: string;
  /** 이미 등록된 프로젝트 이미지 경로 (있으면 미리보기) */
  localImagePath?: string | null;
  /** 씬 상태 */
  manualStatus?: ManualSceneStatus;
}

/** 씬별 수동 이미지 상태 */
export type ManualSceneStatus =
  | "awaiting_user_generation"
  | "reviewing_image"
  | "accepted"
  | "rejected";

interface DetectedFile {
  name: string;
  path: string;
  size: number;
  createdMs: number;
  modifiedMs: number;
}

interface RegisterResult {
  ok: boolean;
  destPath: string;
  jobId: string;
  sceneNumber: number;
  fileName: string;
  sourceSize: number;
}

interface Props {
  /** 현재 작업 대상 씬 정보 */
  scene: SceneForBridge;
  /** job ID — 프로젝트 관리 폴더 경로에 사용 */
  jobId: string;
  /** 씬 등록 완료 콜백 — 복사된 프로젝트 이미지 경로를 반환 */
  onRegisterImage: (sceneNumber: number, projectImagePath: string) => void;
  /** 씬 상태 변경 콜백 */
  onStatusChange: (sceneNumber: number, status: ManualSceneStatus) => void;
  /** 닫기 콜백 */
  onClose: () => void;
  /**
   * "이 이미지 사용" 클릭 후: 현재 씬 accepted 처리 + 다음 씬 자동 준비.
   * - 마지막 씬이면 호출되지 않음 (완료 표시만).
   */
  onAcceptAndNext?: (acceptedSceneNumber: number, acceptedLocalPath?: string | null) => void;
  /**
   * 마지막 씬 승인 완료 콜백 — 무음 렌더 영역 스크롤용.
   */
  onAllScenesAccepted?: () => void;
  /**
   * 전체 씬 수 — 마지막 씬 감지용.
   */
  totalScenes?: number;
  /**
   * Scene 1 기준 이미지 절대 경로 (Scene 2~5에서 표시용).
   * Scene 1 등록 완료 후 부모가 전달.
   */
  referenceImagePath?: string | null;
  /**
   * 자동 시작 모드 (MVP 불러오기 직후 자동 실행 시 true).
   * - 마운트 직후 Chrome 실행 + 프롬프트 복사 + 작업 시작 시각 기록
   * - 5초 간격 자동 polling (최대 10분)
   */
  autoStart?: boolean;
  /**
   * polling 전용 자동 시작 (씬 전환 후 재마운트 시).
   * - Chrome 실행 없이 프롬프트 복사 + 작업 시작 시각 기록 + polling만 시작
   */
  autoStartPollingOnly?: boolean;
  /** 자동 시작 시 선택할 프로필 alias (미지정 시 GPT 1) */
  autoProfileAlias?: string;
}

export default function ManualImageBridge({
  scene,
  jobId,
  onRegisterImage,
  onStatusChange,
  onClose,
  onAcceptAndNext,
  onAllScenesAccepted,
  totalScenes,
  referenceImagePath,
  autoStart = false,
  autoStartPollingOnly = false,
  autoProfileAlias,
}: Props) {
  const [selectedAlias, setSelectedAlias] = useState<string>(
    autoProfileAlias ?? CHROME_PROFILES[0].alias
  );
  const [launching, setLaunching] = useState(false);
  const [launchMsg, setLaunchMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // 자동 polling 상태
  const [autoPolling, setAutoPolling] = useState(false);
  const [autoMsg, setAutoMsg] = useState<string>("");
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStopTimeRef = useRef<number>(0);
  const autoStartedRef = useRef(false);

  // 감지 시작 시각 (ms) — 작업 시작 버튼 클릭 시 갱신 (null이면 전체 스캔)
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detectedFiles, setDetectedFiles] = useState<DetectedFile[]>([]);
  const detectedFilesRef = useRef<DetectedFile[]>([]); // autoStart closure에서 접근용
  const setDetectedFilesSync = (files: DetectedFile[]) => {
    detectedFilesRef.current = files;
    setDetectedFiles(files);
  };
  const [scanMsg, setScanMsg] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<DetectedFile | null>(null);

  // 등록 상태
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string>("");
  const [registeredPath, setRegisteredPath] = useState<string>(
    scene.localImagePath ?? ""
  );

  const promptTextRef = useRef<HTMLTextAreaElement>(null);

  const selectedProfile: ChromeProfile =
    CHROME_PROFILES.find((p) => p.alias === selectedAlias) ??
    CHROME_PROFILES[0];

  const currentStatus: ManualSceneStatus =
    scene.manualStatus ?? "awaiting_user_generation";

  // ── 프롬프트 복사 ─────────────────────────────────────────────────────────

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(scene.imagePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      promptTextRef.current?.select();
    }
  }, [scene.imagePrompt]);

  // ── Chrome 실행 ──────────────────────────────────────────────────────────

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    setLaunchMsg("");
    try {
      const res = await fetch("/api/chrome-bridge?action=launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: selectedAlias }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // 이미 실행 중 — 오류가 아니므로 안내 메시지만 표시
        setLaunchMsg(`ℹ️ ${data.error ?? `${selectedAlias}이(가) 이미 실행 중입니다."}`}`);
      } else if (!res.ok) {
        setLaunchMsg(`오류: ${data.error ?? "알 수 없는 오류"}`);
      } else {
        setLaunchMsg(`✓ Chrome 열림 — ${data.url}`);
      }
    } catch (e) {
      setLaunchMsg(`연결 실패: ${String(e)}`);
    } finally {
      setLaunching(false);
    }
  }, [selectedAlias]);

  // ── 작업 시작 (감지 기준 시각 기록) ─────────────────────────────────────

  const handleStartWork = useCallback(() => {
    setStartedAt(Date.now());
    setDetectedFilesSync([]);
    setSelectedFile(null);
    setScanMsg("작업 시작 시각 기록됨. 이미지 생성 후 아래 '새 이미지 확인' 버튼을 누르세요.");
    setRegisterError("");
  }, []);

  // ── 자동 polling (5초 간격, 최대 10분) ───────────────────────────────────

  const startAutoPolling = useCallback((alias: string, sinceMs: number) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    setAutoPolling(true);
    setAutoMsg("자동 감지 중 (5초 간격) — GPT 1에서 이미지 다운로드하면 자동 발견됩니다.");
    pollingStopTimeRef.current = Date.now() + 10 * 60 * 1000; // 10분

    const doPoll = async () => {
      if (Date.now() > pollingStopTimeRef.current) {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        setAutoPolling(false);
        setAutoMsg("자동 감지 종료 (10분 초과). '새 이미지 확인' 버튼으로 수동 스캔하세요.");
        return;
      }
      try {
        const res = await fetch("/api/chrome-bridge?action=scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias, since: sinceMs }),
        });
        const data = await res.json();
        if (res.ok && data.files && data.files.length > 0) {
          setDetectedFilesSync(data.files);
          // 후보가 1개이면 자동 선택
          if (data.files.length === 1) {
            setSelectedFile(data.files[0]);
            setScanMsg("이미지 1개 감지 — 자동 선택됨. '이 이미지 사용' 버튼을 누르세요.");
          } else {
            setScanMsg(`${data.files.length}개 이미지 감지됨! 등록할 이미지를 선택하세요.`);
          }
          // 이미지 발견 시 polling 중단
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setAutoPolling(false);
          setAutoMsg("이미지 발견됨! 아래에서 '이 이미지 사용'을 누르세요.");
        }
      } catch {
        // polling 중 네트워크 오류는 무시하고 계속
      }
    };

    pollingTimerRef.current = setInterval(doPoll, 5000);
  }, []);

  const stopAutoPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setAutoPolling(false);
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  // ── 마운트 시 자동 전체 스캔 (since=0) — 기존 이미지 즉시 표시 ─────────────
  const initialScanDoneRef = useRef(false);
  useEffect(() => {
    if (initialScanDoneRef.current) return;
    initialScanDoneRef.current = true;
    const alias = autoProfileAlias ?? CHROME_PROFILES[0].alias;
    const doInitialScan = async () => {
      try {
        const res = await fetch("/api/chrome-bridge?action=scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias, since: 0 }),
        });
        const data = await res.json();
        if (res.ok && data.files && data.files.length > 0) {
          setDetectedFilesSync(data.files);
          if (data.files.length === 1) {
            setSelectedFile(data.files[0]);
            setScanMsg("기존 이미지 1개 발견 — 자동 선택됨. '이 이미지 사용' 버튼을 누르세요.");
          } else {
            setScanMsg(`기존 이미지 ${data.files.length}개 발견. 등록할 이미지를 선택하세요.`);
          }
        }
      } catch { /* 초기 스캔 실패는 무시 */ }
    };
    doInitialScan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── autoStart: 마운트 직후 자동 실행 ────────────────────────────────────
  // 단, 이미 스캔으로 후보 이미지가 발견된 경우 Chrome 재실행 생략

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;

    const run = async () => {
      // 1. 프롬프트 클립보드 복사
      try {
        await navigator.clipboard.writeText(scene.imagePrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch { /* fallback: textarea select */ }

      // 2. 초기 스캔 결과가 이미 있으면 Chrome 재실행 생략
      // (초기 스캔은 마운트 직후 실행되므로 300ms 대기 후 확인)
      await new Promise((r) => setTimeout(r, 400));
      // detectedFiles state는 closure에 없으므로 ref로 접근
      if (detectedFilesRef.current.length > 0) {
        setLaunchMsg("ℹ️ 기존 이미지가 발견되었습니다. 아래에서 선택하세요.");
        // polling만 시작
        const now = Date.now();
        setStartedAt(now);
        startAutoPolling(autoProfileAlias ?? CHROME_PROFILES[0].alias, now);
        return;
      }

      // 후보 없을 때만 Chrome 실행
      setLaunching(true);
      try {
        const res = await fetch("/api/chrome-bridge?action=launch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias: autoProfileAlias ?? CHROME_PROFILES[0].alias }),
        });
        const data = await res.json();
        if (res.status === 409) {
          setLaunchMsg(`ℹ️ ${data.error ?? "GPT 1이 이미 실행 중입니다."}`);
        } else if (!res.ok) {
          setLaunchMsg(`오류: ${data.error ?? "Chrome 실행 실패"}`);
        } else {
          setLaunchMsg(`Chrome 열림 — ${data.url}`);
        }
      } catch (e) {
        setLaunchMsg(`연결 실패: ${String(e)}`);
      } finally {
        setLaunching(false);
      }

      // 3. 작업 시작 시각 기록 + 자동 polling 시작
      const now = Date.now();
      setStartedAt(now);
      setDetectedFilesSync([]);
      setSelectedFile(null);
      setRegisterError("");
      startAutoPolling(autoProfileAlias ?? CHROME_PROFILES[0].alias, now);
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // ── autoStartPollingOnly: 씬 전환 후 polling만 재시작 ────────────────────

  const pollingStartedRef = useRef(false);

  useEffect(() => {
    if (!autoStartPollingOnly || pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    // 프롬프트 복사
    try {
      navigator.clipboard.writeText(scene.imagePrompt).catch(() => {});
    } catch { /* ignore */ }

    // 작업 시작 시각 기록 + polling 시작 (Chrome 실행 없음)
    const now = Date.now();
    setStartedAt(now);
    setDetectedFilesSync([]);
    setSelectedFile(null);
    setRegisterError("");
    startAutoPolling(autoProfileAlias ?? CHROME_PROFILES[0].alias, now);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartPollingOnly]);

  // ── 다운로드 폴더 스캔 ────────────────────────────────────────────────────
  // startedAt 없어도 since=0으로 전체 스캔 허용 (기존 이미지 재사용 가능)
  const handleScan = useCallback(async () => {
    setScanning(true);
    setScanMsg("");
    setDetectedFilesSync([]);
    setSelectedFile(null);
    setRegisterError("");
    const since = startedAt ?? 0;
    const isFullScan = since === 0;
    try {
      const res = await fetch("/api/chrome-bridge?action=scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: selectedAlias, since }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanMsg(`스캔 오류: ${data.error ?? "알 수 없는 오류"}`);
      } else if (!data.files || data.files.length === 0) {
        setScanMsg("이미지가 없습니다. GPT에서 생성·다운로드 후 다시 확인하세요.");
      } else {
        setDetectedFilesSync(data.files);
        if (data.files.length === 1) {
          setSelectedFile(data.files[0]);
          setScanMsg(isFullScan
            ? "이미지 1개 발견 — 자동 선택됨. '이 이미지 사용' 버튼을 누르세요."
            : "새 이미지 1개 감지 — 자동 선택됨. '이 이미지 사용' 버튼을 누르세요.");
        } else {
          setScanMsg(isFullScan
            ? `이미지 ${data.files.length}개 발견. 등록할 이미지를 선택하세요.`
            : `새 이미지 ${data.files.length}개 감지. 등록할 이미지를 선택하세요.`);
        }
      }
    } catch (e) {
      setScanMsg(`스캔 실패: ${String(e)}`);
    } finally {
      setScanning(false);
    }
  }, [selectedAlias, startedAt]);

  // ── 이미지 등록 (API 호출 → 복사 → localImagePath 연결) ─────────────────

  const handleRegister = useCallback(async () => {
    if (!selectedFile) return;
    setRegistering(true);
    setRegisterError("");
    try {
      const res = await fetch("/api/chrome-bridge?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: selectedAlias,
          fileName: selectedFile.name,   // 파일명만 전달 (경로 아님)
          jobId,
          sceneNumber: scene.sceneNumber,
        }),
      });
      const data: RegisterResult & { error?: string } = await res.json();
      if (!res.ok) {
        setRegisterError(`등록 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }
      // 성공 — 복사된 프로젝트 경로 연결
      setRegisteredPath(data.destPath);
      onRegisterImage(scene.sceneNumber, data.destPath);
      onStatusChange(scene.sceneNumber, "reviewing_image");
    } catch (e) {
      setRegisterError(`등록 중 오류: ${String(e)}`);
    } finally {
      setRegistering(false);
    }
  }, [selectedFile, selectedAlias, jobId, scene.sceneNumber, onRegisterImage, onStatusChange]);

  // ── "이 이미지 사용" — 등록 + 승인 + 다음 씬 자동 진행 ───────────────────────

  const handleUseThisImage = useCallback(async () => {
    // 이미 registeredPath 있으면 재등록 없이 바로 승인
    if (!selectedFile && !registeredPath) return;

    let finalPath = registeredPath;

    // 아직 등록 안 된 경우 먼저 등록
    if (selectedFile && !registeredPath) {
      setRegistering(true);
      setRegisterError("");
      try {
        const res = await fetch("/api/chrome-bridge?action=register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alias: selectedAlias,
            fileName: selectedFile.name,
            jobId,
            sceneNumber: scene.sceneNumber,
          }),
        });
        const data: RegisterResult & { error?: string } = await res.json();
        if (!res.ok) {
          setRegisterError(`등록 실패: ${data.error ?? "알 수 없는 오류"}`);
          setRegistering(false);
          return;
        }
        finalPath = data.destPath;
        setRegisteredPath(data.destPath);
        onRegisterImage(scene.sceneNumber, data.destPath);
        onStatusChange(scene.sceneNumber, "reviewing_image");
      } catch (e) {
        setRegisterError(`등록 중 오류: ${String(e)}`);
        setRegistering(false);
        return;
      }
      setRegistering(false);
    }

    // accepted 처리
    onStatusChange(scene.sceneNumber, "accepted");

    // 마지막 씬 여부 판단
    const isLast = totalScenes !== undefined && scene.sceneNumber >= totalScenes;

    if (isLast) {
      // 마지막 씬: 완료 콜백
      onAllScenesAccepted?.();
    } else {
      // 다음 씬: 부모에 위임
      onAcceptAndNext?.(scene.sceneNumber, finalPath ?? null);
    }
  }, [
    selectedFile,
    registeredPath,
    selectedAlias,
    jobId,
    scene.sceneNumber,
    totalScenes,
    onRegisterImage,
    onStatusChange,
    onAcceptAndNext,
    onAllScenesAccepted,
  ]);

  // ── accept / reject ───────────────────────────────────────────────────────

  const handleAccept = useCallback(() => {
    onStatusChange(scene.sceneNumber, "accepted");
    onClose();
  }, [scene.sceneNumber, onStatusChange, onClose]);

  const handleReject = useCallback(() => {
    onStatusChange(scene.sceneNumber, "rejected");
    // rejected 후 재등록 가능하도록 선택 초기화
    setSelectedFile(null);
    setDetectedFilesSync([]);
    setScanMsg("");
    setRegisteredPath("");
    setRegisterError("");
    setStartedAt(null);
  }, [scene.sceneNumber, onStatusChange]);

  // ── 기준 이미지 폴더 열기 ─────────────────────────────────────────────────

  const [folderOpenMsg, setFolderOpenMsg] = useState<string>("");
  // 고급 옵션 열기/닫기 (기본 닫힘)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleOpenReferenceFolder = useCallback(async () => {
    setFolderOpenMsg("폴더 여는 중...");
    try {
      const res = await fetch("/api/chrome-bridge?action=open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFolderOpenMsg(`오류: ${data.error ?? "알 수 없는 오류"}`);
      } else {
        setFolderOpenMsg("탐색기가 열렸습니다. 기준 이미지를 GPT 창에 직접 첨부하세요.");
        setTimeout(() => setFolderOpenMsg(""), 5000);
      }
    } catch (e) {
      setFolderOpenMsg(`연결 실패: ${String(e)}`);
    }
  }, [jobId]);

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  const isReviewing = currentStatus === "reviewing_image";
  const isAccepted = currentStatus === "accepted";
  const isRejected = currentStatus === "rejected";
  const showReviewPanel = isReviewing || isAccepted;

  // 실제 미리보기 경로: 등록 직후 갱신된 registeredPath 우선, 그 다음 scene.localImagePath
  const previewPath = registeredPath || scene.localImagePath || "";

  // 씬 1인지 여부 (기준 이미지 생성 씬)
  const isSceneOne = scene.sceneNumber === 1;
  // Scene 2~5: 기준 이미지가 있으면 표시
  const showReferenceImage = !isSceneOne && !!referenceImagePath;
  // "이 이미지 사용" 버튼 활성 조건: 파일 선택됨 OR 이미 registeredPath 있음
  const canUseImage = (!!selectedFile || !!registeredPath) && !isAccepted;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-4 space-y-4 text-sm">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">
          🖼️ 수동 AI 이미지 생성 — 씬 {scene.sceneNumber}
          {totalScenes !== undefined && (
            <span className="text-slate-600 font-normal"> / {totalScenes}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {/* 상태 배지 */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            isAccepted
              ? "bg-emerald-900/40 text-emerald-300 border border-emerald-600/40"
              : isReviewing
              ? "bg-amber-900/30 text-amber-300 border border-amber-600/30"
              : isRejected
              ? "bg-red-900/30 text-red-400 border border-red-600/30"
              : "bg-slate-800/50 text-slate-500 border border-slate-700/30"
          }`}>
            {isAccepted ? "승인됨" : isReviewing ? "검토 중" : isRejected ? "반려됨" : "대기 중"}
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>

      {/* ── 단일 CTA 위저드 ── */}
      {!isAccepted && (
        <div className="rounded-xl border border-violet-600/40 bg-violet-900/20 p-3 space-y-2">
          <div className="text-[11px] text-violet-200 leading-relaxed">
            {isSceneOne
              ? "1. GPT에서 프롬프트를 전송하고 이미지를 다운로드하세요."
              : `1. 기준 이미지(Scene 1)를 GPT에 첨부하고 프롬프트를 전송하세요.\n2. 이미지를 다운로드하면 자동으로 감지됩니다.`}
          </div>
          {/* 감시 상태 표시 */}
          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${
            autoPolling ? "text-emerald-400" : "text-slate-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${autoPolling ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            {autoPolling ? "다운로드 폴더 감시 중..." : "대기 중"}
          </div>
        </div>
      )}

      {/* 고급 옵션 토글 */}
      {!isAccepted && (
        <button
          onClick={() => setIsAdvancedOpen(v => !v)}
          className="w-full flex items-center justify-between text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-0.5"
        >
          <span>고급 옵션 (폴더 열기 / 프롬프트 복사 / 프로필 선택)</span>
          <span>{isAdvancedOpen ? "▲" : "▼"}</span>
        </button>
      )}

      {/* Scene 2~5: 기준 이미지 + 폴더 열기 (고급 옵션) */}
      {showReferenceImage && isAdvancedOpen && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-semibold">기준 이미지 (Scene 1)</div>
            <button
              onClick={handleOpenReferenceFolder}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 border border-slate-600/40 transition-colors"
            >
              📂 기준 이미지 폴더 열기
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-violet-700/40 bg-slate-800/40">
            <img
              src={`/api/local-image?path=${encodeURIComponent(referenceImagePath!)}`}
              alt="Scene 1 기준 이미지"
              className="w-full object-cover max-h-36"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          {folderOpenMsg && (
            <div className={`text-[10px] px-2 py-1 rounded ${folderOpenMsg.startsWith("오류") || folderOpenMsg.startsWith("연결") ? "text-red-400 bg-red-900/20" : "text-emerald-400 bg-emerald-900/20"}`}>
              {folderOpenMsg}
            </div>
          )}
        </div>
      )}

      {/* Scene 1: 폴더 열기 버튼만 (고급 옵션) */}
      {isSceneOne && isAdvancedOpen && (
        <div className="space-y-1">
          <button
            onClick={handleOpenReferenceFolder}
            className="w-full py-1.5 rounded-xl text-[11px] font-semibold bg-slate-700/40 hover:bg-slate-700/60 text-slate-300 border border-slate-600/40 transition-colors"
          >
            📂 기준 이미지 폴더 열기
          </button>
          {folderOpenMsg && (
            <div className={`text-[10px] px-2 py-1 rounded ${folderOpenMsg.startsWith("오류") || folderOpenMsg.startsWith("연결") ? "text-red-400 bg-red-900/20" : "text-emerald-400 bg-emerald-900/20"}`}>
              {folderOpenMsg}
            </div>
          )}
        </div>
      )}

      {/* 씬 정보 (고급 옵션) */}
      {isAdvancedOpen && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/40 px-3 py-2 space-y-0.5">
          <div className="text-[11px] text-slate-500">씬 {scene.sceneNumber} 자막</div>
          <div className="text-xs text-white font-medium">{scene.caption}</div>
        </div>
      )}

      {/* 등록된 이미지 미리보기 */}
      {(showReviewPanel || registeredPath) && previewPath && (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-400 font-semibold">
            {isAccepted ? "✓ 승인된 이미지" : "감지된 이미지 — 확인 후 '이 이미지 사용'을 누르세요"}
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-700/40 bg-slate-800/40">
            <img
              src={`/api/local-image?path=${encodeURIComponent(previewPath)}`}
              alt={`씬 ${scene.sceneNumber} 등록 이미지`}
              className="w-full object-cover max-h-48"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="text-[10px] text-slate-600 break-all">{previewPath}</div>

          {/* 승인 상태에서 재등록 버튼 */}
          {isAccepted && (
            <button
              onClick={handleReject}
              className="w-full py-1.5 rounded-xl text-[11px] text-slate-500 hover:text-slate-300 border border-slate-700/30 hover:bg-slate-800/40 transition-colors"
            >
              이미지 다시 선택
            </button>
          )}
        </div>
      )}

      {/* 반려 안내 */}
      {isRejected && (
        <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-600/30">
          <div className="text-[11px] text-red-400 font-semibold mb-0.5">반려됨 — 새 이미지를 생성하고 다시 등록하세요</div>
          <div className="text-[10px] text-slate-500">아래에서 새 이미지를 스캔하거나 Chrome을 다시 열어 생성하세요.</div>
        </div>
      )}

      {/* 고급 옵션 패널 */}
      {isAdvancedOpen && !isAccepted && (
        <div className="space-y-3 border-t border-slate-700/40 pt-3">

          {/* 프롬프트 복사 */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-semibold">이미지 프롬프트</div>
            <textarea
              ref={promptTextRef}
              readOnly
              value={scene.imagePrompt}
              rows={4}
              className="w-full rounded-xl bg-slate-800/70 border border-slate-700/50 px-3 py-2 text-xs text-slate-300 resize-none focus:outline-none focus:border-indigo-500/50 cursor-text"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <button
              onClick={handleCopyPrompt}
              className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                copied
                  ? "bg-emerald-600/40 text-emerald-300 border border-emerald-500/40"
                  : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30"
              }`}
            >
              {copied ? "✓ 복사됨" : "프롬프트 복사"}
            </button>
          </div>

          {/* 프로필 선택 */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-semibold">Chrome 프로필 (GPT 1 유지)</div>
            <div className="grid grid-cols-3 gap-1.5">
              {CHROME_PROFILES.map((p) => (
                <button
                  key={p.alias}
                  onClick={() => setSelectedAlias(p.alias)}
                  className={`py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    selectedAlias === p.alias
                      ? "bg-indigo-600/40 text-indigo-200 border-indigo-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-700/40 hover:bg-slate-700/40"
                  }`}
                >
                  {p.alias}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-600 truncate">
              다운로드 폴더: {selectedProfile.downloadDir}
            </div>
          </div>

          {/* 복사 + 프로필 열기 */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await handleCopyPrompt();
                await handleLaunch();
              }}
              disabled={launching}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-violet-700/40 hover:bg-violet-700/60 text-violet-200 border border-violet-500/40 transition-colors disabled:opacity-50"
            >
              {launching ? "실행 중..." : "복사 + 프로필 열기"}
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 border border-slate-600/40 transition-colors disabled:opacity-50"
            >
              열기만
            </button>
          </div>
          {launchMsg && (
            <div className={`text-[11px] px-2 py-1 rounded-lg ${
              launchMsg.startsWith("오류") || launchMsg.startsWith("연결")
                ? "text-red-400 bg-red-900/20"
                : launchMsg.startsWith("ℹ️")
                ? "text-sky-300 bg-sky-900/20"
                : "text-emerald-400 bg-emerald-900/20"
            }`}>
              {launchMsg}
            </div>
          )}
        </div>
      )}

      {/* 자동 감지 상태 배너 */}
      {(autoPolling || autoMsg) && (
        <div className={`px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
          autoPolling
            ? "bg-sky-900/20 border-sky-600/30 text-sky-300"
            : autoMsg.includes("발견") || autoMsg.includes("자동 선택")
            ? "bg-emerald-900/20 border-emerald-600/30 text-emerald-300"
            : "bg-slate-800/40 border-slate-700/30 text-slate-400"
        }`}>
          <span className="flex items-center gap-1.5">
            {autoPolling && <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
            {autoMsg}
          </span>
          {autoPolling && (
            <button
              onClick={stopAutoPolling}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline shrink-0"
            >
              중단
            </button>
          )}
        </div>
      )}

      {/* 작업 시작 기록 (고급 옵션 내 표시) — 기본은 autoPolling이 자동 처리 */}
      {isAdvancedOpen && !isAccepted && (
        <div className="flex items-center gap-2 border-t border-slate-700/40 pt-2">
          <button
            onClick={() => {
              handleStartWork();
              const alias = autoProfileAlias ?? CHROME_PROFILES[0].alias;
              startAutoPolling(alias, Date.now());
            }}
            className="py-2 px-4 rounded-xl text-xs font-semibold bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 border border-amber-600/40 transition-colors"
          >
            작업 시작 기록 (수동)
          </button>
          {startedAt !== null && (
            <span className="text-[11px] text-slate-500">
              {new Date(startedAt).toLocaleTimeString("ko-KR")} 이후 파일 감지
            </span>
          )}
        </div>
      )}

      {/* 새 이미지 확인 (수동) */}
      <button
        onClick={handleScan}
        disabled={scanning}
        className="w-full py-2 rounded-xl text-xs font-semibold bg-sky-700/30 hover:bg-sky-700/50 text-sky-300 border border-sky-600/40 transition-colors disabled:opacity-40"
      >
        {scanning ? "스캔 중..." : startedAt ? "새 이미지 확인" : "이미지 목록 새로고침"}
      </button>
      {scanMsg && (
        <div className={`text-[11px] px-2 py-1.5 rounded-lg ${detectedFiles.length > 0 ? "text-sky-300 bg-sky-900/20" : "text-slate-400 bg-slate-800/40"}`}>
          {scanMsg}
        </div>
      )}

      {/* 감지된 이미지 목록 (복수일 때만 선택 UI 표시) */}
      {detectedFiles.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-400 font-semibold">
            이미지 후보 {detectedFiles.length}개 — 선택하세요
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
            {detectedFiles.map((f) => {
              const isNew = startedAt !== null && f.modifiedMs >= startedAt;
              const isSelected = selectedFile?.path === f.path;
              const previewUrl = `/api/chrome-bridge?action=preview&alias=${encodeURIComponent(selectedAlias)}&fileName=${encodeURIComponent(f.name)}`;
              return (
                <div
                  key={f.path}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    isSelected
                      ? "border-emerald-500/60 bg-emerald-900/20"
                      : "border-slate-700/40 bg-slate-800/40"
                  }`}
                >
                  {/* 미리보기 이미지 */}
                  <img
                    src={previewUrl}
                    alt={f.name}
                    className="w-full object-cover max-h-40 cursor-pointer"
                    onClick={() => { setSelectedFile(f); setRegisterError(""); }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  {/* 파일 정보 + 선택/사용 버튼 */}
                  <div className="px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium truncate text-slate-200">{f.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                        isNew
                          ? "bg-emerald-900/50 text-emerald-300 border border-emerald-600/40"
                          : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                      }`}>
                        {isNew ? "새 이미지" : "기존"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {(f.size / 1024).toFixed(0)} KB · {new Date(f.modifiedMs).toLocaleTimeString("ko-KR")}
                    </div>
                    {/* 이미지별 "이 이미지 사용" 버튼 */}
                    {!isAccepted && (
                      <button
                        onClick={async () => {
                          setSelectedFile(f);
                          setRegisterError("");
                          // 선택 즉시 등록+승인 실행
                          setRegistering(true);
                          try {
                            const res = await fetch("/api/chrome-bridge?action=register", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ alias: selectedAlias, fileName: f.name, jobId, sceneNumber: scene.sceneNumber }),
                            });
                            const data = await res.json();
                            if (!res.ok) { setRegisterError(`등록 실패: ${data.error ?? "알 수 없는 오류"}`); return; }
                            setRegisteredPath(data.destPath);
                            onRegisterImage(scene.sceneNumber, data.destPath);
                            onStatusChange(scene.sceneNumber, "accepted");
                            const isLast = totalScenes !== undefined && scene.sceneNumber >= totalScenes;
                            if (isLast) { onAllScenesAccepted?.(); } else { onAcceptAndNext?.(scene.sceneNumber, data.destPath); }
                          } catch (e) {
                            setRegisterError(`오류: ${String(e)}`);
                          } finally {
                            setRegistering(false);
                          }
                        }}
                        disabled={registering}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-emerald-600/50 hover:bg-emerald-600/70 text-emerald-100 border border-emerald-400/50 transition-colors disabled:opacity-50"
                      >
                        {registering && isSelected
                          ? "등록 중..."
                          : totalScenes !== undefined && scene.sceneNumber >= totalScenes
                          ? `✓ 이 이미지 사용 (씬 ${scene.sceneNumber} 완료)`
                          : `✓ 이 이미지 사용 → 씬 ${scene.sceneNumber + 1}로 이동`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 오류 메시지 */}
      {registerError && (
        <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-600/30">
          <div className="text-[11px] text-red-400">{registerError}</div>
        </div>
      )}

      {/* ── 핵심 CTA: "이 이미지 사용" 단일 버튼 ── */}
      {canUseImage && (
        <button
          onClick={handleUseThisImage}
          disabled={registering}
          className="w-full py-3 rounded-xl text-sm font-bold bg-emerald-600/50 hover:bg-emerald-600/70 text-emerald-100 border border-emerald-400/60 transition-colors disabled:opacity-50 shadow-lg"
        >
          {registering
            ? "등록 중..."
            : totalScenes !== undefined && scene.sceneNumber >= totalScenes
            ? `✓ 이 이미지 사용 (씬 ${scene.sceneNumber} 완료)`
            : `✓ 이 이미지 사용 → 씬 ${scene.sceneNumber + 1}로 이동`}
        </button>
      )}

      {/* 반려 버튼 (이미지가 있을 때) */}
      {(showReviewPanel || !!selectedFile) && !isAccepted && (
        <button
          onClick={handleReject}
          className="w-full py-1.5 rounded-xl text-[11px] text-red-400 border border-red-600/30 hover:bg-red-900/20 transition-colors"
        >
          ✗ 이 이미지 반려 (재생성)
        </button>
      )}
    </div>
  );
}
