export type HomeProblemLabLiveCallState = "in_flight" | "completed" | "failed";

export interface HomeProblemLabLiveCallRegistry {
  reserve(requestId: string): { allowed: boolean; errorCode: string | null };
  complete(requestId: string): void;
  fail(requestId: string): void;
  getState(requestId: string): HomeProblemLabLiveCallState | null;
}

class ProcessLocalHomeProblemLabLiveCallRegistry implements HomeProblemLabLiveCallRegistry {
  private readonly entries = new Map<string, HomeProblemLabLiveCallState>();

  reserve(requestId: string) {
    if (!requestId.trim()) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_REQUEST_ID_REQUIRED" };
    if (this.entries.has(requestId)) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_DUPLICATE_REQUEST" };
    if ([...this.entries.values()].includes("in_flight")) {
      return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_CONCURRENCY_LIMIT_EXCEEDED" };
    }
    this.entries.set(requestId, "in_flight");
    return { allowed: true, errorCode: null };
  }

  complete(requestId: string) {
    if (this.entries.get(requestId) === "in_flight") this.entries.set(requestId, "completed");
  }

  fail(requestId: string) {
    if (this.entries.get(requestId) === "in_flight") this.entries.set(requestId, "failed");
  }

  getState(requestId: string): HomeProblemLabLiveCallState | null {
    return this.entries.get(requestId) ?? null;
  }
}

const processLocalRegistry = new ProcessLocalHomeProblemLabLiveCallRegistry();

/**
 * Intentionally process-local: restart and multi-instance deployments require a later,
 * Owner-approved durable coordination design before live execution is enabled.
 */
export function getHomeProblemLabLiveCallRegistry(): HomeProblemLabLiveCallRegistry {
  return processLocalRegistry;
}

export function createHomeProblemLabLiveCallRegistryForTest(): HomeProblemLabLiveCallRegistry {
  return new ProcessLocalHomeProblemLabLiveCallRegistry();
}
