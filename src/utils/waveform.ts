export interface WaveformPoint {
  time: number;
  value: number;
}

export function drawWaveform(
  canvas: HTMLCanvasElement,
  data: WaveformPoint[],
  isDark: boolean,
  containerWidth: number,
  containerHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx || data.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = containerWidth;
  const height = containerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const padding = { top: 20, right: 16, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Find min/max for scaling (centered around 0)
  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 0.001);
  const minVal = Math.min(...values, -0.001);
  const absMax = Math.max(Math.abs(maxVal), Math.abs(minVal));
  const yRange = Math.ceil(absMax * 1.2) || 1;

  // Draw grid lines (dashed)
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const gridLines = 5;
  for (let i = 0; i < gridLines; i++) {
    const yVal = -yRange + (2 * yRange * i) / (gridLines - 1);
    const y = padding.top + chartHeight - ((yVal + yRange) / (2 * yRange)) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const labelVal = Math.round(yVal);
    ctx.fillText(labelVal === 0 ? '0' : labelVal.toString(), padding.left - 8, y);
  }

  ctx.setLineDash([]);

  // Draw waveform line
  ctx.strokeStyle = isDark ? '#7b8cde' : '#4a6cf7';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  const xStep = chartWidth / (data.length - 1 || 1);

  for (let i = 0; i < data.length; i++) {
    const x = padding.left + i * xStep;
    const normalizedVal = (data[i].value + yRange) / (2 * yRange);
    const y = padding.top + chartHeight - normalizedVal * chartHeight;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Draw current value dot
  if (data.length > 0) {
    const lastX = padding.left + (data.length - 1) * xStep;
    const lastNormalized = (data[data.length - 1].value + yRange) / (2 * yRange);
    const lastY = padding.top + chartHeight - lastNormalized * chartHeight;

    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#7b8cde' : '#4a6cf7';
    ctx.fill();
  }

  // Draw X-axis time labels
  ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const labelInterval = Math.max(1, Math.floor(data.length / 6));
  for (let i = 0; i < data.length; i += labelInterval) {
    const x = padding.left + i * xStep;
    const time = new Date(data[i].time);
    const timeStr = `${time.getMinutes().toString().padStart(2, '0')}:${time
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;
    ctx.fillText(timeStr, x, height - padding.bottom + 8);
  }
}
