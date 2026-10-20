/**
 * پل سازگاری: نام قدیمی AtlasMap حالا به موتور تازهٔ نقشه وصل است.
 * (نقشهٔ شهری همچنان از CityPlan می‌آید و در همین فایل نگه داشته شده است.)
 */
export { AtlasView as AtlasMap, AtlasView as default } from './atlas/AtlasView'
export type { MapPhase, MapSpec } from './atlas/engine'
