import type { RawDataSnapshot } from "./types";
import type { ManualFactCardDraft } from "./manual";
import type { ManualFactCardAuthoringResult } from "./manual";
import { authorManualFactCard } from "./manual";

/**
 * Parser interface for converting a RawDataSnapshot into a ManualFactCardDraft candidate.
 *
 * - No live network calls. Parses fields already present in the snapshot's rawPayload.
 * - Missing required fields surface as validation errors, not invented values.
 * - Each SourceProvider type has its own parser that understands its rawPayload shape.
 */
export interface RawSnapshotParser {
  /** The sourceProviderId this parser handles (e.g. "provider-ecos-mock"). */
  readonly sourceProviderId: string;
  /** Human-readable parser name for logging/reporting. */
  readonly parserName: string;
  /**
   * Converts a raw snapshot into a ManualFactCardDraft.
   * Returns null if the snapshot shape is unrecognisable (wrong provider, missing keys).
   */
  parse(snapshot: RawDataSnapshot): ManualFactCardDraft | null;
}

/**
 * Runs a parser on a snapshot and threads the result through authorManualFactCard().
 * Returns a full authoring result with validation evidence attached.
 */
export function generateCandidateFromSnapshot(
  parser: RawSnapshotParser,
  snapshot: RawDataSnapshot,
): ManualFactCardAuthoringResult & { parserName: string; snapshotId: string } {
  const draft = parser.parse(snapshot);
  if (draft === null) {
    return {
      parserName: parser.parserName,
      snapshotId: snapshot.id,
      ok: false,
      factCard: null,
      validation: {
        ok: false,
        errors: [
          {
            field: "rawPayload",
            code: "parser_unrecognised",
            message: `${parser.parserName} could not parse snapshot ${snapshot.id}: unrecognised shape or wrong provider.`,
          },
        ],
      },
    };
  }
  const result = authorManualFactCard(draft);
  return { ...result, parserName: parser.parserName, snapshotId: snapshot.id };
}
