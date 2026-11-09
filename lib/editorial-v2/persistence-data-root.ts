import { homedir, platform as currentPlatform } from "node:os";
import { isAbsolute, join, parse, relative, resolve } from "node:path";

import type { EditorialV2LocalStoreConfiguration } from "./contracts";
import {
  EDITORIAL_V2_PERSISTENCE_NAMESPACE,
  EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION,
  SHORTS_EDITORIAL_OS_V2_DATA_ROOT,
  isEditorialV2LocalPersistenceEnabled,
} from "./persistence-contracts";

const V1_FORBIDDEN_ROOT = "C:\\tmp\\money-shorts-os";

export interface EditorialV2DataRootResolutionOptions {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly repositoryRoot?: string;
  readonly workingDirectory?: string;
  readonly homeDirectory?: string;
  readonly platform?: NodeJS.Platform;
  readonly syntheticProbe?: boolean;
}

function normalizedComparisonPath(value: string): string {
  const normalized = resolve(value);
  return currentPlatform() === "win32" ? normalized.toLowerCase() : normalized;
}

export function isEditorialV2PathContained(root: string, candidate: string): boolean {
  const normalizedRoot = normalizedComparisonPath(root);
  const normalizedCandidate = normalizedComparisonPath(candidate);
  const child = relative(normalizedRoot, normalizedCandidate);
  return child === "" || (!child.startsWith("..") && !isAbsolute(child));
}

export function assertEditorialV2SafeDataRoot(
  candidate: string,
  repositoryRoot: string,
  workingDirectory: string,
): string {
  if (!candidate || candidate.includes("\0")) throw new Error("INVALID_DATA_ROOT");
  if (!isAbsolute(candidate)) throw new Error("DATA_ROOT_MUST_BE_ABSOLUTE");
  const resolvedCandidate = resolve(candidate);
  const root = parse(resolvedCandidate).root;
  if (resolvedCandidate === root) throw new Error("DATA_ROOT_MUST_NOT_BE_FILESYSTEM_ROOT");
  const resolvedRepository = resolve(repositoryRoot);
  const resolvedWorkingDirectory = resolve(workingDirectory);
  if (isEditorialV2PathContained(resolvedRepository, resolvedCandidate)
    || isEditorialV2PathContained(resolvedCandidate, resolvedRepository)) {
    throw new Error("DATA_ROOT_REPOSITORY_OVERLAP");
  }
  if (normalizedComparisonPath(resolvedCandidate) === normalizedComparisonPath(resolvedWorkingDirectory)) {
    throw new Error("DATA_ROOT_WORKING_DIRECTORY_FORBIDDEN");
  }
  if (isEditorialV2PathContained(V1_FORBIDDEN_ROOT, resolvedCandidate)
    || isEditorialV2PathContained(resolvedCandidate, V1_FORBIDDEN_ROOT)) {
    throw new Error("DATA_ROOT_V1_OVERLAP");
  }
  return resolvedCandidate;
}

export function resolveEditorialV2LocalStoreConfiguration(
  options: EditorialV2DataRootResolutionOptions = {},
): EditorialV2LocalStoreConfiguration {
  const env = options.env ?? process.env;
  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  const workingDirectory = options.workingDirectory ?? process.cwd();
  const platform = options.platform ?? currentPlatform();
  const homeDirectory = options.homeDirectory ?? homedir();
  const override = env[SHORTS_EDITORIAL_OS_V2_DATA_ROOT];
  let candidate: string;
  let dataRootKind: EditorialV2LocalStoreConfiguration["dataRootKind"];

  if (override !== undefined) {
    candidate = override;
    dataRootKind = options.syntheticProbe ? "synthetic_probe" : "environment_override";
  } else if (platform === "win32") {
    // Windows default: %LOCALAPPDATA%\ShortsEditorialOSV2 (never C:\tmp).
    const localApplicationData = env.LOCALAPPDATA || join(homeDirectory, "AppData", "Local");
    candidate = join(localApplicationData, "ShortsEditorialOSV2");
    dataRootKind = "os_application_data";
  } else {
    candidate = join(homeDirectory, ".local", "share", "ShortsEditorialOSV2");
    dataRootKind = "os_application_data";
  }

  return {
    enabled: isEditorialV2LocalPersistenceEnabled(env),
    namespace: EDITORIAL_V2_PERSISTENCE_NAMESPACE,
    schemaVersion: EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION,
    dataRoot: assertEditorialV2SafeDataRoot(candidate, repositoryRoot, workingDirectory),
    dataRootKind,
    localOnly: true,
    exposeDataRoot: false,
  };
}
