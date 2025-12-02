// src/pages/DashboardPage.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    Title,
    PointElement,
    LineElement
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import './DashboardPage.css'; 

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// --- Configurações do Chart.js --- 
ChartJS.defaults.color = "#000000"; 
ChartJS.defaults.borderColor = "rgba(0, 0, 0, 0.1)"; 
ChartJS.defaults.plugins.legend.labels.color = "#000000";
ChartJS.defaults.plugins.title.color = "#000000";
ChartJS.defaults.scale.grid.color = "rgba(0, 0, 0, 0.1)";
ChartJS.defaults.scale.ticks.color = "#000000";

ChartJS.register(
    Tooltip, Legend, CategoryScale, LinearScale, Title, PointElement, LineElement
);

const generateColor = (index) => {
    const hue = (index * 137.5) % 360;
    return { background: `hsla(${hue}, 70%, 60%, 0.7)`, border: `hsla(${hue}, 70%, 60%, 1)` };
};


// --- Função para encontrar thumbnail ---
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

// --- Processamento de séries temporais ---
const processTimeseries = (tsObject, stacResults) => { 
    const wtssCollectionId = tsObject?.coverage;
    const wtssResult = tsObject?.data?.result;
    
    if (!wtssCollectionId || !wtssResult?.timeline || !Array.isArray(wtssResult.attributes) || wtssResult.attributes.length === 0) return null;
    
    try {
        const labels = wtssResult.timeline.map(dateStr => new Date(dateStr).toLocaleDateString());
        const attributesArray = wtssResult.attributes;
        
        const datasets = attributesArray.map((attrItem, index) => {
            if (!attrItem || typeof attrItem.attribute !== 'string' || !Array.isArray(attrItem.values)) return null;
            
            const attrName = attrItem.attribute; 
            const valuesArray = attrItem.values;
            const colorInfo = generateColor(index);
            const needsScaling = ['NDVI', 'EVI'].includes(attrName);

            const values = valuesArray.map((v, i) => {
                const originalDate = wtssResult.timeline[i];
                const cleanValue = (v === null || v === undefined || v <= -3000) ? null : (needsScaling ? v / 10000 : v);
                
                return {
                    x: new Date(originalDate).toLocaleDateString(),
                    y: cleanValue, 
                    thumbnail: findClosestStacThumbnail(originalDate, stacResults),
                    originalDate: originalDate,
                    originalValue: v
                };
            });

            return {
                label: attrName,
                data: values, 
                borderColor: colorInfo.border,
                backgroundColor: colorInfo.background,
                tension: 0.1,
                fill: false,
                spanGaps: true, 
            };
        }).filter(Boolean); 

        if (datasets.length === 0) return null;
        return { 
            labels, 
            datasets, 
            timeline: wtssResult.timeline, 
            attributes: wtssResult.attributes, 
            collectionId: wtssCollectionId 
        }; 

    } catch (e) {
        console.error(`Erro CRÍTICO ao processar dados WTSS para ${wtssCollectionId}:`, e, tsObject);
        return null;
    }
};


// --- Configurações do gráfico ---
const getChartOptions = (collectionId, onOpenModal, showThumbnails = false) => {

    // --- Tooltip Customizado (Apenas para o Modal/Popup) ---
    const getOrCreateTooltip = (chart) => {
        let tooltipEl = chart.canvas.parentNode.querySelector('div.chartjs-tooltip');
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'chartjs-tooltip'; 
            tooltipEl.style.opacity = '0';
            tooltipEl.style.position = 'absolute'; 
            tooltipEl.style.background = 'rgba(0,0,0,0.85)'; // A tal "caixa preta"
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
        
        // Renderiza a thumbnail apenas se showThumbnails for true (no Popup)
        if (showThumbnails) {
            if (dataPoint.thumbnail) {
                innerHtml += `<img src="${dataPoint.thumbnail}" alt="Thumbnail" style="width: 150px; height: auto; border-radius: 3px; display: block;" />`;
            } else {
                innerHtml += `<span style="font-size: 0.8rem; color: #ccc;">(Sem thumbnail próxima)</span>`;
            }
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
        onClick: (event, elements, chart) => {
            const legend = chart.legend;
            if (legend) {
                const { left, right, top, bottom } = legend;
                const x = event.x;
                const y = event.y;

                if (x >= left && x <= right && y >= top && y <= bottom) {
                    return; 
                }
            }

            if (onOpenModal) {
                onOpenModal();
            }
        },
        interaction: {
            mode: 'nearest',
            intersect: false,
        },
        plugins: {
            legend: { 
                position: 'top',
            },
            title: {
                display: true,
                text: `Série Temporal: ${collectionId}`,
            },
            tooltip: {
                // --- LÓGICA CRUCIAL AQUI ---
                // Se showThumbnails for true (Popup), desabilita o nativo e usa o external (Custom HTML).
                // Se showThumbnails for false (Dashboard), habilita o nativo e anula o external.
                enabled: !showThumbnails, 
                position: 'nearest',
                external: showThumbnails ? externalTooltipHandler : undefined
            }
        }
    };
};



// --- Componente Principal ---
const DashboardPage = ({ timeseriesData = [], selectedCoords, searchResults = [] }) => { 
    
    const [selectedChartData, setSelectedChartData] = useState(null);
    const [selectedCharts, setSelectedCharts] = useState(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const chartRefs = useRef({});

    const chartsToRender = useMemo(() => {
        if (!Array.isArray(timeseriesData)) return [];
        return timeseriesData.map(tsObject => {
            const chartData = processTimeseries(tsObject, searchResults);
            return {
                id: tsObject.coverage,
                chartData: chartData,
                fullData: tsObject 
            };
        }).filter(c => c.chartData !== null); 
    }, [timeseriesData, searchResults]); 

    const closeModal = () => setSelectedChartData(null);

    const handleSelectionChange = (chartId) => {
        setSelectedCharts(prev => {
            const newSet = new Set(prev);
            newSet.has(chartId) ? newSet.delete(chartId) : newSet.add(chartId);
            return newSet;
        });
    };

    const handleExportToCSV = () => {
        if (selectedCharts.size === 0) {
            alert("Por favor, selecione pelo menos um gráfico para exportar.");
            return;
        }

        const selectedTS = chartsToRender.filter(c => selectedCharts.has(c.id));
        if (selectedTS.length === 0) return;

        let csvContent = "";
        const separator = ","; 

        if (selectedCoords) {
            csvContent += `Coordenadas${separator}Lat: ${selectedCoords.lat.toFixed(6)}${separator}Lng: ${selectedCoords.lng.toFixed(6)}\n\n`;
        }

        selectedTS.forEach(ts => {
            const { collectionId, timeline, attributes } = ts.chartData;
            csvContent += `Coleção WTSS${separator}${collectionId}\n`;
            
            const header = ["Data"].concat(attributes.map(a => a.attribute)).join(separator);
            csvContent += `${header}\n`;

            timeline.forEach((dateStr, index) => {
                let row = [dateStr];
                attributes.forEach(attr => {
                    const rawValue = attr.values[index];
                    const attrName = attr.attribute;
                    const needsScaling = ['NDVI', 'EVI'].includes(attrName);
                    
                    let value = rawValue;
                    if (rawValue === null || rawValue === undefined || rawValue <= -3000) {
                        value = ''; 
                    } else if (needsScaling) {
                        value = (rawValue / 10000).toFixed(4); 
                    }
                    row.push(value);
                });
                csvContent += row.join(separator) + "\n"; 
            });
            csvContent += "\n"; 
        });

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'series-temporais-export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleExportToPDF = async () => {
        if (selectedCharts.size === 0) {
            alert("Por favor, selecione pelo menos um gráfico para exportar.");
            return;
        }

        setIsExporting(true);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        let currentY = margin;

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Relatório de Séries Temporais', margin, currentY);

        currentY += 10;

        if (selectedCoords) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Coordenadas do Ponto:', margin, currentY);
            currentY += 6;

            pdf.text(`Lat: ${selectedCoords.lat.toFixed(6)}`, margin + 5, currentY);
            currentY += 6;
            pdf.text(`Lng: ${selectedCoords.lng.toFixed(6)}`, margin + 5, currentY);

            currentY += 10;
        }

        try {
            for (const chartId of selectedCharts) {
                const chartNode = chartRefs.current[chartId];
                if (!chartNode) continue;

                const canvas = await html2canvas(chartNode, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                });

                const imgData = canvas.toDataURL('image/png');
                const ratio = canvas.height / canvas.width;
                const pdfHeight = pdfWidth * ratio;

                if (currentY + pdfHeight + margin > pdfPageHeight) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth, pdfHeight);
                currentY += pdfHeight + 10;
            }

            pdf.save("relatorio-series-temporais.pdf");
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar PDF. Veja o console.");
        } finally {
            setIsExporting(false);
        }
    };



    return (
        <div className="page-container">

            {/* --- Cabeçalho --- */}
            <div className="dashboard-header">
                <div className="title-block">
                    <h1>Análise de Séries Temporais (WTSS)</h1>
                    <p>
                        Selecione e exporte os gráficos acumulados de suas buscas.
                        Passe o mouse nos pontos para ver thumbnails STAC.
                    </p>

                    {/* LEGENDA NDVI / EVI */}
                    <div className="index-legend">
                        <p>
                            <span className="legend-icon ndvi-icon"></span>
                            <strong>NDVI:</strong> índice clássico que mede o vigor da vegetação (varia entre -1 e 1).
                        </p>

                        <p>
                            <span className="legend-icon evi-icon"></span>
                            <strong>EVI:</strong> índice aprimorado que reduz saturação e efeitos atmosféricos.
                        </p>
                    </div>

                </div>

                <div className="export-controls">
                    <button 
                        onClick={handleExportToCSV}
                        disabled={selectedCharts.size === 0}
                        className="export-csv-button"
                        style={{ marginRight: '10px' }} 
                    >
                        Exportar CSV
                    </button>
                    <button 
                        onClick={handleExportToPDF}
                        disabled={isExporting || selectedCharts.size === 0}
                        className="export-pdf-button"
                    >
                        {isExporting ? "Exportando PDF..." : `Exportar ${selectedCharts.size} Gráfico(s) (PDF)`}
                    </button>
                </div>
            </div>



            {/* --- Sem resultados --- */}
            {chartsToRender.length === 0 && (
                <div className="no-results-box">
                    <h3>Nenhuma Série Temporal encontrada.</h3>
                    <p>
                        Vá ao <Link to="/">Mapa</Link> e realize uma busca STAC+WTSS.
                    </p>
                </div>
            )}



            {/* --- Grid de gráficos --- */}
            <div className="charts-grid">
                {chartsToRender.map(({ id, chartData }) => {
                    const selected = selectedCharts.has(id);

                    return (
                        <div key={id} className="chart-grid-item-wrapper">
                            
                            <div
                                className="chart-container"
                                style={{ cursor: 'pointer' }}
                            >
                                <div 
                                    className="chart-click-area"
                                    style={{ height: '350px' }}
                                    ref={el => chartRefs.current[id] = el}
                                >
                                    <Line 
                                        data={chartData}
                                        options={getChartOptions(id, () => setSelectedChartData({ id, chartData }), false)}
                                    />
                                </div>
                            </div>

                            {/* Container dos botões de ação */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                
                                <button
                                    className={`chart-select-button ${selected ? "selected" : ""}`}
                                    onClick={() => handleSelectionChange(id)}
                                    style={{ flex: 1 }}
                                >
                                    {selected ? "Selecionado" : `Selecionar ${id}`}
                                </button>

                                <button
                                    className="chart-select-button"
                                    onClick={() => setSelectedChartData({ id, chartData })}
                                    style={{ 
                                        flex: 0.3, 
                                        backgroundColor: '#546E7A', 
                                        borderColor: '#546E7A',
                                        color: 'white',
                                        minWidth: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Expandir Gráfico"
                                >
                                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⤢</span>
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>



            {/* --- Modal --- */}
            {selectedChartData && (
                <div className="dashboard-modal-overlay" onClick={closeModal}>
                    <div className="dashboard-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="dashboard-modal-close" onClick={closeModal}>
                            &times;
                        </button>

                        <div className="dashboard-modal-chart-container">
                            <Line 
                                data={selectedChartData.chartData}
                                // --- AQUI: Passamos showThumbnails = true ---
                                // No popup, queremos o tooltip customizado (caixa preta) com a imagem
                                options={getChartOptions(selectedChartData.id, null, true)}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DashboardPage;