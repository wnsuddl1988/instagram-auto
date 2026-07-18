import { createHash } from "node:crypto";
import * as nodeFs from "node:fs";
import { basename, dirname } from "node:path";

const SHA256_RE = /^[a-f0-9]{64}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readBytes(fsImpl, path) {
  const value = fsImpl.readFileSync(path);
  return Buffer.isBuffer(value)
    ? value
    : Buffer.from(String(value), "utf8");
}

function inspectOrphanMarkers(fsImpl, path) {
  const directory = dirname(path);
  const canonicalName = basename(path);
  const markerPrefix = `${canonicalName}.`;
  try {
    const entries = fsImpl.readdirSync(directory);
    return {
      ok: true,
      present: entries.some(
        (entry) =>
          typeof entry === "string" &&
          entry.startsWith(markerPrefix) &&
          (entry.endsWith(".prepared") ||
            entry.endsWith(".committed-source")),
      ),
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      error.code === "ENOENT"
    ) {
      return {
        ok: true,
        present: false,
      };
    }
    return {
      ok: false,
      present: false,
    };
  }
}

/**
 * Writes one immutable Owner reconciliation file.
 * Bytes are first written and fsynced through an exclusive prepared path.
 * Only then does an exclusive hard-link publish the canonical path. Therefore
 * write/fsync failure can never create an applicable canonical resolution.
 * Prepared/committed source evidence is preserved instead of deleted.
 * No cleanup, network, environment, credential, upload, or platform action.
 */
export function writeMoneyShortsPublishOwnerReconciliationOnce({
  path,
  evidence,
  fsImpl = nodeFs,
}) {
  if (
    typeof path !== "string" ||
    path.length === 0 ||
    typeof evidence !== "object" ||
    evidence === null ||
    !SHA256_RE.test(
      String(evidence.resolutionFingerprint ?? ""),
    )
  ) {
    return {
      ok: false,
      reason: "owner_reconciliation_write_input_invalid",
    };
  }
  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  const expectedSha256 = sha256(serialized);
  const preparedPath =
    `${path}.${evidence.resolutionFingerprint}.prepared`;
  const committedSourcePath =
    `${path}.${evidence.resolutionFingerprint}.committed-source`;
  const inspectExisting = () => {
    try {
      const bytes = readBytes(fsImpl, path);
      const existingSha256 = sha256(bytes);
      const parsed = JSON.parse(bytes.toString("utf8"));
      if (
        existingSha256 === expectedSha256 &&
        parsed?.resolutionFingerprint ===
          evidence.resolutionFingerprint
      ) {
        return {
          ok: true,
          alreadyExists: true,
          sha256: existingSha256,
        };
      }
      return {
        ok: false,
        reason: "owner_reconciliation_existing_conflict",
      };
    } catch {
      return {
        ok: false,
        reason: "owner_reconciliation_existing_unreadable",
      };
    }
  };
  if (fsImpl.existsSync(path)) {
    return inspectExisting();
  }
  const orphanMarkers = inspectOrphanMarkers(fsImpl, path);
  if (orphanMarkers.ok !== true) {
    return {
      ok: false,
      reason:
        "owner_reconciliation_marker_directory_unreadable",
    };
  }
  if (orphanMarkers.present === true) {
    return {
      ok: false,
      reason:
        "owner_reconciliation_prepared_orphan_requires_manual_review",
    };
  }
  try {
    fsImpl.mkdirSync(dirname(path), { recursive: true });
    const fd = fsImpl.openSync(preparedPath, "wx");
    try {
      fsImpl.writeFileSync(fd, serialized, "utf8");
      fsImpl.fsyncSync(fd);
    } finally {
      fsImpl.closeSync(fd);
    }
    fsImpl.linkSync(preparedPath, path);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      error.code === "EEXIST" &&
      fsImpl.existsSync(path)
    ) {
      return inspectExisting();
    }
    return {
      ok: false,
      reason: "owner_reconciliation_write_failed",
    };
  }
  try {
    fsImpl.renameSync(preparedPath, committedSourcePath);
  } catch {
    // Canonical hard-link already exists and is immutable. The prepared source
    // remains as durable audit evidence if this cosmetic rename fails.
  }
  try {
    const bytes = readBytes(fsImpl, path);
    const actualSha256 = sha256(bytes);
    if (actualSha256 !== expectedSha256) {
      return {
        ok: false,
        reason: "owner_reconciliation_readback_mismatch",
      };
    }
    return {
      ok: true,
      alreadyExists: false,
      sha256: actualSha256,
    };
  } catch {
    return {
      ok: false,
      reason: "owner_reconciliation_readback_failed",
    };
  }
}
