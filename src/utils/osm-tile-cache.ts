import { OSM_TILE_HEADERS } from './osm-projection';

const MAX_CONCURRENT_DOWNLOADS = 2;
const MAX_CACHED_TILES = 96;
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();
const waiters: (() => void)[] = [];
let activeDownloads = 0;

function remember(url: string, uri: string) {
  if (cache.has(url)) cache.delete(url);
  cache.set(url, uri);
  while (cache.size > MAX_CACHED_TILES) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

function runNextDownload() {
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) return;
  const start = waiters.shift();
  if (!start) return;
  activeDownloads += 1;
  start();
}

function schedule<T>(task: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    waiters.push(() => {
      task()
        .then(resolve, reject)
        .finally(() => {
          activeDownloads -= 1;
          runNextDownload();
        });
    });
    runNextDownload();
  });
}

function bytesToBase64(bytes: Uint8Array) {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const triple = (first << 16) | (second << 8) | third;
    output += BASE64_ALPHABET[(triple >> 18) & 63];
    output += BASE64_ALPHABET[(triple >> 12) & 63];
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] : '=';
  }
  return output;
}

async function downloadTile(url: string) {
  try {
    const response = await fetch(url, { headers: OSM_TILE_HEADERS });
    if (!response.ok || response.headers.get('x-blocked')) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0) return null;
    const uri = `data:image/png;base64,${bytesToBase64(bytes)}`;
    remember(url, uri);
    return uri;
  } catch {
    return null;
  }
}

export function loadOsmTile(url: string) {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached);
  const current = pending.get(url);
  if (current) return current;

  const request = schedule(() => downloadTile(url)).finally(() => {
    pending.delete(url);
  });
  pending.set(url, request);
  return request;
}
