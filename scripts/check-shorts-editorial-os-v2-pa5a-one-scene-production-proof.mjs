import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd(); let pass = 0; let fail = 0;
function check(name, condition) { if (condition) pass += 1; else { fail += 1; console.error(`FAIL: ${name}`); } }
const source = readFileSync(resolve(root, "lib/editorial-v2/pa5a-one-scene-production-proof-node.ts"), "utf8");
for (const [name, needle] of [["explicit proof classification", "PA5A_ONE_SCENE_LOCAL_PRODUCTION_PROOF"], ["1080 width", "PA5A_WIDTH = 1080"], ["1920 height", "PA5A_HEIGHT = 1920"], ["30 fps", "PA5A_FPS = 30"], ["exact scene 04", "PA5A_EXPECTED_SCENE_ORDER = 4"], ["provider timestamps", "provider_character_timestamps"], ["real audio descriptor", "readVoiceSceneAudioDescriptor"], ["subtitle track builder", "buildAudioAlignedSubtitleTrack"], ["subtitle stream mux", '"mov_text"'], ["ffprobe validation", "PA5A_FFPROBE_VALIDATION_FAILED"], ["browser external request guard", "PA5A_EXTERNAL_BROWSER_REQUEST_DETECTED"], ["overall production false", "productionReady: false"], ["public launch false", "publicLaunchReady: false"], ["no provider adapter import", !source.includes("elevenlabs-timestamp-tts-node")], ["no fetch call", !source.includes("fetch(")]]) check(name, typeof needle === "string" ? source.includes(needle) : needle);
console.log(`PA5A_CHECKER: ${pass}/${pass + fail} PASS`); if (fail) process.exit(1);
