// src/pages/DashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement, // Para gráfico de linha
  LineElement   // Para gráfico de linha
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2'; // Importa Line

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement
);

const generateColor = (index) => {
  const hue = (index * 137.5) % 360;
  return { background: `hsla(${hue}, 70%, 60%, 0.7)`, border: `hsla(${hue}, 70%, 60%, 1)` };
};

const DashboardPage = ({ searchResults, collections = [], timeseriesData = null }) => {

  console.log("--- DashboardPage Props Recebidas ---");
  console.log("searchResults:", searchResults);
  console.log("collections:", collections);
  console.log("timeseriesData:", timeseriesData);

  // --- Lógica Gráficos STAC (Pizza, Barras Nuvens, Barras Temporal) ---
  // ... (código idêntico à versão anterior, sem alterações aqui) ...
  const collectionCounts = Array.isArray(searchResults) ? searchResults.reduce((acc, item) => {
    const collectionInfo = Array.isArray(collections) ? collections.find(c => c.id === item.collection) : null;
    const title = collectionInfo ? collectionInfo.title : item.collection;
    const key = title || 'Desconhecido';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}) : {};
  const collectionLabels = Object.keys(collectionCounts);
  const collectionValues = Object.values(collectionCounts);
  const pieData = { labels: collectionLabels, datasets: [ { label: '# de Imagens', data: collectionValues, backgroundColor: collectionValues.map((_, i) => generateColor(i).background), }, ], };
  const cloudCoverByCollectionTitle = collectionLabels.reduce((acc, title) => {
      const itemsForTitle = Array.isArray(searchResults) ? searchResults.filter(item => { const collectionInfo = Array.isArray(collections) ? collections.find(c => c.id === item.collection) : null; const itemTitle = collectionInfo ? collectionInfo.title : item.collection; return (itemTitle || 'Desconhecido') === title; }) : [];
      if (itemsForTitle.length === 0) acc[title] = 0; else { const totalCloudCover = itemsForTitle.reduce((sum, item) => sum + (item.properties?.['eo:cloud_cover'] ?? item.cloud_cover ?? 0), 0); const avg = totalCloudCover / itemsForTitle.length; acc[title] = isNaN(avg) ? 0 : avg; } return acc;
  }, {});
  const barDataValues = collectionLabels.map(title => cloudCoverByCollectionTitle[title]);
  const barData = { labels: collectionLabels, datasets: [ { label: 'Média de Cobertura de Nuvens (%)', data: barDataValues, backgroundColor: collectionLabels.map((_, i) => generateColor(i).background), } ] };
  const temporalCounts = Array.isArray(searchResults) ? searchResults.reduce((acc, item) => { try { const dateStr = item.properties?.datetime || item.date; if (!dateStr) return acc; const date = new Date(dateStr); if (isNaN(date.getTime())) { console.warn("Data inválida:", item); return acc; } const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; acc[monthYear] = (acc[monthYear] || 0) + 1; } catch (e) { console.error("Erro data item:", item, e); } return acc; }, {}) : {};
  const sortedMonths = Object.keys(temporalCounts).sort();
  const temporalDataValues = sortedMonths.map(month => temporalCounts[month]);
  const temporalBarData = { labels: sortedMonths, datasets: [ { label: 'Contagem de Imagens por Mês', data: temporalDataValues, backgroundColor: 'rgba(153, 102, 255, 0.7)', } ] };


  // --- REVERTIDO e CORRIGIDO: Lógica para Gráfico de Linha WTSS (esperando ARRAY attributes) ---
  let wtssLineData = null;
  // Verifica se a estrutura esperada (attributes como ARRAY não vazio) existe
  if (timeseriesData?.result?.timeline &&
      Array.isArray(timeseriesData.result.attributes) && // <-- Verificação principal
      timeseriesData.result.attributes.length > 0 &&     // <-- Garante que não está vazio
      Array.isArray(timeseriesData.result.timeline)) {
      console.log("DashboardPage: Encontrada estrutura WTSS esperada (attributes como array)."); // DEBUG
      try {
          const labels = timeseriesData.result.timeline.map(dateStr => new Date(dateStr).toLocaleDateString());
          // Agora 'attributes' é o ARRAY
          const attributesArray = timeseriesData.result.attributes;
          console.log("DashboardPage: Array de atributos WTSS:", attributesArray); // DEBUG: Mostra o array

          // Mapeia sobre o ARRAY de atributos
          const datasets = attributesArray.map((attrItem, index) => {
              // Verifica se o item tem a estrutura esperada { attribute: 'Nome', values: [...] }
              if (!attrItem || typeof attrItem.attribute !== 'string' || !Array.isArray(attrItem.values)) {
                  console.warn("Item de atributo WTSS inválido (estrutura incorreta):", attrItem); // DEBUG
                  return null; // Pula este dataset se a estrutura estiver errada
              }

              const attrName = attrItem.attribute; // Pega o nome
              const valuesArray = attrItem.values; // Pega o array de valores

              const colorInfo = generateColor(index + (collectionLabels?.length || 0));
              const needsScaling = ['NDVI', 'EVI'].includes(attrName);
              // Processa o valuesArray
              const values = valuesArray.map(v => (v === null || v === undefined) ? null : (needsScaling ? v / 10000 : v));

              console.log(`DashboardPage: Gerando dataset para ${attrName}`, values); // DEBUG

              return {
                  label: attrName, // Usa attrItem.attribute
                  data: values,    // Usa values processados
                  borderColor: colorInfo.border,
                  backgroundColor: colorInfo.background,
                  tension: 0.1,
                  fill: false,
                  spanGaps: true,
              };
          }).filter(Boolean); // Remove datasets nulos

          console.log("DashboardPage: Datasets gerados:", datasets); // DEBUG

          if (datasets.length > 0) {
              wtssLineData = { labels, datasets };
          } else {
              console.warn("Nenhum dataset WTSS válido foi gerado a partir de attributes:", attributesArray);
          }

      } catch (e) {
          console.error("Erro CRÍTICO ao processar dados WTSS:", e, timeseriesData);
          wtssLineData = null;
      }
  } else if (timeseriesData) {
      console.warn("Estrutura INESPERADA para timeseriesData (esperava result.attributes como array não vazio):", timeseriesData);
  }


  // --- Opções dos gráficos ---
  // ... (código das opções idêntico) ...
  const chartOptions = (title) => ({ /* ... */ });
  const cloudChartOptions = (title) => ({ /* ... */ });
  const wtssChartOptions = (title) => ({ /* ... */ });


  // --- DEBUG: Log antes do return ---
  console.log("DashboardPage: Vai renderizar com wtssLineData:", wtssLineData);

  return (
    // ... (JSX idêntico à versão anterior) ...
    <div className="page-container">
        <h1>Dashboard de Resultados</h1>
        <p>Visualização dos dados encontrados na sua última busca.</p>

        {/* Gráficos STAC */}
        {Array.isArray(searchResults) && searchResults.length > 0 ? (
            <div className="charts-grid">
            {/* ... (Pie, Bar Nuvens, Bar Temporal) ... */}
            <div className="chart-container" style={{ height: '400px' }}> <Pie data={pieData} options={chartOptions('Imagens por Satélite')} /> </div>
            <div className="chart-container" style={{ height: '400px' }}> <Bar data={barData} options={cloudChartOptions('Média de Nuvens por Satélite (%)')} /> </div>
            <div className="chart-container" style={{ height: '400px' }}> <Bar data={temporalBarData} options={chartOptions('Distribuição Temporal dos Resultados')} /> </div>
            </div>
        ) : ( <div className="no-results-box"> {/* ... */} </div> )}

        {/* Gráfico WTSS */}
        <h2 style={{ /* ... */ }}> Análise de Série Temporal (WTSS) </h2>
        {wtssLineData ? (
            <div className="chart-container" style={{ height: '400px', marginTop: '20px', gridColumn: '1 / -1' }}>
            <Line data={wtssLineData} options={wtssChartOptions('Série Temporal no Ponto Selecionado')} />
            </div>
        ) : (
            <div className="no-results-box" style={{ /* ... */ }}>
            <h3>Nenhuma Série Temporal para exibir.</h3>
            {timeseriesData && !wtssLineData && <p style={{color: 'red', marginTop: '10px'}}>Dados recebidos, mas houve erro no processamento (verifique o console).</p>}
            <p> Para ver este gráfico, vá à <Link to="/">página do Mapa</Link>, clique em um resultado WTSS e analise os dados. </p>
            </div>
        )}
    </div>
  );
}; // Fim do DashboardPage

export default DashboardPage;

// --- Verificações Adicionais ---
// ... (comentários idênticos) ...