import React from 'react';
import { Link } from 'react-router-dom';

const DataPage = ({ searchResults }) => {

  const handleDownload = (item) => {
    const jsonData = JSON.stringify(item, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.id}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="page-container">
      <h1>Tabela de Dados</h1>
      <p>Resultados detalhados da sua busca. Clique em "Baixar JSON" para salvar os dados de uma imagem.</p>
      
      {searchResults.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Coleção</th>
                <th>Data</th>
                <th>Nuvens (%)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map(item => (
                <tr key={item.id}>
                  <td>{item.collection}</td>
                  <td>{item.date}</td>
                  <td>{item.cloud_cover?.toFixed(2) ?? 'N/A'}</td>
                  <td>
                    <button className="download-button-table" onClick={() => handleDownload(item)}>Baixar JSON</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results-box">
          <h3>Nenhum resultado para exibir.</h3>
          <p>Faça uma busca na <Link to="/">página do Mapa</Link> primeiro.</p>
        </div>
      )}
    </div>
  );
};

export default DataPage;