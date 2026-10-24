import { useId } from "react";

// Rounds the top of the chart up to a "nice" number so the grid lines look tidy.
function niceStep(max) {
  const rawStep = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 2.5, 5, 10];
  return candidates.map((c) => c * magnitude).find((step) => step >= rawStep);
}

// A simple area chart drawn with SVG (no chart library needed).
// formatTick / formatValue turn a USD amount into text in the display currency.
// `data` looks like: [{ label: 'May', value: 1200 }, ...]
export default function RevenueChart({ data, formatTick, formatValue }) {
  const gradientId = useId();
  const width = 640;
  const height = 290;
  const margin = { top: 16, right: 20, bottom: 42, left: 64 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map((point) => point.value), 0);
  const step = maxValue > 0 ? niceStep(maxValue) : 250;
  const yMax = step * 4;

  const x = (index) =>
    margin.left +
    (data.length === 1
      ? innerWidth / 2
      : (index * innerWidth) / (data.length - 1));
  const y = (value) => margin.top + innerHeight - (value / yMax) * innerHeight;

  // Build a smooth line: each segment is a curve with horizontal handles
  let linePath = `M ${x(0)} ${y(data[0].value)}`;
  for (let i = 1; i < data.length; i++) {
    const midX = (x(i - 1) + x(i)) / 2;
    linePath += ` C ${midX} ${y(data[i - 1].value)}, ${midX} ${y(
      data[i].value
    )}, ${x(i)} ${y(data[i].value)}`;
  }
  const baseline = margin.top + innerHeight;
  const areaPath = `${linePath} L ${x(data.length - 1)} ${baseline} L ${x(
    0
  )} ${baseline} Z`;

  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Payments received per month for the last six months"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c5adb" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0c5adb" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={y(tick)}
            y2={y(tick)}
            className="chart-gridline"
          />
          <text
            x={margin.left - 10}
            y={y(tick) + 4}
            textAnchor="end"
            className="chart-text"
          >
            {formatTick(tick)}
          </text>
        </g>
      ))}

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} className="chart-line" />

      {data.map((point, index) => (
        <g key={point.label + index}>
          <circle
            cx={x(index)}
            cy={y(point.value)}
            r="4.5"
            className="chart-dot"
          >
            <title>{`${point.label}: ${formatValue(point.value)}`}</title>
          </circle>
          <text
            x={x(index)}
            y={height - 12}
            textAnchor="middle"
            className="chart-text"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
