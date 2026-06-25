export { RENDER_PLAN_SCHEMA_VERSION, DEFAULT_RENDER_DIMENSIONS } from "./types";
export type {
  RenderDimensions,
  RenderVideoCodec,
  RenderAudioCodec,
  RenderContainer,
  RenderOutputSpec,
  PlannedImageInput,
  PlannedAudioInput,
  PlannedCaptionOverlay,
  PlannedSourceOverlay,
  PlannedFfmpegFragment,
  PlannedFfmpegCommand,
  RenderManifest,
  RenderPlanValidationError,
  RenderPlanValidationResult,
} from "./types";

export { buildRenderManifest } from "./builder";
export type { RenderPlanBuilderOptions } from "./builder";

export { validateRenderManifest } from "./validation";

export {
  inflationRenderPlan30,
  inflationRenderPlan30WithImagePrompts,
  exchangeRateRenderPlan15,
  MOCK_RENDER_PLANS,
} from "./fixtures";
