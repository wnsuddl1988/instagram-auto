#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(projectRoot, "lib", "finance-character-voice-cast-data.json");
const tempDir = "C:\\tmp\\money-shorts-os\\finance-character-voice-audition-v1";
const tempCastPath = path.join(tempDir, "finance-character-voice-cast.jisoo-audition.v1.json");
fs.mkdirSync(tempDir, { recursive: true });

const cast = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const harin = cast.characters.find((character) => character.characterId === "harin_daily");
if (!harin) throw new Error("Harin character is missing from the source cast.");
harin.voiceLabel = "Jisoo";
harin.voiceId = "iWLjl1zCuqXRkW6494ve";
harin.voiceStatus = "audition_candidate";
cast.version = "money_shorts_finance_character_voice_cast_jisoo_audition_v1";
cast.status = "provisional_owner_audition_required";
fs.writeFileSync(tempCastPath, JSON.stringify(cast, null, 2), "utf8");

process.env.ALLOW_ELEVENLABS_AUDITION = "1";
process.argv = [
  process.argv[0],
  path.join(projectRoot, "scripts", "run-finance-character-voice-cast-audition.mjs"),
  "--execute",
  `--cast-data=${tempCastPath}`,
  `--out-dir=${tempDir}`,
  "--paid-call-cap=3",
];
await import(pathToFileURL(process.argv[1]).href);
