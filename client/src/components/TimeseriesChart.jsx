import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

const chartColors = [
  'rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)',
  'rgb(255, 206, 86)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'
];

// --- Função Auxiliar para Thumbnail ---
function findClosestStacThumbnail(wtssDateStr, stacResults) {
    if (!stacResults || stacResults.length === 0 || !wtssDateStr) return null;

    try {
        const wtssTime = new Date(wtssDateStr).getTime();
        if (isNaN(wtssTime)) return null;

        let closestItem = null;
        let minDiff = Infinity;

        for (const item of stacResults) {
            if (item.thumbnail && item.date) {
                const itemTime = new Date(item.date).getTime();
                if (isNaN(itemTime)) continue;

                const diff = Math.abs(wtssTime - itemTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestItem = item;
                }
            }
        }
        
        const MAX_DIFF_DAYS = 30 * 24 * 60 * 60 * 1000; 
        if (closestItem && minDiff < MAX_DIFF_DAYS) {
            return closestItem.thumbnail;
        }
        return null; 

    } catch (e) {
        console.error("Erro no findClosestStacThumbnail:", e);
        return null;
    }
}

// --- Opções do Gráfico com Posicionamento Inteligente ---
const getChartOptions = (collectionId) => {
    
    const getOrCreateTooltip = (chart) => {
        let tooltipEl = chart.canvas.parentNode.querySelector('div.chartjs-tooltip');
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'chartjs-tooltip'; 
            tooltipEl.style.opacity = '0';
            tooltipEl.style.position = 'absolute'; 
            tooltipEl.style.background = 'rgba(0,0,0,0.85)';
            tooltipEl.style.color = 'white';
            tooltipEl.style.borderRadius = '5px';
            tooltipEl.style.padding = '10px';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.transition = 'opacity 0.2s, transform 0.2s'; // Adiciona transição suave
            tooltipEl.style.zIndex = '9999';
            tooltipEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            tooltipEl.style.fontSize = '0.9rem';
            
            chart.canvas.parentNode.appendChild(tooltipEl);
        }
        return tooltipEl;
    };

    const externalTooltipHandler = (context) => {
        const { chart, tooltip } = context;
        const tooltipEl = getOrCreateTooltip(chart);

        // Esconde se não houver tooltip ativo
        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
        }

        const dataPoint = tooltip.dataPoints[0]?.raw;
        if (!dataPoint) return;

        const date = tooltip.dataPoints[0].label;
        const value = tooltip.dataPoints[0].formattedValue;
        const label = tooltip.dataPoints[0].dataset.label || ''; 
        const color = tooltip.dataPoints[0].dataset.borderColor;

        // Constrói o HTML
        let innerHtml = `
            <div style="margin-bottom: 5px; text-align: left;">
                <strong style="color: ${color};">${label}</strong>
                <div>${date}: ${value}</div>
            </div>
        `;
        
        if (dataPoint.thumbnail) {
            innerHtml += `<img src="${dataPoint.thumbnail}" alt="Thumbnail" style="width: 150px; height: auto; border-radius: 3px; display: block; margin-top: 5px;" />`;
        } else {
            innerHtml += `<span style="font-size: 0.8rem; color: #ccc;">(Sem thumbnail próxima)</span>`;
        }

        tooltipEl.innerHTML = innerHtml;
        
        // --- LÓGICA DE POSICIONAMENTO INTELIGENTE ---
        const { offsetLeft, offsetTop } = chart.canvas;
        const tooltipHeight = tooltipEl.offsetHeight; // Altura atual do tooltip (com imagem)
        const caretY = tooltip.caretY; // Posição Y do mouse/ponto no gráfico

        // Define a posição base
        tooltipEl.style.left = offsetLeft + tooltip.caretX + 'px';
        tooltipEl.style.top = offsetTop + caretY + 'px';

        // Verifica se há espaço acima
        if (caretY < tooltipHeight + 20) {
            // renderiza PARA BAIXO (com uma margem de 20px do cursor)
            tooltipEl.style.transform = 'translate(-50%, 20px)';
        } else {
            // renderiza PARA CIMA (padrão)
            tooltipEl.style.transform = 'translate(-50%, -110%)';
        }

        tooltipEl.style.opacity = '1';
    };

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest',
            intersect: false,
        },
        plugins: {
            legend: { 
                position: 'top', 
                labels: { color: '#000000' }
            },
            title: {
                display: true,
                text: `Série Temporal: ${collectionId}`,
                color: '#000000'
            },
            tooltip: {
                enabled: false, // Desabilita o tooltip padrão
                position: 'nearest',
                external: externalTooltipHandler // Usa o nosso customizado
            }
        },
        scales: {
            y: { 
                ticks: { color: '#000000' }, 
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                title: { display: true, text: 'Valor do Índice', color: '#000000' }
            },
            x: { 
                ticks: { color: '#000000', autoSkip: true, maxTicksLimit: 12 }, 
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                title: { display: true, text: 'Data', color: '#000000' }
            }
        }
    };
};

const TimeseriesChart = ({ timeseriesData, stacResults = [] }) => {
  const chartData = useMemo(() => {
    if (!timeseriesData || !timeseriesData.result) return null;

    const { timeline, attributes } = timeseriesData.result;

    const datasets = attributes.map((attr, index) => {
      const attrName = attr.attribute;
      const needsScaling = ['NDVI', 'EVI'].includes(attrName);
      
      const values = attr.values.map((v, i) => {
        const originalDate = timeline[i];
        const cleanValue = (v === null || v === undefined || v <= -3000) ? null : (needsScaling ? v / 10000 : v);

        return {
            x: new Date(originalDate).toLocaleDateString(),
            y: cleanValue,
            thumbnail: findClosestStacThumbnail(originalDate, stacResults) 
        };
      });
      
      return {
        label: attrName,
        data: values,
        borderColor: chartColors[index % chartColors.length],
        backgroundColor: chartColors[index % chartColors.length].replace(')', ', 0.5)'),
        tension: 0.1,
        spanGaps: true, 
      };
    });

    return {
      labels: timeline.map(date => new Date(date).toLocaleDateString()),
      datasets: datasets,
    };
  }, [timeseriesData, stacResults]);

  const chartOptions = useMemo(() => {
    const title = `Série Temporal para o Ponto (${timeseriesData.result.coordinates.latitude.toFixed(4)}, ${timeseriesData.result.coordinates.longitude.toFixed(4)})`;
    const collectionId = timeseriesData?.result?.coverage || "Série Temporal";
    
    const options = getChartOptions(collectionId);
    options.plugins.title.text = title; 
    
    return options;
  }, [timeseriesData]);

  if (!chartData) return <p>Carregando dados da série temporal...</p>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Line options={chartOptions} data={chartData} />
    </div>
  );
};

export default TimeseriesChart;