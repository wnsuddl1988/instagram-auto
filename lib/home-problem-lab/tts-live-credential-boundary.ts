import type { HomeProblemLabCredentialPresence } from "./types";

export interface HomeProblemLabLiveCredentials {
  apiKey: string;
  lumiVoiceId: string;
}

export interface HomeProblemLabLiveCredentialProvider {
  getPresence(): Promise<HomeProblemLabCredentialPresence>;
  withCredentials<T>(callback: (credentials: HomeProblemLabLiveCredentials) => Promise<T>): Promise<T>;
}

export class DisabledHomeProblemLabLiveCredentialProvider implements HomeProblemLabLiveCredentialProvider {
  async getPresence(): Promise<HomeProblemLabCredentialPresence> {
    return { apiKey: "unchecked", lumiVoiceId: "unchecked" };
  }

  async withCredentials<T>(_callback: (credentials: HomeProblemLabLiveCredentials) => Promise<T>): Promise<T> {
    throw new Error("HOME_PROBLEM_LAB_TTS_CREDENTIAL_PROVIDER_DISABLED");
  }
}

/** Test-only provider. It is never wired into the public API or UI. */
export function createSyntheticHomeProblemLabLiveCredentialProvider(): HomeProblemLabLiveCredentialProvider {
  const credentials: HomeProblemLabLiveCredentials = {
    apiKey: "TEST_ONLY_NOT_A_SECRET",
    lumiVoiceId: "TEST_ONLY_VOICE_REFERENCE",
  };
  return {
    async getPresence() {
      return { apiKey: "present", lumiVoiceId: "present" };
    },
    async withCredentials<T>(callback: (scopedCredentials: HomeProblemLabLiveCredentials) => Promise<T>) {
      return callback(credentials);
    },
  };
}
