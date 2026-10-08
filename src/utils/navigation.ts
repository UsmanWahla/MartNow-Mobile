export function firstRouteParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function safeDestination(value: string | string[] | undefined, fallback = '/'): string {
  const destination = firstRouteParam(value);

  return destination?.startsWith('/') && !destination.startsWith('//') ? destination : fallback;
}
