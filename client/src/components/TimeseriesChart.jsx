// src/components/TimeseriesChart.jsx
import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// Paleta de cores para os gráficos
const chartColors = [
  'rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)',
  'rgb(255, 206, 86)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'
];

// --- (FUNÇÃO ADICIONADA) ---
/**
 * Encontra a thumbnail STAC mais próxima de uma data WTSS.
 */
function findClosestStacThumbnail(wtssDateStr, stacResults) {
    if (!stacResults || stacResults.length === 0 || !wtssDateStr) return null;

    try {
        const wtssTime = new Date(wtssDateStr).getTime();
        if (isNaN(wtssTime)) return null;

        let closestItem = null;
        let minDiff = Infinity;

        for (const item of stacResults) {
            // Verifica se o item STAC tem thumbnail e data
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


// --- (FUNÇÃO ADICIONADA) ---
/**
 * Lógica reutilizável para o tooltip externo e opções do gráfico
 */
const getChartOptions = (collectionId) => {
    
    // Função helper para criar/encontrar o div do tooltip
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
            tooltipEl.style.transition = 'opacity 0.2s';
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

        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
        }

        // Como o modo é 'nearest', dataPoints[0] AGORA é o ponto correto
        const dataPoint = tooltip.dataPoints[0]?.raw;
        if (!dataPoint) return;

        const date = tooltip.dataPoints[0].label;
        const value = tooltip.dataPoints[0].formattedValue;
        const label = tooltip.dataPoints[0].dataset.label || ''; 
        const color = tooltip.dataPoints[0].dataset.borderColor;

        let innerHtml = `
            <div style="margin-bottom: 5px; text-align: left;">
                <strong style="color: ${color};">${label}</strong>
                <div>${date}: ${value}</div>
            </div>
        `;
        
        if (dataPoint.thumbnail) {
            innerHtml += `<img src="${dataPoint.thumbnail}" alt="Thumbnail" style="width: 150px; height: auto; border-radius: 3px; display: block;" />`;
        } else {
            innerHtml += `<span style="font-size: 0.8rem; color: #ccc;">(Sem thumbnail próxima)</span>`;
        }

        tooltipEl.innerHTML = innerHtml;
        
        const { offsetLeft, offsetTop } = chart.canvas;
        tooltipEl.style.opacity = '1';
        tooltipEl.style.left = offsetLeft + tooltip.caretX + 'px';
        tooltipEl.style.top = offsetTop + tooltip.caretY + 'px';
        tooltipEl.style.transform = 'translate(-50%, -110%)'; 
    };

    return {
        responsive: true,
        maintainAspectRatio: false,
        // --- ALTERAÇÃO CRÍTICA AQUI ---
        interaction: {
            mode: 'nearest', // Antes: 'index'
            intersect: false,
        },
        // ------------------------------
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
                enabled: false, 
                position: 'nearest',
                external: externalTooltipHandler
            }
        },
        // --- CORREÇÃO: Rótulos dos eixos e limpeza do eixo X ---
        scales: {
            y: { 
                ticks: { color: '#000000' }, 
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                title: {
                    display: true,
                    text: 'Valor do Índice', // Rótulo do Eixo Y
                    color: '#000000'
                }
            },
            x: { 
                ticks: { 
                    color: '#000000',
                    autoSkip: true,       
                    maxTicksLimit: 12     
                }, 
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                title: {
                    display: true,
                    text: 'Data', // Rótulo do Eixo X
                    color: '#000000'
                }
            }
        }
    };
};
// --- (FIM DA FUNÇÃO DE OPÇÕES) ---


// --- (COMPONENTE MODIFICADO) ---
// Agora aceita 'stacResults' para encontrar as thumbnails
const TimeseriesChart = ({ timeseriesData, stacResults = [] }) => {
  
  // O 'useMemo' recalcula os dados do gráfico apenas se os dados da API mudarem
  const chartData = useMemo(() => {
    if (!timeseriesData || !timeseriesData.result) {
      return null;
    }

    const { timeline, attributes } = timeseriesData.result;

    const datasets = attributes.map((attr, index) => {
      // --- PONTO DA CORREÇÃO ---
      const attrName = attr.attribute;
      // -------------------------

      const needsScaling = ['NDVI', 'EVI'].includes(attrName);
      
      // --- CORREÇÃO DO "MERGULHO" + THUMBNAIL ---
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
        label: attrName, // <-- Label correta
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
  }, [timeseriesData, stacResults]); // Recalcula se os dados WTSS ou STAC mudarem

  // Obtém as opções do gráfico usando a nova função
  const chartOptions = useMemo(() => {
    // Título usa as coordenadas no popup, pois 'collectionId' pode não estar disponível
    const title = `Série Temporal para o Ponto (${timeseriesData.result.coordinates.latitude.toFixed(4)}, ${timeseriesData.result.coordinates.longitude.toFixed(4)})`;
    const collectionId = timeseriesData?.result?.coverage || "Série Temporal";
    
    // Pega as opções base
    const options = getChartOptions(collectionId);
    
    // Sobrescreve o título para o popup
    options.plugins.title.text = title; 
    
    return options;
  }, [timeseriesData]);

  if (!chartData) {
    return <p>Carregando dados da série temporal...</p>;
  }

  // O container precisa de 'position: relative' para o tooltip funcionar
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Line options={chartOptions} data={chartData} />
    </div>
  );
};

export default TimeseriesChart;