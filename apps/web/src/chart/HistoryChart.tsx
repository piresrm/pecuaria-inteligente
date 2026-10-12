import { useEffect, useRef } from 'react';
import {
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import type { PontoHistorico } from '@pecuaria/domain';
import { formatarDataCivil, formatarPreco } from '@pecuaria/domain/presentation';

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

export default function HistoryChart({ pontos }: { pontos: PontoHistorico[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const primary = getComputedStyle(canvas.current).getPropertyValue('--primary').trim();
    const chart = new Chart(canvas.current, {
      type: 'line',
      data: {
        labels: pontos.map((p) => formatarDataCivil(p.semana)),
        datasets: [
          {
            label: 'Média demonstrativa · R$/cabeça',
            data: pontos.map((p) => (p.media === null ? null : Number(p.media))),
            borderColor: primary,
            backgroundColor: primary,
            pointRadius: 2,
            pointHoverRadius: 4,
            spanGaps: false,
            tension: 0.18,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        locale: 'pt-BR',
        ...(matchMedia('(prefers-reduced-motion: reduce)').matches
          ? { animation: false as const }
          : {}),
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (item) => `${formatarPreco(pontos[item.dataIndex]?.media ?? null)} / cabeça`,
            },
          },
        },
        scales: {
          y: {
            title: { display: true, text: 'R$/cabeça' },
            ticks: { callback: (value) => `R$ ${Number(value).toLocaleString('pt-BR')}` },
          },
          x: { ticks: { maxTicksLimit: 6 } },
        },
      },
    });
    return () => chart.destroy();
  }, [pontos]);
  return (
    <figure className="chart-figure">
      <div className="chart-canvas">
        <canvas
          ref={canvas}
          role="img"
          aria-label="Histórico semanal da média demonstrativa por cabeça"
        />
      </div>
      <figcaption>Semanas sem preço ficam como lacunas; não há interpolação.</figcaption>
    </figure>
  );
}
