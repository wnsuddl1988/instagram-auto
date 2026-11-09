import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { basename, dirname, join, parse, relative, resolve } from "node:path";

import type { EditorialV2LocalStoreConfiguration } from "./contracts";
import { isEditorialV2PathContained } from "./persistence-data-root";
import { isEditorialV2ProjectId } from "./project-snapshot";
import type {
  VoiceMaterializationPlan,
  VoiceMaterializationScenePlan,
  VoiceMaterializationSet,
  VoiceSceneAudioDescriptor,
  VoiceSceneAudioMetadata,
} from "./voice-materialization-contracts";
import {
  VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES,
  isMaterializationSetId,
  isSceneAudioIdentity,
} from "./voice-materialization-contracts";
import {
  validateVoiceMaterializationSet,
  validateVoiceSceneAudioMetadata,
} from "./voice-materialization-validation";

const MAX_METADATA_BYTES = 2 * 1024 * 1024;
const PROJECTS_DIRECTORY = "projects";

export class VoiceAudioStoreError extends Error {
  constructor(readonly code: string, message = code) {
    super(message);
    this.name = "VoiceAudioStoreError";
  }
}

export interface VoiceSceneAudioWorkspace {
  readonly ttsRoot: string;
  readonly scenesRoot: string;
  readonly workDirectory: string;
  readonly stagedAudioPath: string;
  readonly finalAudioPath: string;
  readonly finalMetadataPath: string;
  readonly projectId: string;
  readonly sceneAudioIdentity: string;
}

export interface VoiceSceneCacheInspection {
  readonly hit: boolean;
  readonly invalidExisting: boolean;
  readonly metadata: VoiceSceneAudioMetadata | null;
  readonly reason: string;
}

async function exists(path: string): Promise<boolean> {
  try { await access(path, fsConstants.F_OK); return true; } catch { return false; }
}

async function assertNoSymlinkOrJunctionSegments(path: string): Promise<void> {
  const resolved = resolve(path);
  const root = parse(resolved).root;
  const segments = relative(root, resolved).split(/[\\/]+/u).filter(Boolean);
  let cursor = root;
  for (const segment of segments) {
    cursor = join(cursor, segment);
    if (!await exists(cursor)) continue;
    const info = await lstat(cursor);
    if (info.isSymbolicLink()) throw new VoiceAudioStoreError("VOICE_STORE_SYMLINK_OR_JUNCTION_FORBIDDEN");
  }
}

function assertConfiguration(configuration: EditorialV2LocalStoreConfiguration): void {
  if (!configuration.enabled) throw new VoiceAudioStoreError("LOCAL_PERSISTENCE_DISABLED");
  if (!configuration.localOnly || configuration.exposeDataRoot) throw new VoiceAudioStoreError("VOICE_STORE_CONFIGURATION_INVALID");
}

function projectAudioPaths(configuration: EditorialV2LocalStoreConfiguration, projectId: string) {
  assertConfiguration(configuration);
  if (!isEditorialV2ProjectId(projectId)) throw new VoiceAudioStoreError("PROJECT_ID_INVALID");
  const projectsRoot = resolve(configuration.dataRoot, PROJECTS_DIRECTORY);
  const projectRoot = resolve(projectsRoot, projectId);
  const ttsRoot = resolve(projectRoot, "audio", "tts");
  const scenesRoot = resolve(ttsRoot, "scenes");
  const setsRoot = resolve(ttsRoot, "sets");
  if (!isEditorialV2PathContained(projectsRoot, projectRoot)
    || !isEditorialV2PathContained(projectRoot, ttsRoot)
    || !isEditorialV2PathContained(ttsRoot, scenesRoot)
    || !isEditorialV2PathContained(ttsRoot, setsRoot)) {
    throw new VoiceAudioStoreError("VOICE_STORE_PATH_ESCAPE_BLOCKED");
  }
  return { projectRoot, ttsRoot, scenesRoot, setsRoot };
}

function scenePaths(configuration: EditorialV2LocalStoreConfiguration, projectId: string, sceneAudioIdentity: string) {
  if (!isSceneAudioIdentity(sceneAudioIdentity)) throw new VoiceAudioStoreError("SCENE_AUDIO_IDENTITY_INVALID");
  const paths = projectAudioPaths(configuration, projectId);
  return {
    ...paths,
    audio: join(paths.scenesRoot, `${sceneAudioIdentity}.mp3`),
    metadata: join(paths.scenesRoot, `${sceneAudioIdentity}.json`),
  };
}

function setPath(configuration: EditorialV2LocalStoreConfiguration, projectId: string, materializationSetId: string): string {
  if (!isMaterializationSetId(materializationSetId)) throw new VoiceAudioStoreError("MATERIALIZATION_SET_ID_INVALID");
  return join(projectAudioPaths(configuration, projectId).setsRoot, `${materializationSetId}.json`);
}

async function sha256File(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function atomicWriteText(path: string, text: string): Promise<void> {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true });
  await assertNoSymlinkOrJunctionSegments(directory);
  const temporaryPath = join(directory, `.${basename(path)}.tmp-${process.pid}-${Date.now()}`);
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(temporaryPath, "wx");
    await handle.writeFile(text, { encoding: "utf8" });
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporaryPath, path);
  } catch (error) {
    if (handle) await handle.close().catch(() => undefined);
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function readJsonFile(path: string): Promise<unknown | null> {
  if (!await exists(path)) return null;
  await assertNoSymlinkOrJunctionSegments(path);
  const info = await stat(path);
  if (!info.isFile() || info.size <= 0 || info.size > MAX_METADATA_BYTES) return null;
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return null; }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function createVoiceSceneAudioWorkspace(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  sceneAudioIdentity: string,
): Promise<VoiceSceneAudioWorkspace> {
  const paths = scenePaths(configuration, projectId, sceneAudioIdentity);
  await assertNoSymlinkOrJunctionSegments(configuration.dataRoot);
  await mkdir(paths.scenesRoot, { recursive: true });
  await mkdir(paths.setsRoot, { recursive: true });
  await assertNoSymlinkOrJunctionSegments(paths.ttsRoot);
  const workDirectory = join(paths.ttsRoot, `.work-${sceneAudioIdentity}-${process.pid}-${Date.now()}`);
  await mkdir(workDirectory, { recursive: false });
  await assertNoSymlinkOrJunctionSegments(workDirectory);
  return {
    ttsRoot: paths.ttsRoot,
    scenesRoot: paths.scenesRoot,
    workDirectory,
    stagedAudioPath: join(workDirectory, "audio.tmp.mp3"),
    finalAudioPath: paths.audio,
    finalMetadataPath: paths.metadata,
    projectId,
    sceneAudioIdentity,
  };
}

export async function stageVoiceSceneAudio(
  workspace: VoiceSceneAudioWorkspace,
  bytes: Uint8Array,
): Promise<void> {
  if (!isEditorialV2PathContained(workspace.workDirectory, workspace.stagedAudioPath)
    || bytes.byteLength <= 0
    || bytes.byteLength > VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES) {
    throw new VoiceAudioStoreError("VOICE_SCENE_STAGE_BOUNDARY_INVALID");
  }
  const handle = await open(workspace.stagedAudioPath, "wx");
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function cleanupVoiceSceneAudioWorkspace(workspace: VoiceSceneAudioWorkspace): Promise<void> {
  if (!basename(workspace.workDirectory).startsWith(".work-tts-")
    || !isEditorialV2PathContained(workspace.ttsRoot, workspace.workDirectory)) {
    throw new VoiceAudioStoreError("VOICE_WORKSPACE_CLEANUP_BOUNDARY_INVALID");
  }
  await rm(workspace.workDirectory, { recursive: true, force: true });
}

export async function readVoiceSceneAudioMetadata(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  sceneAudioIdentity: string,
): Promise<VoiceSceneAudioMetadata | null> {
  const paths = scenePaths(configuration, projectId, sceneAudioIdentity);
  const value = await readJsonFile(paths.metadata);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const metadata = value as VoiceSceneAudioMetadata;
  if (validateVoiceSceneAudioMetadata(metadata).length > 0) return null;
  return clone(metadata);
}

export async function inspectVoiceSceneCache(
  configuration: EditorialV2LocalStoreConfiguration,
  plan: VoiceMaterializationPlan,
  scene: VoiceMaterializationScenePlan,
): Promise<VoiceSceneCacheInspection> {
  const paths = scenePaths(configuration, plan.projectId, scene.sceneAudioIdentity);
  const audioExists = await exists(paths.audio);
  const metadataExists = await exists(paths.metadata);
  const metadata = await readVoiceSceneAudioMetadata(configuration, plan.projectId, scene.sceneAudioIdentity);
  if (!metadata) {
    return {
      hit: false,
      invalidExisting: audioExists || metadataExists,
      metadata: null,
      reason: audioExists || metadataExists ? "invalid_existing_cache" : "cache_missing",
    };
  }
  const identityMatches = metadata.sceneAudioIdentity === scene.sceneAudioIdentity
    && metadata.projectId === plan.projectId
    && metadata.projectRevision === plan.projectRevision
    && metadata.sourceRenderCheckpointHash === plan.sourceRenderCheckpointHash
    && metadata.providerId === plan.providerId
    && metadata.voiceId === plan.voiceId
    && metadata.modelId === plan.modelId
    && metadata.outputFormat === plan.outputFormat
    && metadata.sceneId === scene.sceneId
    && metadata.narrationHash === scene.narrationHash
    && metadata.characterCount === scene.characterCount;
  if (!identityMatches) return { hit: false, invalidExisting: true, metadata: null, reason: "cache_identity_mismatch" };
  if (!audioExists) return { hit: false, invalidExisting: true, metadata: null, reason: "cache_audio_missing" };
  await assertNoSymlinkOrJunctionSegments(paths.audio);
  const info = await stat(paths.audio);
  if (!info.isFile() || info.size !== metadata.audioBytes || info.size <= 0 || info.size > VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES) return { hit: false, invalidExisting: true, metadata: null, reason: "cache_audio_size_invalid" };
  if (await sha256File(paths.audio) !== metadata.audioSha256) return { hit: false, invalidExisting: true, metadata: null, reason: "cache_audio_hash_mismatch" };
  return { hit: true, invalidExisting: false, metadata, reason: "valid_content_addressed_cache" };
}

export async function commitVoiceSceneAudio(
  configuration: EditorialV2LocalStoreConfiguration,
  workspace: VoiceSceneAudioWorkspace,
  metadata: VoiceSceneAudioMetadata,
): Promise<VoiceSceneAudioMetadata> {
  const paths = scenePaths(configuration, metadata.projectId, metadata.sceneAudioIdentity);
  if (workspace.projectId !== metadata.projectId
    || workspace.sceneAudioIdentity !== metadata.sceneAudioIdentity
    || workspace.finalAudioPath !== paths.audio
    || workspace.finalMetadataPath !== paths.metadata
    || !isEditorialV2PathContained(workspace.workDirectory, workspace.stagedAudioPath)) {
    throw new VoiceAudioStoreError("VOICE_SCENE_COMMIT_PATH_INVALID");
  }
  const issues = validateVoiceSceneAudioMetadata(metadata);
  if (issues.length > 0) throw new VoiceAudioStoreError("VOICE_SCENE_METADATA_INVALID", issues.join(","));
  if (await exists(paths.audio) || await exists(paths.metadata)) throw new VoiceAudioStoreError("VOICE_SCENE_IMMUTABLE_CACHE_CONFLICT");
  await assertNoSymlinkOrJunctionSegments(workspace.stagedAudioPath);
  const info = await stat(workspace.stagedAudioPath);
  if (!info.isFile() || info.size !== metadata.audioBytes || await sha256File(workspace.stagedAudioPath) !== metadata.audioSha256) {
    throw new VoiceAudioStoreError("VOICE_SCENE_STAGED_AUDIO_MISMATCH");
  }
  await rename(workspace.stagedAudioPath, paths.audio);
  try {
    await atomicWriteText(paths.metadata, `${JSON.stringify(metadata, null, 2)}\n`);
  } catch (error) {
    await rm(paths.audio, { force: true }).catch(() => undefined);
    throw error;
  }
  return clone(metadata);
}

export async function writeVoiceMaterializationSet(
  configuration: EditorialV2LocalStoreConfiguration,
  set: VoiceMaterializationSet,
): Promise<VoiceMaterializationSet> {
  const issues = validateVoiceMaterializationSet(set);
  if (issues.length > 0) throw new VoiceAudioStoreError("VOICE_MATERIALIZATION_SET_INVALID", issues.join(","));
  const path = setPath(configuration, set.projectId, set.materializationSetId);
  await atomicWriteText(path, `${JSON.stringify(set, null, 2)}\n`);
  return clone(set);
}

export async function readVoiceMaterializationSet(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  materializationSetId: string,
): Promise<VoiceMaterializationSet | null> {
  const value = await readJsonFile(setPath(configuration, projectId, materializationSetId));
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const set = value as VoiceMaterializationSet;
  return validateVoiceMaterializationSet(set).length === 0 ? clone(set) : null;
}

export async function readLatestVoiceMaterializationSet(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<VoiceMaterializationSet | null> {
  const { setsRoot } = projectAudioPaths(configuration, projectId);
  if (!await exists(setsRoot)) return null;
  await assertNoSymlinkOrJunctionSegments(setsRoot);
  const candidates: VoiceMaterializationSet[] = [];
  for (const entry of await readdir(setsRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const setId = entry.name.slice(0, -5);
    if (!isMaterializationSetId(setId)) continue;
    const set = await readVoiceMaterializationSet(configuration, projectId, setId);
    if (set) candidates.push(set);
  }
  return candidates.sort((left, right) => right.updatedAtIso.localeCompare(left.updatedAtIso) || right.materializationSetId.localeCompare(left.materializationSetId))[0] ?? null;
}

export async function readVoiceSceneAudioDescriptor(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  sceneAudioIdentity: string,
): Promise<VoiceSceneAudioDescriptor> {
  const metadata = await readVoiceSceneAudioMetadata(configuration, projectId, sceneAudioIdentity);
  if (!metadata) throw new VoiceAudioStoreError("VOICE_SCENE_AUDIO_NOT_FOUND_OR_INVALID");
  const paths = scenePaths(configuration, projectId, sceneAudioIdentity);
  const info = await stat(paths.audio);
  if (!info.isFile() || info.size !== metadata.audioBytes || await sha256File(paths.audio) !== metadata.audioSha256) throw new VoiceAudioStoreError("VOICE_SCENE_AUDIO_NOT_FOUND_OR_INVALID");
  return { sceneAudioIdentity, mediaPath: paths.audio, contentType: "audio/mpeg", audioBytes: metadata.audioBytes, audioSha256: metadata.audioSha256 };
}

export async function readVoiceSceneAudioBytes(descriptor: VoiceSceneAudioDescriptor): Promise<Uint8Array> {
  const bytes = await readFile(descriptor.mediaPath);
  if (bytes.byteLength !== descriptor.audioBytes || createHash("sha256").update(bytes).digest("hex") !== descriptor.audioSha256) throw new VoiceAudioStoreError("VOICE_SCENE_AUDIO_BYTES_MISMATCH");
  return new Uint8Array(bytes);
}
