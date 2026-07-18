import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로컬 Playwright/Owner 화면이 127.0.0.1로 접속해도 개발 번들(HMR)이
  // 교차 출처로 차단되지 않게 한다. 외부 호스트나 배포 런타임에는 적용되지 않는다.
  allowedDevOrigins: ["127.0.0.1"],
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
