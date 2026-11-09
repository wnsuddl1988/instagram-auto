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
import type {
  LocalPreviewCacheResult,
  LocalPreviewMediaDescriptor,
  LocalPreviewRenderIdentity,
  LocalPreviewRenderMetadata,
} from "./local-preview-contracts";
import { LOCAL_PREVIEW_MAX_OUTPUT_BYTES } from "./local-preview-contracts";
import { isEditorialV2PathContained } from "./persistence-data-root";
import { isEditorialV2ProjectId } from "./project-snapshot";
import { validateLocalPreviewOutput } from "./local-preview-validation";

const PROJECTS_DIRECTORY = "projects";
const RENDERS_DIRECTORY = "renders";
const PREVIEW_DIRECTORY = "preview";
const MEDIA_FILE = "preview.mp4";
const METADATA_FILE = "metadata.json";

export class LocalPreviewStoreError extends Error {
  constructor(readonly code: string, message = code) {
    super(message);
    this.name = "LocalPreviewStoreError";
  }
}

export interface LocalPreviewWorkspace {
  readonly renderDirectory: string;
  readonly workDirectory: string;
  readonly frameDirectory: string;
  readonly mediaTemporaryPath: string;
  readonly subtitlePath: string;
  readonly concatPath: string;
}

function isRenderId(value: string): boolean {
  return /^preview-[a-f0-9]{40}$/u.test(value);
}

async function exists(path: string): Promise<boolean> {
  try { await access(path, fsConstants.F_OK); return true; } catch { return false; }
}

async function assertNoSymlinkSegments(path: string): Promise<void> {
  const resolved = resolve(path);
  const root = parse(resolved).root;
  const segments = relative(root, resolved).split(/[\\/]+/u).filter(Boolean);
  let cursor = root;
  for (const segment of segments) {
    cursor = join(cursor, segment);
    if (!await exists(cursor)) continue;
    const info = await lstat(cursor);
    if (info.isSymbolicLink()) throw new LocalPreviewStoreError("PREVIEW_SYMLINK_OR_JUNCTION_FORBIDDEN");
  }
}

function assertConfiguration(configuration: EditorialV2LocalStoreConfiguration): void {
  if (!configuration.enabled) throw new LocalPreviewStoreError("LOCAL_PERSISTENCE_DISABLED");
  if (!configuration.localOnly || configuration.exposeDataRoot) throw new LocalPreviewStoreError("PREVIEW_STORE_CONFIGURATION_INVALID");
}

function previewPaths(configuration: EditorialV2LocalStoreConfiguration, identity: LocalPreviewRenderIdentity) {
  assertConfiguration(configuration);
  if (!isEditorialV2ProjectId(identity.projectId)) throw new LocalPreviewStoreError("PROJECT_ID_INVALID");
  if (!isRenderId(identity.renderId)) throw new LocalPreviewStoreError("PREVIEW_RENDER_ID_INVALID");
  const projectsRoot = resolve(configuration.dataRoot, PROJECTS_DIRECTORY);
  const projectRoot = resolve(projectsRoot, identity.projectId);
  const previewRoot = resolve(projectRoot, RENDERS_DIRECTORY, PREVIEW_DIRECTORY);
  const renderDirectory = resolve(previewRoot, identity.renderId);
  if (!isEditorialV2PathContained(projectsRoot, projectRoot) || !isEditorialV2PathContained(projectRoot, renderDirectory)) throw new LocalPreviewStoreError("PREVIEW_PROJECT_PATH_ESCAPE_BLOCKED");
  return {
    projectRoot,
    previewRoot,
    renderDirectory,
    media: join(renderDirectory, MEDIA_FILE),
    metadata: join(renderDirectory, METADATA_FILE),
  };
}

function identityForPath(projectId: string, renderId: string): LocalPreviewRenderIdentity {
  return { renderId, projectId, renderInputHash: "0".repeat(64), projectRevision: 0, renderCheckpointHash: "0".repeat(64), profile: "preview_540x960" };
}

async function sha256File(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function atomicWriteText(path: string, text: string): Promise<void> {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true });
  await assertNoSymlinkSegments(directory);
  const temporary = join(directory, `.${basename(path)}.tmp-${process.pid}-${Date.now()}`);
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(temporary, "wx");
    await handle.writeFile(text, { encoding: "utf8" });
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, path);
  } catch (error) {
    if (handle) await handle.close().catch(() => undefined);
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

function parseMetadata(value: unknown): LocalPreviewRenderMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const metadata = value as LocalPreviewRenderMetadata;
  if (metadata.schemaVersion !== "local-preview-metadata-v1" || metadata.status !== "completed" || !isRenderId(metadata.renderId)) return null;
  if (!metadata.probe || validateLocalPreviewOutput(metadata).some((entry) => entry.blocking)) return null;
  return JSON.parse(JSON.stringify(metadata)) as LocalPreviewRenderMetadata;
}

export async function createLocalPreviewWorkspace(
  configuration: EditorialV2LocalStoreConfiguration,
  identity: LocalPreviewRenderIdentity,
): Promise<LocalPreviewWorkspace> {
  const paths = previewPaths(configuration, identity);
  await assertNoSymlinkSegments(configuration.dataRoot);
  await mkdir(paths.renderDirectory, { recursive: true });
  await assertNoSymlinkSegments(paths.renderDirectory);
  const workDirectory = join(paths.renderDirectory, `.work-${process.pid}-${Date.now()}`);
  const frameDirectory = join(workDirectory, "frames");
  await mkdir(frameDirectory, { recursive: true });
  await assertNoSymlinkSegments(workDirectory);
  return {
    renderDirectory: paths.renderDirectory,
    workDirectory,
    frameDirectory,
    mediaTemporaryPath: join(workDirectory, "preview.tmp.mp4"),
    subtitlePath: join(workDirectory, "estimated-subtitles.srt"),
    concatPath: join(workDirectory, "frames.ffconcat"),
  };
}

export async function cleanupLocalPreviewWorkspace(workspace: LocalPreviewWorkspace): Promise<void> {
  if (!basename(workspace.workDirectory).startsWith(".work-") || !isEditorialV2PathContained(workspace.renderDirectory, workspace.workDirectory)) throw new LocalPreviewStoreError("PREVIEW_WORKSPACE_CLEANUP_BOUNDARY_INVALID");
  await rm(workspace.workDirectory, { recursive: true, force: true });
}

export async function readLocalPreviewMetadata(
  configuration: EditorialV2LocalStoreConfiguration,
  identity: LocalPreviewRenderIdentity,
): Promise<LocalPreviewRenderMetadata | null> {
  const paths = previewPaths(configuration, identity);
  if (!await exists(paths.metadata)) return null;
  await assertNoSymlinkSegments(paths.metadata);
  const info = await stat(paths.metadata);
  if (!info.isFile() || info.size <= 0 || info.size > 1_048_576) return null;
  try { return parseMetadata(JSON.parse(await readFile(paths.metadata, "utf8"))); } catch { return null; }
}

export async function readLocalPreviewMetadataByRenderId(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  renderId: string,
): Promise<LocalPreviewRenderMetadata | null> {
  return readLocalPreviewMetadata(configuration, identityForPath(projectId, renderId));
}

export async function readLatestLocalPreviewMetadata(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<LocalPreviewRenderMetadata | null> {
  const probeIdentity = identityForPath(projectId, `preview-${"0".repeat(40)}`);
  const { previewRoot } = previewPaths(configuration, probeIdentity);
  if (!await exists(previewRoot)) return null;
  await assertNoSymlinkSegments(previewRoot);
  const candidates: LocalPreviewRenderMetadata[] = [];
  for (const entry of await readdir(previewRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !isRenderId(entry.name)) continue;
    const metadata = await readLocalPreviewMetadataByRenderId(configuration, projectId, entry.name);
    if (metadata) candidates.push(metadata);
  }
  return candidates.sort((left, right) => right.completedAtIso.localeCompare(left.completedAtIso) || right.renderId.localeCompare(left.renderId))[0] ?? null;
}

export async function inspectLocalPreviewCache(
  configuration: EditorialV2LocalStoreConfiguration,
  identity: LocalPreviewRenderIdentity,
): Promise<LocalPreviewCacheResult> {
  const paths = previewPaths(configuration, identity);
  const metadata = await readLocalPreviewMetadata(configuration, identity);
  if (!metadata) return { hit: false, identity, metadata: null, reason: "metadata_missing_or_invalid" };
  if (metadata.renderId !== identity.renderId || metadata.renderInputHash !== identity.renderInputHash || metadata.projectId !== identity.projectId || metadata.projectRevision !== identity.projectRevision || metadata.renderCheckpointHash !== identity.renderCheckpointHash || metadata.profile !== identity.profile) return { hit: false, identity, metadata: null, reason: "cache_identity_mismatch" };
  if (!await exists(paths.media)) return { hit: false, identity, metadata: null, reason: "media_missing" };
  await assertNoSymlinkSegments(paths.media);
  const info = await stat(paths.media);
  if (!info.isFile() || info.size <= 0 || info.size > LOCAL_PREVIEW_MAX_OUTPUT_BYTES || info.size !== metadata.outputBytes) return { hit: false, identity, metadata: null, reason: "media_size_invalid" };
  if (await sha256File(paths.media) !== metadata.outputSha256) return { hit: false, identity, metadata: null, reason: "media_hash_mismatch" };
  return { hit: true, identity, metadata, reason: "valid_cache_reused" };
}

export async function commitLocalPreviewOutput(
  configuration: EditorialV2LocalStoreConfiguration,
  identity: LocalPreviewRenderIdentity,
  workspace: LocalPreviewWorkspace,
  metadataWithoutOutput: Omit<LocalPreviewRenderMetadata, "outputSha256" | "outputBytes">,
): Promise<LocalPreviewRenderMetadata> {
  const paths = previewPaths(configuration, identity);
  if (workspace.renderDirectory !== paths.renderDirectory || !isEditorialV2PathContained(paths.renderDirectory, workspace.mediaTemporaryPath)) throw new LocalPreviewStoreError("PREVIEW_OUTPUT_PATH_INVALID");
  await assertNoSymlinkSegments(workspace.mediaTemporaryPath);
  const info = await stat(workspace.mediaTemporaryPath);
  if (!info.isFile() || info.size <= 0 || info.size > LOCAL_PREVIEW_MAX_OUTPUT_BYTES) throw new LocalPreviewStoreError("PREVIEW_OUTPUT_SIZE_INVALID");
  const outputSha256 = await sha256File(workspace.mediaTemporaryPath);
  const metadata: LocalPreviewRenderMetadata = { ...metadataWithoutOutput, outputSha256, outputBytes: info.size };
  const validation = validateLocalPreviewOutput(metadata);
  if (validation.some((entry) => entry.blocking)) throw new LocalPreviewStoreError("PREVIEW_OUTPUT_VALIDATION_FAILED", validation.map((entry) => entry.code).join(","));
  await rename(workspace.mediaTemporaryPath, paths.media);
  await atomicWriteText(paths.metadata, `${JSON.stringify(metadata, null, 2)}\n`);
  return JSON.parse(JSON.stringify(metadata)) as LocalPreviewRenderMetadata;
}

export async function readLocalPreviewMediaDescriptor(
  configuration: EditorialV2LocalStoreConfiguration,
  identity: LocalPreviewRenderIdentity,
): Promise<LocalPreviewMediaDescriptor> {
  const cache = await inspectLocalPreviewCache(configuration, identity);
  if (!cache.hit || !cache.metadata) throw new LocalPreviewStoreError("PREVIEW_MEDIA_NOT_FOUND_OR_INVALID");
  const paths = previewPaths(configuration, identity);
  return { renderId: identity.renderId, mediaPath: paths.media, contentType: "video/mp4", outputBytes: cache.metadata.outputBytes, outputSha256: cache.metadata.outputSha256 };
}

export async function readLocalPreviewMediaDescriptorByRenderId(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  renderId: string,
): Promise<LocalPreviewMediaDescriptor> {
  const metadata = await readLocalPreviewMetadataByRenderId(configuration, projectId, renderId);
  if (!metadata) throw new LocalPreviewStoreError("PREVIEW_MEDIA_NOT_FOUND_OR_INVALID");
  const identity: LocalPreviewRenderIdentity = {
    renderId: metadata.renderId,
    renderInputHash: metadata.renderInputHash,
    projectId: metadata.projectId,
    projectRevision: metadata.projectRevision,
    renderCheckpointHash: metadata.renderCheckpointHash,
    profile: metadata.profile,
  };
  return readLocalPreviewMediaDescriptor(configuration, identity);
}
