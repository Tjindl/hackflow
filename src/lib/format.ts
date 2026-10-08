const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatDepth = (metres: number) => `${integer.format(Math.round(metres))} m`;

export const formatPressure = (atm: number) =>
  `${atm < 100 ? oneDecimal.format(atm) : integer.format(atm)} atm`;

export const formatTemperature = (celsius: number) => `${oneDecimal.format(celsius)} °C`;

/** Sunlight is tiny but non-zero below 200 m; show it honestly down to 0.01%. */
export function formatSunlight(percent: number): string {
  if (percent >= 10) return `${integer.format(percent)}%`;
  if (percent >= 1) return `${oneDecimal.format(percent)}%`;
  if (percent >= 0.01) return `${percent.toFixed(2)}%`;
  return percent > 1e-6 ? '<0.01%' : '0%';
}

export const padStep = (n: number) => String(n).padStart(2, '0');
