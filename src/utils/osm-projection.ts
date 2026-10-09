const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;

export const OSM_TILE_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_DEFAULT_ZOOM = 16;
export const OSM_MIN_ZOOM = 3;
export const OSM_MAX_ZOOM = 19;
export const OSM_TILE_HEADERS = {
  'User-Agent': 'MartNowMobile/1.0 (com.martnow.mobile)',
};

export function clampLatitude(latitude: number) {
  return Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));
}

export function wrapLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function worldSize(zoom: number) {
  return TILE_SIZE * 2 ** zoom;
}

export function longitudeToWorldX(longitude: number, zoom: number) {
  return ((wrapLongitude(longitude) + 180) / 360) * worldSize(zoom);
}

export function latitudeToWorldY(latitude: number, zoom: number) {
  const radians = (clampLatitude(latitude) * Math.PI) / 180;
  const mercator = Math.log(Math.tan(Math.PI / 4 + radians / 2));
  return ((1 - mercator / Math.PI) / 2) * worldSize(zoom);
}

export function worldXToLongitude(x: number, zoom: number) {
  return wrapLongitude((x / worldSize(zoom)) * 360 - 180);
}

export function worldYToLatitude(y: number, zoom: number) {
  const mercator = Math.PI * (1 - (2 * y) / worldSize(zoom));
  return clampLatitude((180 / Math.PI) * Math.atan(Math.sinh(mercator)));
}

export function panByPixels(
  latitude: number,
  longitude: number,
  zoom: number,
  deltaX: number,
  deltaY: number,
) {
  return {
    latitude: worldYToLatitude(latitudeToWorldY(latitude, zoom) - deltaY, zoom),
    longitude: worldXToLongitude(longitudeToWorldX(longitude, zoom) - deltaX, zoom),
  };
}

export function projectPoint(
  latitude: number,
  longitude: number,
  centerLatitude: number,
  centerLongitude: number,
  zoom: number,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
) {
  const originX = longitudeToWorldX(centerLongitude, zoom) - width / 2 - offsetX;
  const originY = latitudeToWorldY(centerLatitude, zoom) - height / 2 - offsetY;
  return {
    x: longitudeToWorldX(longitude, zoom) - originX,
    y: latitudeToWorldY(latitude, zoom) - originY,
  };
}

export function unprojectPoint(
  x: number,
  y: number,
  centerLatitude: number,
  centerLongitude: number,
  zoom: number,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
) {
  const originX = longitudeToWorldX(centerLongitude, zoom) - width / 2 - offsetX;
  const originY = latitudeToWorldY(centerLatitude, zoom) - height / 2 - offsetY;
  return {
    latitude: worldYToLatitude(originY + y, zoom),
    longitude: worldXToLongitude(originX + x, zoom),
  };
}

export interface OsmTile {
  key: string;
  left: number;
  top: number;
  url: string;
}

export function visibleOsmTiles(
  centerLatitude: number,
  centerLongitude: number,
  zoom: number,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
) {
  if (width <= 0 || height <= 0) return [];

  const originX = longitudeToWorldX(centerLongitude, zoom) - width / 2 - offsetX;
  const originY = latitudeToWorldY(centerLatitude, zoom) - height / 2 - offsetY;
  const buffer = 1;
  const startX = Math.floor(originX / TILE_SIZE) - buffer;
  const startY = Math.floor(originY / TILE_SIZE) - buffer;
  const endX = Math.floor((originX + width) / TILE_SIZE) + buffer;
  const endY = Math.floor((originY + height) / TILE_SIZE) + buffer;
  const tileCount = 2 ** zoom;
  const tiles: OsmTile[] = [];

  for (let tileY = startY; tileY <= endY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) continue;
    for (let tileX = startX; tileX <= endX; tileX += 1) {
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}/${wrappedX}/${tileY}`,
        left: tileX * TILE_SIZE - originX,
        top: tileY * TILE_SIZE - originY,
        url: OSM_TILE_URL_TEMPLATE.replace('{z}', String(zoom))
          .replace('{x}', String(wrappedX))
          .replace('{y}', String(tileY)),
      });
    }
  }

  return tiles;
}
