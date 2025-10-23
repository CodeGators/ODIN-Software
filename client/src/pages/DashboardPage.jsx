import React from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashboardPage = ({ searchResults }) => {
  // Processa dados para o gráfico de pizza (Contagem por coleção)
  const collectionCounts = searchResults.reduce((acc, item) => {
    acc[item.collection] = (acc[item.collection] || 0) + 1;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(collectionCounts),
    datasets: [
      {
        label: '# de Imagens',
        data: Object.values(collectionCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
      },
    ],
  };

  // Processa dados para o gráfico de barras (Cobertura de nuvens por coleção)
  const cloudCoverByCollection = Object.keys(collectionCounts).map(collection => {
      const items = searchResults.filter(item => item.collection === collection);
      const totalCloudCover = items.reduce((sum, item) => sum + (item.cloud_cover || 0), 0);
      return totalCloudCover / items.length; // Média
  });

  const barData = {
      labels: Object.keys(collectionCounts),
      datasets: [
          {
              label: 'Média de Cobertura de Nuvens (%)',
              data: cloudCoverByCollection,
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
          }
      ]
  }

  return (
    <div className="page-container">
      <h1>Dashboard de Resultados</h1>
      <p>Visualização dos dados encontrados na sua última busca.</p>

      {searchResults.length > 0 ? (
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Imagens por Satélite</h3>
            <Pie data={pieData} />
          </div>
          <div className="chart-container">
            <h3>Média de Nuvens por Satélite</h3>
            <Bar data={barData} />
          </div>
        </div>
      ) : (
        <div className="no-results-box">
          <h3>Nenhum dado para visualizar.</h3>
          <p>Faça uma busca na <Link to="/">página do Mapa</Link> para gerar os gráficos.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;