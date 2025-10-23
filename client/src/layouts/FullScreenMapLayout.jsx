import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import FilterPanel from '../components/FilterPanel'; // Importa o painel de filtros
import ResultsPanel from '../components/ResultsPanel'; // Importa o painel de resultados
import './FullScreenMapLayout.css'; // Importa o CSS

// Recebe os children (o mapa) e todas as props para os painéis
const FullScreenMapLayout = ({ children, ...panelProps }) => {
  const [isFilterVisible, setIsFilterVisible] = useState(true); // Começa visível
  const [isResultsVisible, setIsResultsVisible] = useState(true); // Começa visível

  // Refs para os nós dos painéis arrastáveis
  const filterPanelRef = useRef(null);
  const resultsPanelRef = useRef(null);

  return (
    <div className="fullscreen-map-layout">
      {/* Botões para controlar visibilidade (posicionados via CSS) */}
      <div className="floating-panel-controls">
        <button 
          onClick={() => setIsFilterVisible(!isFilterVisible)} 
          className={`control-button ${isFilterVisible ? 'active' : ''}`}
          title={isFilterVisible ? "Ocultar Filtros" : "Mostrar Filtros"}
        >
          Filtros {/* Substituir por ícone depois */}
        </button>
        <button 
          onClick={() => setIsResultsVisible(!isResultsVisible)} 
          className={`control-button ${isResultsVisible ? 'active' : ''}`}
          title={isResultsVisible ? "Ocultar Resultados" : "Mostrar Resultados"}
        >
          Resultados {/* Substituir por ícone depois */}
        </button>
      </div>

      {/* O mapa é renderizado como 'children' */}
      {children} 
      
      {/* Painel de Filtros Flutuante */}
      {isFilterVisible && (
        <Draggable nodeRef={filterPanelRef} handle=".drag-handle" bounds="parent">
          <div ref={filterPanelRef} className="floating-panel filter-panel">
            <div className="drag-handle">
              <span>Filtros e Busca</span>
              <button onClick={() => setIsFilterVisible(false)} className="close-panel-button">&times;</button>
            </div>
            <div className="panel-content">
              {/* Passa todas as props recebidas para o FilterPanel */}
              <FilterPanel {...panelProps} /> 
            </div>
          </div>
        </Draggable>
      )}

      {/* Painel de Resultados Flutuante */}
      {isResultsVisible && (
        <Draggable nodeRef={resultsPanelRef} handle=".drag-handle" bounds="parent">
          <div ref={resultsPanelRef} className="floating-panel results-panel">
            <div className="drag-handle">
              <span>Resultados</span>
              <button onClick={() => setIsResultsVisible(false)} className="close-panel-button">&times;</button>
            </div>
            <div className="panel-content">
              {/* Passa todas as props recebidas para o ResultsPanel */}
              <ResultsPanel {...panelProps} /> 
            </div>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default FullScreenMapLayout;