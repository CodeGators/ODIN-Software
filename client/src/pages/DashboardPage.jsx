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

import './DashboardPage.css'; // Este é o ÚNICO arquivo CSS que você precisa

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

/**
 * Função auxiliar para processar UM objeto de série temporal
 */
const processTimeseries = (tsObject) => {
    // ... (lógica de processamento idêntica)
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
            const values = valuesArray.map(v => (v === null || v === undefined) ? null : (needsScaling ? v / 10000 : v));
            return {
                label: `${attrName} (${wtssCollectionId})`,
                data: values,
                borderColor: colorInfo.border,
                backgroundColor: colorInfo.background,
                tension: 0.1,
                fill: false,
                spanGaps: true,
            };
        }).filter(Boolean); 
        if (datasets.length === 0) return null;
        return { labels, datasets }; 
    } catch (e) {
        console.error(`Erro CRÍTICO ao processar dados WTSS para ${wtssCollectionId}:`, e, tsObject);
        return null;
    }
};

/**
 * Função auxiliar para gerar opções do gráfico
 */
const wtssChartOptions = (collectionId) => ({
    // ... (lógica de opções idêntica)
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { 
            position: 'top', 
            labels: { 
                color: '#000000',
                boxWidth: 20, 
                padding: 10
            } 
        },
        title: {
            display: true,
            text: `Série Temporal: ${collectionId}`, 
            color: '#000000',
            font: { size: 16 }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) { label += ': '; }
                    if (context.parsed.y !== null) { label += context.parsed.y.toFixed(4); }
                    return label;
                }
            }
        }
    },
    scales: {
        y: { beginAtZero: false, ticks: { color: '#000000' }, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
        x: { ticks: { color: '#000000' }, grid: { color: 'rgba(0, 0, 0, 0.1)' } }
    }
});


// --- Componente DashboardPage ---
const DashboardPage = ({ timeseriesData = [], selectedCoords }) => { 
    
    const [selectedChartData, setSelectedChartData] = useState(null);
    const [selectedCharts, setSelectedCharts] = useState(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const chartRefs = useRef({});

    // Processa TODOS os dados de 'timeseriesData'
    const chartsToRender = useMemo(() => {
        if (!Array.isArray(timeseriesData)) return [];
        return timeseriesData.map(tsObject => ({
            id: tsObject.coverage,
            chartData: processTimeseries(tsObject) 
        })).filter(c => c.chartData !== null); 
    }, [timeseriesData]); 

    const closeModal = () => {
        setSelectedChartData(null);
    };

    const handleSelectionChange = (chartId) => {
        setSelectedCharts(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(chartId)) {
                newSelected.delete(chartId);
            } else {
                newSelected.add(chartId);
            }
            return newSelected;
        });
    };

    // --- Função de Exportar PDF (sem alterações) ---
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

        if (selectedCoords && selectedCoords.lat != null && selectedCoords.lng != null) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Coordenadas do Ponto de Análise:', margin, currentY);
            currentY += 7; 
            pdf.setFont('helvetica', 'italic');
            pdf.text(`Latitude: ${selectedCoords.lat.toFixed(6)}`, margin + 5, currentY);
            currentY += 6; 
            pdf.text(`Longitude: ${selectedCoords.lng.toFixed(6)}`, margin + 5, currentY);
        }
        
        currentY += 12; 
        const chartsToExport = Array.from(selectedCharts);

        try {
            for (let i = 0; i < chartsToExport.length; i++) {
                const chartId = chartsToExport[i];
                const chartNode = chartRefs.current[chartId]; 
                if (chartNode) {
                    const canvas = await html2canvas(chartNode, {
                        scale: 2, 
                        useCORS: true,
                        backgroundColor: '#ffffff',
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
            }
            pdf.save('relatorio-series-temporais.pdf');
        } catch (error) {
            console.error("Erro ao gerar o PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console.");
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <div className="page-container">
            {/* --- Cabeçalho Estruturado --- */}
            <div className="dashboard-header">
                <div className="title-block">
                    <h1>Análise de Séries Temporais (WTSS)</h1>
                    <p>
                        Selecione e exporte os gráficos acumulados de suas buscas.
                    </p>
                </div>
                <div className="export-controls">
                    <button 
                        onClick={handleExportToPDF} 
                        disabled={isExporting || selectedCharts.size === 0}
                        className="export-pdf-button"
                    >
                        {isExporting 
                            ? 'Exportando...' 
                            : `Exportar ${selectedCharts.size} Gráfico(s) para PDF`
                        }
                    </button>
                </div>
            </div>

            {/* --- Renderização Condicional --- */}
            {chartsToRender.length === 0 && (
                <div className="no-results-box" style={{ gridColumn: '1 / -1' }}>
                    <h3>Nenhuma Série Temporal para exibir.</h3>
                    <p>
                        Vá à <Link to="/">página do Mapa</Link>, faça uma busca STAC
                        (os dados WTSS serão carregados automaticamente) ou clique em "Analisar Série"
                        em um item WTSS.
                    </p>
                </div>
            )}

            {/* --- GRÁFICOS PEQUENOS LADO A LADO --- */}
            <div className="charts-grid"> 
                {chartsToRender.map(({ id, chartData }) => {
                    const isSelected = selectedCharts.has(id);
                    return (
                        // -------------------------------------------
                        // --- (NOVA ESTRUTURA) Wrapper do Gráfico ---
                        // -------------------------------------------
                        <div key={id} className="chart-grid-item-wrapper">
                            
                            {/* O Card do Gráfico (clicável para o modal) */}
                            <div
                                className="chart-container" 
                                onClick={() => setSelectedChartData({ id, chartData })}
                                style={{ cursor: 'pointer' }}
                            >
                                <div 
                                    className="chart-click-area"
                                    style={{ height: '350px', position: 'relative' }} 
                                    ref={(el) => (chartRefs.current[id] = el)} 
                                >
                                    <Line 
                                        data={chartData} 
                                        options={wtssChartOptions(id)}
                                    />
                                </div>
                            </div>
                            
                            {/* O Botão de Seleção (EXTERNO) */}
                            <button
                                className={`chart-select-button ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectionChange(id)}
                            >
                                {isSelected ? 'Selecionado' : `Selecionar ${id}`}
                            </button>

                        </div>
                    );
                })}
            </div>

            {/* --- Modal (sem alterações) --- */}
            {selectedChartData && (
                <div className="dashboard-modal-overlay" onClick={closeModal}>
                    <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="dashboard-modal-close" onClick={closeModal}>&times;</button>
                        <div className="dashboard-modal-chart-container">
                            <Line 
                                data={selectedChartData.chartData} 
                                options={wtssChartOptions(selectedChartData.id)} 
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}; // Fim do DashboardPage

export default DashboardPage;