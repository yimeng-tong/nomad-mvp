import type { ResolvedPlannerItem, ResolvedPoi } from './types.js';

type RankingContext = {
  preferredL1AreaId: string | null;
  preferredL2GroupId?: string | null;
  hotelPoi: ResolvedPoi | null;
  lateSlot: boolean;
};

function distanceSquared(left: ResolvedPoi, right: ResolvedPoi) {
  if (
    left.latitude === null ||
    left.longitude === null ||
    right.latitude === null ||
    right.longitude === null
  ) {
    return Number.POSITIVE_INFINITY;
  }
  const latitude = left.latitude - right.latitude;
  const longitude = left.longitude - right.longitude;
  return latitude * latitude + longitude * longitude;
}

export function distanceKm(left: ResolvedPoi, right: ResolvedPoi) {
  if (
    left.latitude === null ||
    left.longitude === null ||
    right.latitude === null ||
    right.longitude === null
  ) {
    return null;
  }
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function score(item: ResolvedPlannerItem, context: RankingContext) {
  if (!item.poi) return Number.NEGATIVE_INFINITY;
  let value = item.poi.l1AreaId && item.poi.l1AreaId === context.preferredL1AreaId ? 100 : 0;
  if (item.poi.l2GroupId && item.poi.l2GroupId === context.preferredL2GroupId) value += 200;
  if (context.lateSlot && context.hotelPoi) {
    const distance = distanceSquared(item.poi, context.hotelPoi);
    if (Number.isFinite(distance)) value += 10 / (1 + distance * 10_000);
  }
  if (item.poi.verified) value += 1;
  return value;
}

export function rankCandidates(items: ResolvedPlannerItem[], context: RankingContext) {
  return [...items].sort((left, right) => {
    const scoreDiff = score(right, context) - score(left, context);
    return scoreDiff || left.itemId.localeCompare(right.itemId);
  });
}
