#!/usr/bin/env node

/**
 * 부엉이/금박사 쇼츠 게시 매니페스트 생성기.
 *
 * 조립 결과(최종 mp4 + assembly-manifest.json)와 조립 스펙에서 게시에 필요한
 * 모든 메타데이터를 만들어 하나의 매니페스트로 묶는다. Instagram/YouTube 게시
 * 러너가 이 파일 하나만 보면 되도록 한다.
 *
 * 편마다 이걸 새로 만든다 — contentId 가 겹치면 Blob 경로와 중복 판정이 어긋난다.
 *
 * 사용(부엉이, 기본값):
 *   node scripts/build-owl-content-unit-v1.mjs \
 *     --assembly-dir "C:/tmp/owl-final-v4" \
 *     --content-id "owl-rate-hike-cardloan-01" \
 *     --out "C:/tmp/owl-publish/owl-content-unit.json" \
 *     [--video-filename owl_ep3_final_with_cta.mp4]
 *
 * 사용(금박사 등 다른 트랙, 2026-09-20 --spec-module 파라미터화):
 *   node scripts/build-owl-content-unit-v1.mjs \
 *     --spec-module ./_geumbaksa-ep4-assembly-spec.mjs \
 *     --spec-export GEUMBAKSA_EP4_ASSEMBLY_SPEC \
 *     --assembly-dir "C:/tmp/geumbaksa-ep4-episode-final-v2" \
 *     --video-filename owl_episode_final.mp4 \
 *     --content-id "geumbaksa-fx-rate-basics-01" \
 *     --out "C:/tmp/geumbaksa-publish-ep1/owl-content-unit.json"
 *
 * --video-filename(선택, 기본값 owl_shorts_final.mp4): 본편+CTA를 별도
 * 스크립트로 결합하는 편(3편부터, run-owl-ep3-cta-bright-assemble-once.mjs)은
 * 최종 파일명이 다르므로 --assembly-dir 안의 실제 파일명을 지정한다.
 *
 * --spec-module/--spec-export(선택, 기본값 ./_owl-assembly-spec.mjs /
 * OWL_ASSEMBLY_SPEC): 부엉이 1편 전용으로 하드코딩돼 있던 걸 다른 조립
 * 스크립트들(run-owl-assemble-shorts-v2.mjs 등)과 동일한 패턴으로 파라미터화
 * 했다 — 그래야 금박사 등 다른 트랙에도 이 게시 준비 스크립트를 재사용할 수
 * 있다.
 *
 * --thumbnail(선택, 2026-09-22 추가): 유튜브 썸네일/인스타 릴스 커버 공용
 * 로컬 이미지 경로(png/jpg). 매니페스트의 thumbnailImagePath 에 그대로
 * 기록된다. YouTube 러너(run-owl-youtube-publish-once-v1.mjs)는 이 필드를
 * 읽어 업로드 후 thumbnails.set 을 호출한다. Instagram 러너는 이 로컬 경로를
 * 직접 쓰지 않고, Blob에 업로드된 공개 URL(coverImageUrl)을 blob-result에서
 * 받는다 — 별도로 plan-instagram-blob-upload-from-content-unit.mjs 쪽에
 * 커버 이미지 업로드를 연결해야 한다. 생략하면 두 플랫폼 다 영상에서 자동으로
 * 프레임을 뽑는 기존 동작 그대로 유지된다(필수 아님).
 */

import fs from "node:fs";
import path from "node:path";
import { buildOwlPublishMetadata } from "./_owl-publish-metadata.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const specModulePath = getArg("--spec-module") || "./_owl-assembly-spec.mjs";
const specExportName = getArg("--spec-export") || "OWL_ASSEMBLY_SPEC";
const specModuleUrl = new URL(specModulePath, import.meta.url);
const specModule = await import(specModuleUrl.href);
const OWL_ASSEMBLY_SPEC = specModule[specExportName];
if (!OWL_ASSEMBLY_SPEC) {
  console.error(`ABORT: ${specModulePath} 에서 export "${specExportName}" 을 찾을 수 없습니다.`);
  process.exit(2);
}

const assemblyDir = getArg("--assembly-dir");
const contentId = getArg("--content-id");
const outPath = getArg("--out");

if (!assemblyDir || !contentId || !outPath) {
  console.error("ABORT: --assembly-dir / --content-id / --out 이 필요합니다.");
  process.exit(2);
}
// contentId 는 Blob 경로에 그대로 들어간다. 경로를 깨뜨릴 문자를 막는다.
if (!/^[a-z0-9][a-z0-9-]{2,60}$/.test(contentId)) {
  console.error("ABORT: --content-id 는 소문자·숫자·하이픈만 사용할 수 있습니다.");
  process.exit(2);
}

const videoFilename = getArg("--video-filename") || "owl_shorts_final.mp4";
const videoPath = path.resolve(assemblyDir, videoFilename);
const assemblyManifestPath = path.resolve(assemblyDir, "assembly-manifest.json");
if (!fs.existsSync(videoPath)) {
  console.error(`ABORT: 최종 영상을 찾을 수 없습니다: ${videoPath}`);
  process.exit(1);
}

const thumbnailArg = getArg("--thumbnail");
let thumbnailImagePath = null;
if (thumbnailArg) {
  thumbnailImagePath = path.resolve(thumbnailArg);
  if (!fs.existsSync(thumbnailImagePath)) {
    console.error(`ABORT: 썸네일 이미지를 찾을 수 없습니다: ${thumbnailImagePath}`);
    process.exit(1);
  }
}

let timeline = null;
if (fs.existsSync(assemblyManifestPath)) {
  try {
    timeline = JSON.parse(fs.readFileSync(assemblyManifestPath, "utf8")).timeline ?? null;
  } catch {
    // 챕터는 있으면 좋고 없어도 게시에 지장 없다.
  }
}

const meta = buildOwlPublishMetadata(OWL_ASSEMBLY_SPEC, { timeline });
const stat = fs.statSync(videoPath);

const manifest = {
  schemaVersion: "dual_platform_content_unit_v1",
  contentId,
  version: "v1",
  title: meta.title,

  // 두 플랫폼이 같은 mp4 를 쓴다. Instagram 은 Blob 경유, YouTube 는 직접 업로드.
  instagramSourcePath: videoPath.replace(/\\/g, "/"),
  instagramCaption: meta.caption,
  hashtags: meta.hashtags,

  youtubeTitle: meta.title,
  youtubeDescription: meta.youtubeDescription,
  youtubeTags: meta.youtubeTags,
  youtubeHashtags: meta.youtubeHashtags,

  // 유튜브 썸네일/인스타 릴스 커버 공용 이미지(선택). 없으면 두 플랫폼 다
  // 영상에서 자동으로 프레임을 뽑는 기존 동작 그대로 유지된다.
  thumbnailImagePath: thumbnailImagePath ? thumbnailImagePath.replace(/\\/g, "/") : null,

  sourceSizeBytes: stat.size,
  channelName: OWL_ASSEMBLY_SPEC.channelName,
  specVersion: OWL_ASSEMBLY_SPEC.specVersion,
  createdAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(path.resolve(outPath), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`매니페스트 생성: ${path.resolve(outPath)}`);
console.log(`  contentId:     ${contentId}`);
console.log(`  영상:          ${(stat.size / 1048576).toFixed(1)} MiB`);
console.log(`  IG 캡션:       ${meta.caption.length}자 / 해시태그 ${meta.hashtags.length}개`);
console.log(`  YT 설명:       ${meta.youtubeDescription.length}자 / 태그 ${meta.youtubeTags.length}개`);
console.log(`  챕터:          ${timeline ? "생성됨" : "타임라인 없음(생략)"}`);
console.log(`  썸네일/커버:   ${thumbnailImagePath ?? "(없음, 자동 프레임 사용)"}`);
