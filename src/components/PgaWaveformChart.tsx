'use client';

import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useAppStore } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useIsDark } from '@/src/hooks/useIsDark';

interface PgaWaveformChartProps {
  pgaHistory: { time: number; value: number }[];
}

const Y_AXIS_STEPS = [0.4, 2, 5, 10, 30, 50, 100, 125, 200, 300, 500, 1000, 1250, 2000, 3000, 5000, 10000];

function getYAxisMax(data: number[]): number {
  const maxVal = data.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
  for (const step of Y_AXIS_STEPS) {
    if (maxVal < step) return step;
  }
  return 10000;
}

export function PgaWaveformChart({ pgaHistory }: PgaWaveformChartProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();

  const option = useMemo((): EChartsOption => {
    const diffData: number[] = [];
    const timeLabels: string[] = [];

    for (let i = 1; i < pgaHistory.length; i++) {
      diffData.push(pgaHistory[i].value - pgaHistory[i - 1].value);
      const date = new Date(pgaHistory[i].time);
      timeLabels.push(
        date.toLocaleTimeString('zh-CN', { minute: '2-digit', second: '2-digit' })
      );
    }

    const yMax = getYAxisMax(diffData);
    const textColor = isDark ? '#ccc' : '#666';
    const splitLineColor = isDark ? '#333' : '#555';

    return {
      backgroundColor: 'transparent',
      // Live 1Hz updates: no transition animation, otherwise queued updates
      // replay as a fast-forward "catch-up" after the tab regains focus
      animation: false,
      grid: {
        left: '0%',
        right: '0%',
        bottom: '5%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        axisLine: { show: true, lineStyle: { color: textColor } },
        axisLabel: { color: textColor, fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: -yMax,
        max: yMax,
        axisLine: { show: true, lineStyle: { color: textColor } },
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { show: true, lineStyle: { type: 'dashed', color: splitLineColor } },
      },
      series: [
        {
          name: t('detail.pgaDiff'),
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: diffData,
          lineStyle: {
            color: '#1e90ff',
            width: 2,
          },
          areaStyle: {
            opacity: 0.2,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 153, 51, 0.3)' },
                { offset: 1, color: 'rgba(255, 153, 51, 0)' },
              ],
            },
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>${t('detail.pgaTooltip').replace('{value}', p.value.toFixed(6))}`;
        },
      },
    };
  }, [pgaHistory, isDark]);

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '150px' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
