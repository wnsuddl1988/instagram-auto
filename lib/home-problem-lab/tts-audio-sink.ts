export interface HomeProblemLabVerifiedAudio {
  bytes: Uint8Array;
  contentType: "audio/mpeg";
  requestId: string;
}

export interface HomeProblemLabAudioSink {
  saveVerifiedAudio(audio: HomeProblemLabVerifiedAudio): Promise<{ audioPath: string | null; audioGenerated: boolean }>;
  cleanup(audioPath: string | null): Promise<void>;
}

export class DisabledHomeProblemLabAudioSink implements HomeProblemLabAudioSink {
  async saveVerifiedAudio(_audio: HomeProblemLabVerifiedAudio): Promise<{ audioPath: string | null; audioGenerated: boolean }> {
    throw new Error("HOME_PROBLEM_LAB_TTS_AUDIO_SINK_DISABLED");
  }

  async cleanup(_audioPath: string | null) {
    // Nothing can have been written by the disabled sink.
  }
}

/** In-memory test double; it deliberately creates no file or repository artifact. */
export class InMemoryHomeProblemLabAudioSink implements HomeProblemLabAudioSink {
  private saved = false;

  async saveVerifiedAudio(_audio: HomeProblemLabVerifiedAudio) {
    this.saved = true;
    return { audioPath: null, audioGenerated: true };
  }

  async cleanup(_audioPath: string | null) {
    this.saved = false;
  }

  wasSaved(): boolean {
    return this.saved;
  }
}

/**
 * Dormant until a later Owner-approved execution slice injects this sink. Files are
 * written only after transport-level validation, outside the repository, using a
 * random name rather than a request id. A failed write is best-effort cleaned up.
 */
export class TempHomeProblemLabAudioSink implements HomeProblemLabAudioSink {
  constructor(private readonly directory = tmpdir()) {}

  async saveVerifiedAudio(audio: HomeProblemLabVerifiedAudio) {
    const audioPath = join(this.directory, `home-problem-lab-${randomUUID()}.mp3`);
    try {
      await fs.writeFile(audioPath, audio.bytes, { flag: "wx" });
      return { audioPath, audioGenerated: true };
    } catch (_error) {
      await this.cleanup(audioPath);
      throw new Error("HOME_PROBLEM_LAB_TTS_TEMP_AUDIO_WRITE_FAILED");
    }
  }

  async cleanup(audioPath: string | null) {
    if (!audioPath) return;
    try {
      await fs.unlink(audioPath);
    } catch (_error) {
      // Best effort only; errors intentionally contain no path or audio data.
    }
  }
}
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
