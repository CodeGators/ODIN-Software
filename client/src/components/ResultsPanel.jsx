import React from 'react';
// Importa o arquivo de estilos que acabamos de criar
import './ResultsPanel.css'; 

import LoadingSpinner from './LoadingSpiner';
// ... o resto do seu código

// Recebe as props necessárias
const ResultsPanel = ({
  isLoading,
  loadingProgress,
  searchResults,
  groupedResults,
  openResultGroups,
  selectedItemDetails,
  collections, // Necessário para buscar o título da coleção
  wtssCompatibleCollections, // Para mostrar o botão WTSS
  toggleResultGroup,
  handleResultClick,
  handleGetTimeseries,
}) => {
  return (
    <div className="results-section">
      <h3>Resultados da Busca</h3>
      <div id="search-results-list">
        {isLoading ? (
          <div className="loading-with-progress">
            <LoadingSpinner />
            <p>Carregando... {Math.round(loadingProgress)}%</p>
          </div>
        ) : searchResults.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>
            Nenhum resultado encontrado.
          </p>
        ) : (
          Object.entries(groupedResults).map(([collectionName, features]) => {
            const isOpen = openResultGroups.has(collectionName);
            // Encontra o título original da coleção se agrupado (ex: AMAZONIA)
            // Ou usa o próprio nome do grupo se não for um agrupamento especial
            const collectionTitle = collections.find(c => c.id === features[0]?.collection)?.title || collectionName;
            
            return (
              <div
                key={collectionName} // Usa o nome do grupo como chave
                className={`result-group ${isOpen ? 'is-open' : ''}`}
              >
                <div
                  className="result-group-header"
                  onClick={() => toggleResultGroup(collectionName)}
                >
                  <div className="result-group-title">
                    {/* --- INÍCIO DA MODIFICAÇÃO: Truncamento e Tooltip --- */}
                    <strong title={collectionTitle} className="collection-title-short">
                      {collectionTitle}
                    </strong>
                    {/* --- FIM DA MODIFICAÇÃO --- */}
                    <span className="result-count">({features.length})</span>
                  </div>
                  <span className="accordion-icon">›</span>
                </div>
                <div className="result-group-items">
                  <div className="result-items-wrapper">
                    {features.map(feature => (
                      <div
                        key={feature.id}
                        className={`result-item ${selectedItemDetails?.id === feature.id ? 'active' : ''}`}
                        onClick={() => handleResultClick(feature)}
                      >
                        <div className="img-placeholder">IMG</div>
                        <div className="result-info">
                          <small>Nuvens:</small>
                          <strong>
                            {feature.cloud_cover?.toFixed(2) ?? 'N/A'}%
                          </strong>
                          <small>Data:</small>
                          <strong>
                            {/* Formata a data de forma segura */}
                            {feature.date && !isNaN(new Date(feature.date)) 
                              ? new Date(feature.date).toLocaleDateString() 
                              : 'Data inválida'}
                          </strong>
                        </div>
                        {wtssCompatibleCollections.includes(feature.collection) && (
                          <button
                            className="download-button-table"
                            style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                            title="Analisar Série Temporal (WTSS)"
                            onClick={(e) => {
                              e.stopPropagation(); // Evita que o clique no botão selecione o item
                              handleGetTimeseries(feature);
                            }}
                          >
                            WTSS
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;