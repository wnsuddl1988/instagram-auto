export const LEGACY_EXTERNAL_ROUTE_RETIRED_ERROR =
  "LEGACY_EXTERNAL_ROUTE_RETIRED" as const;

export const LEGACY_EXTERNAL_ROUTE_PATHS = [
  "/api/auto",
  "/api/generate",
  "/api/render",
] as const;

export type LegacyExternalRoutePath =
  (typeof LEGACY_EXTERNAL_ROUTE_PATHS)[number];

export interface LegacyExternalRouteHardBlockResult {
  status: 410;
  body: {
    success: false;
    retired: true;
    error: typeof LEGACY_EXTERNAL_ROUTE_RETIRED_ERROR;
    route: LegacyExternalRoutePath;
    sideEffects: false;
  };
}

export function evaluateLegacyExternalRouteHardBlock(
  route: LegacyExternalRoutePath
): LegacyExternalRouteHardBlockResult {
  return {
    status: 410,
    body: {
      success: false,
      retired: true,
      error: LEGACY_EXTERNAL_ROUTE_RETIRED_ERROR,
      route,
      sideEffects: false,
    },
  };
}
