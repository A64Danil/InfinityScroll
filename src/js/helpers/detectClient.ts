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
