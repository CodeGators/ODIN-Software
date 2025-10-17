import React from 'react';
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

const TimeseriesChart = ({ timeseriesData }) => {
  if (!timeseriesData || !timeseriesData.result) {
    return <p>Carregando dados da série temporal...</p>;
  }

  const { timeline, attributes } = timeseriesData.result;

  // Mapeia cada atributo para um dataset do gráfico
  const datasets = attributes.map((attr, index) => {
    // Alguns atributos (como NDVI/EVI) precisam ser escalados
    const needsScaling = ['NDVI', 'EVI'].includes(attr.attribute);
    const values = attr.values.map(v => needsScaling ? v / 10000 : v);
    
    return {
      label: attr.attribute,
      data: values,
      borderColor: chartColors[index % chartColors.length], // Pega uma cor da paleta
      backgroundColor: chartColors[index % chartColors.length].replace(')', ', 0.5)'), // Adiciona transparência
      tension: 0.1,
    };
  });

  const data = {
    labels: timeline.map(date => new Date(date).toLocaleDateString()),
    datasets: datasets, // Usa os datasets gerados
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Série Temporal para o Ponto (${timeseriesData.result.coordinates.latitude.toFixed(4)}, ${timeseriesData.result.coordinates.longitude.toFixed(4)})`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Valores dos Atributos'
        }
      }
    }
  };

  return <Line options={options} data={data} />;
};

export default TimeseriesChart;