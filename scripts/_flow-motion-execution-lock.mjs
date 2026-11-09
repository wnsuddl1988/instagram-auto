import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const LOCK_FILE_NAME = "flow-motion-global-execution.lock.json";

function readLock(lockPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function executionLeaseEndpoint(outputRoot) {
  const key = createHash("sha256")
    .update(path.resolve(outputRoot).toLowerCase())
    .digest("hex")
    .slice(0, 32);
  return process.platform === "win32"
    ? `\\\\.\\pipe\\instagram-auto-flow-motion-${key}`
    : `\0instagram-auto-flow-motion-${key}`;
}

function writeLockRecordAtomic(lockPath, record) {
  const tempPath = `${lockPath}.${record.token}.${process.pid}.tmp`;
  let descriptor = null;
  try {
    descriptor = fs.openSync(tempPath, "wx");
    fs.writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = null;
    fs.renameSync(tempPath, lockPath);
  } finally {
    if (descriptor !== null) fs.closeSync(descriptor);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

async function acquireExclusiveProcessLease(endpoint) {
  const server = net.createServer((socket) => socket.destroy());
  try {
    await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      server.once("error", onError);
      server.listen(endpoint, () => {
        server.off("error", onError);
        resolve();
      });
    });
    return server;
  } catch (error) {
    server.close();
    throw error;
  }
}

function closeLease(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

export async function acquireFlowMotionExecutionLock(outputRoot, { attemptId, jobId }) {
  fs.mkdirSync(outputRoot, { recursive: true });
  const lockPath = path.join(outputRoot, LOCK_FILE_NAME);
  const leaseEndpoint = executionLeaseEndpoint(outputRoot);
  let server;
  try {
    server = await acquireExclusiveProcessLease(leaseEndpoint);
  } catch (error) {
    if (error?.code !== "EADDRINUSE") throw error;
    const existing = readLock(lockPath);
    throw new Error(`flow_motion_execution_lock_active:${String(existing?.jobId ?? "unknown")}`);
  }

  const token = randomUUID();
  const record = {
    schemaVersion: "money_shorts_flow_motion_execution_lock_v2",
    leaseType: process.platform === "win32" ? "windows_named_pipe" : "abstract_local_socket",
    token,
    attemptId,
    jobId,
    pid: process.pid,
    acquiredAt: new Date().toISOString(),
  };
  try {
    writeLockRecordAtomic(lockPath, record);
  } catch (error) {
    await closeLease(server).catch(() => {});
    throw error;
  }

  let released = false;
  return {
    lockPath,
    leaseEndpoint,
    async release() {
      if (released) throw new Error("flow_motion_execution_lock_already_released");
      released = true;
      const current = readLock(lockPath);
      const ownsRecord = current?.token === token;
      let releaseError = ownsRecord ? null : new Error("flow_motion_execution_lock_ownership_lost");
      try {
        if (ownsRecord) fs.unlinkSync(lockPath);
      } catch (error) {
        releaseError = error;
      }
      try {
        await closeLease(server);
      } catch (error) {
        releaseError ??= error;
      }
      if (releaseError) throw releaseError;
    },
  };
}
