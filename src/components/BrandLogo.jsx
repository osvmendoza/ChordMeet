import React from 'react';

// Official ChordMeet isotipo vector paths (from SVG brand kit, centered on viewBox "26 36.3 96 96")
const LOGO_PATH_MAIN =
  'M106.31,128.16c-1.18.29-2.42.44-3.69.44h-57.23c-8.66,0-15.68-7.02-15.68-15.68v-57.23c0-8.66,7.02-15.68,15.68-15.68h49.47c-.9,1.07-1.14,2.82-1.73,3.81-2.33,4.27-6.98,4.64-11.82,6.52-7.82,3.04-13.98,10.65-15.75,19.46-1.63,8.15.55,17.06,5.6,23.32-2.49-17.79,8.03-25.68,21.58-27.75-.26,16.78-.81,36.49-.53,47.51.18,7.41,6.06,13.63,14.11,15.3Z';

const LOGO_PATH_SIDE =
  'M118.3,55.68v42.84c-2.33-.9-4.92-1.41-7.64-1.41-5.59,0-9.52,2.53-11.31,4.62.25-21.63.57-45.07.74-57.07.03-2.42-.35-3.86-1-4.67h3.53c8.66,0,15.68,7.02,15.68,15.68Z';

export function ChordMeetIcon({
  className = 'w-6 h-6',
  color = 'currentColor',
  cutoutColor = null,
  title = 'ChordMeet'
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="26 36.3 96 96"
      className={className}
      role="img"
      aria-label={title}
    >
      {cutoutColor && (
        <rect x="30.6" y="40.9" width="86.8" height="86.8" rx="15" fill={cutoutColor} />
      )}
      <path fill={color} d={LOGO_PATH_MAIN} />
      <path fill={color} d={LOGO_PATH_SIDE} />
    </svg>
  );
}

/**
 * Generates an inline SVG data URL for the browser tab favicon matching the active theme.
 */
export function getFaviconDataUrl(fgColor = '#00fff2', cutoutColor = '#040710', gradientEnd = null) {
  const fillDef = gradientEnd
    ? `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${fgColor}"/><stop offset="100%" stop-color="${gradientEnd}"/></linearGradient></defs>`
    : '';
  const fillRef = gradientEnd ? 'url(#g)' : fgColor;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="26 36.3 96 96">${fillDef}<rect x="30.6" y="40.9" width="86.8" height="86.8" rx="15" fill="${cutoutColor}"/><path fill="${fillRef}" d="${LOGO_PATH_MAIN}"/><path fill="${fillRef}" d="${LOGO_PATH_SIDE}"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default ChordMeetIcon;
