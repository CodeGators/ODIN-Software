import React, { useMemo } from 'react'; // Removido useRef
import { Link } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
// Removido Draggable e ResizableBox

// =================== MUDANÇA AQUI ===================
// Importando o novo tema fixo
import './FixedDashboard.css'; 

// Registrando componentes
ChartJS.register(
  Tooltip, Legend, CategoryScale, 
  LinearScale, BarElement, Title, LineElement, PointElement
);

// O componente "Widget" foi removido

// Componente da Página
const DashboardPage = ({ searchResults = [] }) => {

  // --- Processamento de Dados (sem alteração) ---

  const barData = useMemo(() => {
    // ... (seu código de barData, sem alteração)
    const counts = {};
    const cloudSums = {};
    searchResults.forEach(item => {
      counts[item.collection] = (counts[item.collection] || 0) + 1;
      cloudSums[item.collection] = (cloudSums[item.collection] || 0) + (item.cloud_cover || 0);
    });
    const labels = Object.keys(counts);
    const avgData = labels.map(label => (counts[label] > 0 ? cloudSums[label] / counts[label] : 0));
    return {
      labels: labels,
      datasets: [{
        label: 'Média de Cobertura de Nuvens (%)',
        data: avgData,
        backgroundColor: [
          'rgba(42, 125, 75, 0.7)', 'rgba(52, 152, 219, 0.7)',
          'rgba(243, 156, 18, 0.7)', 'rgba(211, 166, 131, 0.7)',
          'rgba(149, 165, 166, 0.7)',
        ],
        borderColor: [
          'rgb(42, 125, 75)', 'rgb(52, 152, 219)',
          'rgb(243, 156, 18)', 'rgb(211, 166, 131)',
          'rgb(149, 165, 166)',
        ],
        borderWidth: 1
      }]
    };
  }, [searchResults]);

  const stats = useMemo(() => {
    if (searchResults.length === 0) return null;
    const dates = searchResults.map(item => new Date(item.date)).sort((a, b) => a - b);
    const minDate = dates[0]?.toLocaleDateString('pt-BR');
    const maxDate = dates[dates.length - 1]?.toLocaleDateString('pt-BR');
    const avgCloud = searchResults.reduce((sum, item) => sum + (item.cloud_cover || 0), 0) / searchResults.length;
    
    return {
      total: searchResults.length,
      minDate,
      maxDate,
      avgCloud: avgCloud.toFixed(2)
    };
  }, [searchResults]);

  const timeData = useMemo(() => {
    // ... (seu código de timeData, sem alteração)
    const countsByDate = searchResults.reduce((acc, item) => {
      const date = new Date(item.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const sortedDates = Object.keys(countsByDate).sort();
    return {
      labels: sortedDates,
      datasets: [{
        label: 'Imagens por Dia',
        data: sortedDates.map(date => countsByDate[date]),
        borderColor: 'rgb(42, 125, 75)',
        backgroundColor: 'rgba(42, 125, 75, 0.3)',
        pointBackgroundColor: 'rgb(42, 125, 75)',
        pointBorderColor: 'rgb(42, 125, 75)',
        pointHoverBackgroundColor: 'rgb(52, 152, 219)',
        pointHoverBorderColor: 'rgb(52, 152, 219)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [searchResults]);

  const chartOptions = (titleText) => ({
    // ... (seu código de chartOptions, sem alteração)
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'var(--theme-text-light)', font: { family: 'Arial, sans-serif' }}},
      title: { display: true, text: titleText, color: 'var(--theme-text-dark)', font: { family: 'Arial, sans-serif', size: 16, weight: 'bold' }}
    },
    scales: {
      x: { grid: { color: 'rgba(0, 0, 0, 0.05)', borderColor: 'var(--theme-border-soft)'}, ticks: { color: 'var(--theme-text-light)', font: { family: 'Arial, sans-serif' }}},
      y: { grid: { color: 'rgba(0, 0, 0, 0.05)', borderColor: 'var(--theme-border-soft)'}, ticks: { color: 'var(--theme-text-light)', font: { family: 'Arial, sans-serif' }}}
    }
  });

  // =================== NOVO LAYOUT DE RENDERIZAÇÃO ===================
  return (
    <div className="dashboard-page-container">
      {searchResults.length > 0 ? (
        // Usamos o CSS Grid
        <div className="dashboard-grid">
          
          {/* --- Widget de Resumo Fixo --- */}
          <div className="widget">
            <div className="widget-header">Resumo da Busca</div>
            <div className="widget-content stats-widget">
              
              <div className="stat-item">
                <span>Total de Imagens</span>
                {/* Aplicando a cor azul */}
                <strong className="stat-value-blue">{stats.total}</strong>
              </div>
              
              <div className="stat-item">
                <span>Período</span>
                {/* Aplicando a cor verde */}
                <strong className="stat-value-green">{stats.minDate} - {stats.maxDate}</strong>
              </div>

              <div className="stat-item">
                <span>Média de Nuvens</span>
                {/* Aplicando a cor laranja */}
                <strong className="stat-value-orange">{stats.avgCloud} %</strong>
              </div>

            </div>
          </div>
          
          {/* --- Widget de Barras Fixo --- */}
          <div className="widget">
            <div className="widget-header">Média de Nuvens por Satélite</div>
            <div className="widget-content">
              <div className="chart-wrapper">
                <Bar 
                  data={barData} 
                  options={chartOptions('Média de Nuvens por Satélite')} 
                />
              </div>
            </div>
          </div>
          
          {/* --- Widget de Linha Fixo --- */}
          <div className="widget">
            <div className="widget-header">Imagens ao Longo do Tempo</div>
            <div className="widget-content">
              <div className="chart-wrapper">
                <Line 
                  data={timeData} 
                  options={chartOptions('Imagens ao Longo do Tempo')} 
                />
              </div>
            </div>
          </div>

        </div>
      ) : (
        // Mensagem de "Sem resultados"
        <div className="no-results-box">
          <h3>Nenhum dado para visualizar.</h3>
          <p>Faça uma busca na <Link to="/">página do Mapa</Link> para gerar os gráficos.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;