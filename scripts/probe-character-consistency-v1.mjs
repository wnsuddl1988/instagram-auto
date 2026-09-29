#!/usr/bin/env node
/**
 * Character consistency probe for the 2D illustrated-mascot direction.
 *
 * Purpose: the benchmark channel (moneyhunter_kr) animates a 2D illustrated
 * banknote mascot by swapping per-scene pose illustrations, not by rigging a
 * 3D model. Before committing to that direction we must know whether Imagen
 * can hold ONE character identity stable across several different poses.
 *
 * Method: a single frozen IDENTITY block is prefixed to every prompt; only the
 * pose/expression/background clause varies. Output goes to a probe-only root.
 *
 * This probe performs real paid Imagen calls and must only be run under an
 * explicit Owner approval for exactly this scope.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(
  process.cwd(),
  "output",
  "character-consistency-probe-v1"
);

// Frozen identity: repeated verbatim in every prompt so the model anchors on
// the same character. Keep wording stable -- any edit changes the character.
const IDENTITY = [
  "A cute 2D flat-illustration cartoon mascot character:",
  "a Korean 1000-won green banknote with a friendly face,",
  "large round expressive eyes with white sclera and dark green pupils,",
  "thick black outlines, simple cel-shaded flat colors,",
  "wearing a brown wide-brim explorer hat,",
  "small white cartoon gloves for hands and simple rounded shoes,",
  "mint-green paper body with subtle banknote pattern,",
  "children's book illustration style, bold clean vector look,",
].join(" ");

const STYLE_SUFFIX = [
  "flat 2D vector illustration, no 3D rendering, no photorealism,",
  "bold black outlines, bright saturated colors, simple background,",
  "centered full-body character, vertical 9:16 composition.",
].join(" ");

// Only this clause changes between images.
const POSES = [
  {
    id: "01_pointing",
    clause:
      "The character stands confidently and points forward at the viewer with one gloved hand, mouth open in an explaining expression, cheerful and energetic.",
  },
  {
    id: "02_surprised",
    clause:
      "The character looks shocked and surprised, both gloved hands raised near its face, eyes wide open, mouth open in an O shape.",
  },
  {
    id: "03_thinking",
    clause:
      "The character stands thinking, one gloved hand touching its chin, eyebrows furrowed in a puzzled expression, head slightly tilted.",
  },
  {
    id: "04_happy_thumbsup",
    clause:
      "The character smiles brightly and gives a big thumbs up with one gloved hand, eyes curved happily, standing proudly.",
  },
];

async function generateImagenImage(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  const model = process.env.IMAGEN_MODEL || "imagen-4.0-fast-generate-001";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "9:16",
          personGeneration: "dont_allow",
        },
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Imagen API 오류 ${response.status}: ${data?.error?.message || "unknown"}`
    );
  }
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) {
    throw new Error("Imagen 응답에 이미지 데이터가 없습니다.");
  }
  return Buffer.from(b64, "base64");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const results = [];
  for (const pose of POSES) {
    const prompt = `${IDENTITY} ${pose.clause} ${STYLE_SUFFIX}`;
    process.stdout.write(`generating ${pose.id} ... `);
    try {
      const buf = await generateImagenImage(prompt);
      const file = join(OUT_DIR, `${pose.id}.png`);
      await writeFile(file, buf);
      console.log(`ok (${buf.length} bytes)`);
      results.push({ id: pose.id, file, bytes: buf.length, prompt, ok: true });
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      results.push({ id: pose.id, ok: false, error: err.message, prompt });
      break; // stop on first failure; do not burn further paid calls
    }
  }

  await writeFile(
    join(OUT_DIR, "PROBE_MANIFEST.json"),
    JSON.stringify(
      {
        schema: "CHARACTER_CONSISTENCY_PROBE_V1",
        model: process.env.IMAGEN_MODEL || "imagen-4.0-fast-generate-001",
        identityBlock: IDENTITY,
        styleSuffix: STYLE_SUFFIX,
        generated: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`\ndone. output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("probe failed:", err.message);
  process.exit(1);
});
