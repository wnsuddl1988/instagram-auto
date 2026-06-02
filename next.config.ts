import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Python 실행 파일·FFmpeg·PIL 등 서버 사이드 바이너리 경로를
  // Turbopack/Next.js가 번들 추적하지 않도록 제외한다.
  // render-v2/route.ts 안의 process.cwd() + path.join 패턴이 Turbopack NFT
  // warning을 유발한다. outputFileTracingExcludes로 프로젝트 루트를 통째로
  // 제외하면 warning이 사라진다 (런타임 파일 접근에는 영향 없음).
  outputFileTracingExcludes: {
    // render-v2 route가 output/, python/, assets/ 를 직접 접근하므로 추적 제외
    "/api/render-v2": ["./**/*"],
    "/api/render-v2/route": ["./**/*"],
    // voice-test도 public/ 에 직접 씀
    "/api/voice-test": ["./**/*"],
    "/api/voice-test/route": ["./**/*"],
    "*": ["./output/**/*", "./assets/**/*", "./python/**/*", "./.cache/**/*"],
  },
};

export default nextConfig;
