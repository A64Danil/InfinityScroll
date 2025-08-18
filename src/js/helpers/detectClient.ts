export function getBrowserName():
  | 'microsoftEdge'
  | 'opera'
  | 'googleChrome'
  | 'safari'
  | 'mozillaFirefox'
  | 'internetExplorer'
  | undefined {
  const { userAgent } = navigator;

  if (/Edg\//.test(userAgent)) return 'microsoftEdge';
  if (/OPR\//.test(userAgent)) return 'opera';
  if (
    /Chrome\//.test(userAgent) &&
    !/Edg\//.test(userAgent) &&
    !/OPR\//.test(userAgent)
  )
    return 'googleChrome';
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent))
    return 'safari';
  if (/Firefox\//.test(userAgent)) return 'mozillaFirefox';
  if (/MSIE|Trident/.test(userAgent)) return 'internetExplorer';

  return undefined;
}

export function getDeviceType():
  | 'mobile'
  | 'tablet'
  | 'touchDesktop'
  | 'desktop' {
  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const width = window.innerWidth;

  if (isTouchDevice) {
    if (width <= 767) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'touchDesktop'; // Напр., сенсорный ноутбук или Surface
  }
  return 'desktop';
}
