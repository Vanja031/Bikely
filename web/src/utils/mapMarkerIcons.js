/**
 * Marker ikone za mapu – isto kao na mobilnoj aplikaciji:
 * - Bicikl: zeleni krug (#4CAF50), bela ivica 2px, senka, ikona bicikla u sredini
 * - Parking: žuti krug (#FF9800), bela ivica 2px, senka, slovo P
 * Veličina 32x32 px.
 */

const SIZE = 32;
const ANCHOR = SIZE / 2;

function svgToDataUrl(svgString) {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml,${encoded}`;
}

// Zeleni krug + Font Awesome ikona bicikla (kao u meniju)
const faBicyclePath = "M331.7 43.3C336 36.3 343.7 32 352 32l104 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-65.6 0 72.2 148.4c10.7-2.9 21.9-4.4 33.4-4.4 70.7 0 128 57.3 128 128s-57.3 128-128 128-128-57.3-128-128c0-42 20.2-79.2 51.4-102.6l-20.4-41.9-73.5 147c-2.3 4.8-6.3 8.8-11.4 11.2-.6 .3-1.2 .5-1.8 .7-2.9 1.1-5.9 1.6-8.9 1.5L271 368c-7.9 63.1-61.7 112-127 112-70.7 0-128-57.3-128-128S73.3 224 144 224c10.8 0 21.2 1.3 31.2 3.8l28.5-56.9-11.5-26.9-40.2 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l56 0c9.6 0 18.3 5.7 22.1 14.5l14.3 33.5 123.7 0-37.7-77.5c-3.6-7.4-3.2-16.2 1.2-23.2zM228.5 228.7l-45.6 91.3 84.8 0-39.1-91.3zM305.7 287l47.5-95-88.2 0 40.7 95zm168.7 75.5l-29.7-61c-12.8 13-20.7 30.8-20.7 50.5 0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72c-2.7 0-5.5 .2-8.1 .5l29.7 61c5.8 11.9 .8 26.3-11.1 32.1s-26.3 .8-32.1-11.1zM149.2 368c-20.2 0-33.4-21.3-24.3-39.4l24.2-48.5c-1.7-.1-3.4-.2-5.1-.2-39.8 0-72 32.2-72 72s32.2 72 72 72c34.3 0 62.9-23.9 70.2-56l-65 0z";
const bikeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32">
  <defs><filter id="bikeShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3" flood-color="#000"/></filter></defs>
  <circle cx="16" cy="16" r="14" fill="#4CAF50" stroke="white" stroke-width="2" filter="url(#bikeShadow)"/>
  <g transform="translate(16,16) scale(0.032) translate(-320,-256)" fill="white">
    <path d="${faBicyclePath}"/>
  </g>
</svg>`;

// Žuti krug + slovo P (kao na mobilnom)
const parkingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32">
  <defs><filter id="parkShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3" flood-color="#000"/></filter></defs>
  <circle cx="16" cy="16" r="14" fill="#FF9800" stroke="white" stroke-width="2" filter="url(#parkShadow)"/>
  <text x="16" y="21" font-size="16" text-anchor="middle" fill="white" font-weight="700" font-family="system-ui,sans-serif">P</text>
</svg>`;

export function getBikeMarkerIcon() {
  return {
    url: svgToDataUrl(bikeSvg),
    scaledSize: { width: SIZE, height: SIZE },
    anchor: { x: ANCHOR, y: ANCHOR },
  };
}

export function getParkingMarkerIcon() {
  return {
    url: svgToDataUrl(parkingSvg),
    scaledSize: { width: SIZE, height: SIZE },
    anchor: { x: ANCHOR, y: ANCHOR },
  };
}
