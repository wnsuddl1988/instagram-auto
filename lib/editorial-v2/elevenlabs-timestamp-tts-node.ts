import { Buffer } from "node:buffer";

import type {
  ElevenLabsTimestampTtsResult,
  SanitizedElevenLabsProviderError,
} from "./voice-materialization-contracts";
import {
  ELEVENLABS_API_ORIGIN,
  ELEVENLABS_MAX_RESPONSE_JSON_BYTES,
  ELEVENLABS_OUTPUT_FORMAT,
  ELEVENLABS_PROVIDER_ERROR_LONG_FIELD_MAX_LENGTH,
  ELEVENLABS_PROVIDER_ERROR_MESSAGE_MAX_LENGTH,
  ELEVENLABS_PROVIDER_ERROR_SHORT_FIELD_MAX_LENGTH,
  PROVIDER_ERROR_DETAIL_UNAVAILABLE,
  VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES,
  VOICE_MATERIALIZATION_PROVIDER_ID,
  isVoiceMaterializationIdentifier,
} from "./voice-materialization-contracts";
import { validateProviderCharacterAlignment } from "./voice-materialization-validation";

export interface ElevenLabsTimestampTtsRequest {
  readonly voiceId: string;
  readonly modelId: string;
  readonly narration: string;
  readonly apiKey: string;
  readonly fetchImpl?: typeof globalThis.fetch;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

const STRICT_BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const CREDENTIAL_ASSIGNMENT_PATTERN = /\b(?:xi-api-key|authorization|api[_-]?key|secret|token)\b\s*[:=]\s*(?:bearer\s+)?[^\s,;}\]]+/giu;
const BEARER_CREDENTIAL_PATTERN = /\bbearer\s+[A-Za-z0-9._~+/=-]{4,}/giu;
const OBVIOUS_SECRET_TOKEN_PATTERN = /\b(?:sk|xi|token|secret)[_-][A-Za-z0-9_-]{8,}\b/giu;

function redactCredentialMaterial(value: string, apiKey: string): string {
  let redacted = apiKey ? value.replaceAll(apiKey, "[REDACTED]") : value;
  redacted = redacted.replace(CREDENTIAL_ASSIGNMENT_PATTERN, "[REDACTED]");
  redacted = redacted.replace(BEARER_CREDENTIAL_PATTERN, "[REDACTED]");
  return redacted.replace(OBVIOUS_SECRET_TOKEN_PATTERN, "[REDACTED]");
}

function boundedProviderField(
  value: unknown,
  maximumLength: number,
  apiKey: string,
): { readonly value: string | null; readonly truncated: boolean } {
  if (typeof value !== "string") return { value: null, truncated: false };
  const redacted = redactCredentialMaterial(value, apiKey);
  return {
    value: redacted.slice(0, maximumLength),
    truncated: redacted.length > maximumLength,
  };
}

function unavailableProviderError(
  httpStatus: number,
  truncated = false,
): SanitizedElevenLabsProviderError {
  return {
    provider: VOICE_MATERIALIZATION_PROVIDER_ID,
    httpStatus,
    type: null,
    code: PROVIDER_ERROR_DETAIL_UNAVAILABLE,
    message: PROVIDER_ERROR_DETAIL_UNAVAILABLE,
    param: null,
    requestId: null,
    legacyStatus: null,
    truncated,
  };
}

export function sanitizeElevenLabsProviderErrorPayload(
  payload: unknown,
  httpStatus: number,
  apiKey: string,
): SanitizedElevenLabsProviderError {
  if (!isRecord(payload) || !isRecord(payload.detail)) return unavailableProviderError(httpStatus);
  const detail = payload.detail;
  const type = boundedProviderField(detail.type, ELEVENLABS_PROVIDER_ERROR_SHORT_FIELD_MAX_LENGTH, apiKey);
  const code = boundedProviderField(detail.code, ELEVENLABS_PROVIDER_ERROR_SHORT_FIELD_MAX_LENGTH, apiKey);
  const message = boundedProviderField(detail.message, ELEVENLABS_PROVIDER_ERROR_MESSAGE_MAX_LENGTH, apiKey);
  const param = boundedProviderField(detail.param, ELEVENLABS_PROVIDER_ERROR_LONG_FIELD_MAX_LENGTH, apiKey);
  const requestId = boundedProviderField(detail.request_id, ELEVENLABS_PROVIDER_ERROR_LONG_FIELD_MAX_LENGTH, apiKey);
  const legacyStatus = boundedProviderField(detail.status, ELEVENLABS_PROVIDER_ERROR_SHORT_FIELD_MAX_LENGTH, apiKey);
  if (![type, code, message, param, requestId, legacyStatus].some((field) => field.value !== null)) {
    return unavailableProviderError(httpStatus);
  }
  return {
    provider: VOICE_MATERIALIZATION_PROVIDER_ID,
    httpStatus,
    type: type.value,
    code: code.value ?? PROVIDER_ERROR_DETAIL_UNAVAILABLE,
    message: message.value ?? PROVIDER_ERROR_DETAIL_UNAVAILABLE,
    param: param.value,
    requestId: requestId.value,
    legacyStatus: legacyStatus.value,
    truncated: [type, code, message, param, requestId, legacyStatus].some((field) => field.truncated),
  };
}

export class ElevenLabsProviderHttpError extends Error {
  readonly providerError: SanitizedElevenLabsProviderError;

  constructor(providerError: SanitizedElevenLabsProviderError) {
    super(`ELEVENLABS_HTTP_${providerError.httpStatus}`);
    this.name = "ElevenLabsProviderHttpError";
    this.providerError = providerError;
  }
}

async function readBoundedJsonText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > ELEVENLABS_MAX_RESPONSE_JSON_BYTES) {
    throw new Error("ELEVENLABS_RESPONSE_JSON_TOO_LARGE");
  }
  if (!response.body) throw new Error("ELEVENLABS_RESPONSE_BODY_MISSING");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > ELEVENLABS_MAX_RESPONSE_JSON_BYTES) {
        await reader.cancel("ELEVENLABS_RESPONSE_JSON_TOO_LARGE");
        throw new Error("ELEVENLABS_RESPONSE_JSON_TOO_LARGE");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("ELEVENLABS_RESPONSE_UTF8_INVALID");
  }
}

function decodeStrictBase64(value: unknown): Uint8Array {
  if (typeof value !== "string" || value.length === 0 || !STRICT_BASE64.test(value) || value.length % 4 !== 0) {
    throw new Error("ELEVENLABS_AUDIO_BASE64_INVALID");
  }
  const maximumDecodedBytes = Math.floor(value.length / 4) * 3;
  if (maximumDecodedBytes > VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES + 2) {
    throw new Error("ELEVENLABS_AUDIO_TOO_LARGE");
  }
  const decoded = Buffer.from(value, "base64");
  if (decoded.byteLength === 0) throw new Error("ELEVENLABS_AUDIO_EMPTY");
  if (decoded.byteLength > VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES) throw new Error("ELEVENLABS_AUDIO_TOO_LARGE");
  if (decoded.toString("base64") !== value) throw new Error("ELEVENLABS_AUDIO_BASE64_NON_CANONICAL");
  return new Uint8Array(decoded);
}

export function buildElevenLabsTimestampEndpoint(voiceId: string): string {
  if (!isVoiceMaterializationIdentifier(voiceId)) throw new Error("ELEVENLABS_VOICE_ID_INVALID");
  return `${ELEVENLABS_API_ORIGIN}/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${ELEVENLABS_OUTPUT_FORMAT}`;
}

export async function requestElevenLabsTimestampTts(
  request: ElevenLabsTimestampTtsRequest,
): Promise<ElevenLabsTimestampTtsResult> {
  if (!isVoiceMaterializationIdentifier(request.voiceId)) throw new Error("ELEVENLABS_VOICE_ID_INVALID");
  if (!isVoiceMaterializationIdentifier(request.modelId)) throw new Error("ELEVENLABS_MODEL_ID_INVALID");
  if (!request.narration || request.narration.length > 10_000) throw new Error("ELEVENLABS_NARRATION_INVALID");
  if (typeof request.apiKey !== "string" || request.apiKey.length === 0) throw new Error("ELEVENLABS_CREDENTIAL_MISSING");
  const fetchImpl = request.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new Error("ELEVENLABS_FETCH_UNAVAILABLE");
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort("ELEVENLABS_REQUEST_TIMEOUT"), request.timeoutMs ?? 30_000);
  const forwardAbort = () => controller.abort(request.signal?.reason ?? "ELEVENLABS_REQUEST_ABORTED");
  request.signal?.addEventListener("abort", forwardAbort, { once: true });
  try {
    const response = await fetchImpl(buildElevenLabsTimestampEndpoint(request.voiceId), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "xi-api-key": request.apiKey,
      },
      body: JSON.stringify({ text: request.narration, model_id: request.modelId }),
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      let providerError: SanitizedElevenLabsProviderError;
      try {
        const errorText = await readBoundedJsonText(response);
        let errorPayload: unknown;
        try {
          errorPayload = JSON.parse(errorText);
        } catch {
          throw new Error("ELEVENLABS_ERROR_RESPONSE_JSON_INVALID");
        }
        providerError = sanitizeElevenLabsProviderErrorPayload(errorPayload, response.status, request.apiKey);
      } catch (error) {
        const truncated = error instanceof Error && error.message === "ELEVENLABS_RESPONSE_JSON_TOO_LARGE";
        providerError = unavailableProviderError(response.status, truncated);
      }
      throw new ElevenLabsProviderHttpError(providerError);
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) throw new Error("ELEVENLABS_RESPONSE_CONTENT_TYPE_INVALID");
    const text = await readBoundedJsonText(response);
    let payload: unknown;
    try { payload = JSON.parse(text); } catch { throw new Error("ELEVENLABS_RESPONSE_JSON_INVALID"); }
    if (!isRecord(payload)) throw new Error("ELEVENLABS_RESPONSE_OBJECT_REQUIRED");
    const audio = decodeStrictBase64(payload.audio_base64);
    const normalizedAlignmentPresent = payload.normalized_alignment !== undefined && payload.normalized_alignment !== null;
    const alignmentValidation = validateProviderCharacterAlignment(payload.alignment, request.narration, normalizedAlignmentPresent);
    if (!alignmentValidation.structurallyValid) throw new Error(`ELEVENLABS_ALIGNMENT_INVALID:${alignmentValidation.issues.join(",")}`);
    return {
      audio,
      alignmentValidation,
      providerId: VOICE_MATERIALIZATION_PROVIDER_ID,
      outputFormat: ELEVENLABS_OUTPUT_FORMAT,
      normalizedAlignmentPresent,
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("ELEVENLABS_REQUEST_ABORTED_OR_TIMEOUT");
    if (error instanceof Error && error.message.startsWith("ELEVENLABS_")) throw error;
    throw new Error("ELEVENLABS_REQUEST_FAILED");
  } finally {
    globalThis.clearTimeout(timeout);
    request.signal?.removeEventListener("abort", forwardAbort);
  }
}
