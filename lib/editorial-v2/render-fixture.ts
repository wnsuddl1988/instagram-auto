export interface SyntheticRenderFixtureScene {
  readonly sceneId: string;
  readonly order: number;
  readonly durationSeconds: 0.5;
  readonly colorToken: string;
  readonly subtitle: string;
  readonly sceneHash: string;
}

export interface SyntheticRenderFixture {
  readonly fixtureVersion: "slice6-synthetic-render-fixture-v1";
  readonly profileId: "preview_540x960";
  readonly width: 540;
  readonly height: 960;
  readonly framesPerSecond: 30;
  readonly sceneCount: 8;
  readonly totalDurationSeconds: 4;
  readonly scenes: readonly SyntheticRenderFixtureScene[];
  readonly syntheticAudioPolicy: "generated_sine_tone_fixture_only";
  readonly subtitlePolicy: "synthetic_srt_fixture_only";
  readonly safeAreaMarker: "SYNTHETIC_SAFE_AREA_GUIDE";
  readonly userContentIncluded: false;
  readonly productionDataIncluded: false;
  readonly finalProfileUsed: false;
  readonly fixtureHash: "slice6-fixture-fixed-8x050-540x960-v1";
}

const FIXTURE: SyntheticRenderFixture = {
  fixtureVersion: "slice6-synthetic-render-fixture-v1",
  profileId: "preview_540x960",
  width: 540,
  height: 960,
  framesPerSecond: 30,
  sceneCount: 8,
  totalDurationSeconds: 4,
  scenes: [
    { sceneId: "synthetic-scene-01", order: 1, durationSeconds: 0.5, colorToken: "0x14213D", subtitle: "SYNTHETIC 01", sceneHash: "scene-fixed-01-14213d" },
    { sceneId: "synthetic-scene-02", order: 2, durationSeconds: 0.5, colorToken: "0x1B4965", subtitle: "SYNTHETIC 02", sceneHash: "scene-fixed-02-1b4965" },
    { sceneId: "synthetic-scene-03", order: 3, durationSeconds: 0.5, colorToken: "0x2A6F97", subtitle: "SYNTHETIC 03", sceneHash: "scene-fixed-03-2a6f97" },
    { sceneId: "synthetic-scene-04", order: 4, durationSeconds: 0.5, colorToken: "0x2C7DA0", subtitle: "SYNTHETIC 04", sceneHash: "scene-fixed-04-2c7da0" },
    { sceneId: "synthetic-scene-05", order: 5, durationSeconds: 0.5, colorToken: "0x468FAF", subtitle: "SYNTHETIC 05", sceneHash: "scene-fixed-05-468faf" },
    { sceneId: "synthetic-scene-06", order: 6, durationSeconds: 0.5, colorToken: "0x61A5C2", subtitle: "SYNTHETIC 06", sceneHash: "scene-fixed-06-61a5c2" },
    { sceneId: "synthetic-scene-07", order: 7, durationSeconds: 0.5, colorToken: "0x89C2D9", subtitle: "SYNTHETIC 07", sceneHash: "scene-fixed-07-89c2d9" },
    { sceneId: "synthetic-scene-08", order: 8, durationSeconds: 0.5, colorToken: "0xA9D6E5", subtitle: "SYNTHETIC 08", sceneHash: "scene-fixed-08-a9d6e5" },
  ],
  syntheticAudioPolicy: "generated_sine_tone_fixture_only",
  subtitlePolicy: "synthetic_srt_fixture_only",
  safeAreaMarker: "SYNTHETIC_SAFE_AREA_GUIDE",
  userContentIncluded: false,
  productionDataIncluded: false,
  finalProfileUsed: false,
  fixtureHash: "slice6-fixture-fixed-8x050-540x960-v1",
};

export function buildSyntheticRenderFixture(): SyntheticRenderFixture {
  return cloneSyntheticRenderFixture(FIXTURE);
}

export function cloneSyntheticRenderFixture(fixture: SyntheticRenderFixture): SyntheticRenderFixture {
  return {
    ...fixture,
    scenes: fixture.scenes.map((scene) => ({ ...scene })),
  };
}
