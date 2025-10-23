import React, { useState, useRef, useCallback } from 'react'; // Adiciona useCallback
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import FilterPanel from '../components/FilterPanel';
import ResultsPanel from '../components/ResultsPanel';
import './FullScreenMapLayout.css';
import 'react-resizable/css/styles.css';

const FullScreenMapLayout = ({ children, ...panelProps }) => {
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [isResultsVisible, setIsResultsVisible] = useState(true);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(false);

  // Mantemos o state, mas talvez não usemos diretamente no ResizableBox
  const [filterPanelSize, setFilterPanelSize] = useState({ width: 400, height: 500 });
  const [resultsPanelSize, setResultsPanelSize] = useState({ width: 350, height: 450 });

  const filterWrapperRef = useRef(null);
  const resultsWrapperRef = useRef(null);
  // Refs para os divs internos que terão estilos aplicados
  const filterInnerRef = useRef(null);
  const resultsInnerRef = useRef(null);

  // --- NOVO: Handler para onResize (contínuo) usando useCallback ---
  const onFilterResize = useCallback((event, { size }) => {
    if (filterInnerRef.current) {
      // Aplica o tamanho diretamente ao estilo do wrapper interno
      filterInnerRef.current.style.width = `${size.width}px`;
      filterInnerRef.current.style.height = `${size.height}px`;
    }
     // Opcional: Atualizar o estado aqui também, se necessário para outras lógicas
     // setFilterPanelSize({ width: size.width, height: size.height });
  }, []); // Sem dependências por enquanto

  const onResultsResize = useCallback((event, { size }) => {
    if (resultsInnerRef.current) {
      resultsInnerRef.current.style.width = `${size.width}px`;
      resultsInnerRef.current.style.height = `${size.height}px`;
    }
     // Opcional: Atualizar o estado
     // setResultsPanelSize({ width: size.width, height: size.height });
  }, []); // Sem dependências

  // Handlers para onResizeStop (agora apenas para garantir estado final, se necessário)
  const onFilterResizeStop = useCallback((event, { size }) => {
    const newWidth = Math.max(250, size.width);
    const newHeight = Math.max(isFilterCollapsed ? 40 : 150, size.height);
    console.log('Filter Resize Stop - Final Size:', { width: newWidth, height: newHeight });
    setFilterPanelSize({ width: newWidth, height: newHeight }); // Atualiza o estado final
     // Garante que o estilo final esteja correto (caso onResize falhe no último frame)
     if (filterInnerRef.current) {
        filterInnerRef.current.style.width = `${newWidth}px`;
        filterInnerRef.current.style.height = `${newHeight}px`;
     }
  }, [isFilterCollapsed]); // Depende do estado de colapso

  const onResultsResizeStop = useCallback((event, { size }) => {
    const newWidth = Math.max(250, size.width);
    const newHeight = Math.max(isResultsCollapsed ? 40 : 150, size.height);
    console.log('Results Resize Stop - Final Size:', { width: newWidth, height: newHeight });
    setResultsPanelSize({ width: newWidth, height: newHeight }); // Atualiza o estado final
    if (resultsInnerRef.current) {
        resultsInnerRef.current.style.width = `${newWidth}px`;
        resultsInnerRef.current.style.height = `${newHeight}px`;
     }
  }, [isResultsCollapsed]); // Depende do estado de colapso

  // Funções de toggle (mantidas)
  const toggleFilterVisible = () => setIsFilterVisible(v => !v);
  const toggleResultsVisible = () => setIsResultsVisible(v => !v);
  const toggleFilterCollapse = () => setIsFilterCollapsed(c => !c);
  const toggleResultsCollapse = () => setIsResultsCollapsed(c => !c);

  return (
    <div className="fullscreen-map-layout">
      {/* Botões de Controle */}
       <div className="floating-panel-controls">
         <button onClick={toggleFilterVisible} className={`control-button ${isFilterVisible ? 'active' : ''}`} title={isFilterVisible ? "Ocultar Filtros" : "Mostrar Filtros"}> Filtros </button>
         <button onClick={toggleResultsVisible} className={`control-button ${isResultsVisible ? 'active' : ''}`} title={isResultsVisible ? "Ocultar Resultados" : "Mostrar Resultados"}> Resultados </button>
      </div>

      {children}

      {isFilterVisible && (
        <Draggable
          nodeRef={filterWrapperRef}
          handle=".drag-handle"
          bounds="parent"
          cancel=".react-resizable-handle"
        >
          {/* Wrapper externo para Draggable pegar a ref */}
          <div ref={filterWrapperRef} className="draggable-wrapper filter-draggable-wrapper">
            <ResizableBox
              // Usa o state para definir o tamanho inicial e após onResizeStop
              width={filterPanelSize.width}
              height={isFilterCollapsed ? 40 : filterPanelSize.height}
              minConstraints={[250, isFilterCollapsed ? 40 : 150]}
              maxConstraints={[800, isFilterCollapsed ? 40 : Infinity]}
              // --- USA onResize ---
              onResize={onFilterResize}
              onResizeStop={onFilterResizeStop}
              className={`floating-panel filter-panel ${isFilterCollapsed ? 'collapsed' : ''}`}
              resizeHandles={isFilterCollapsed ? [] : ['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n']}
              // O ResizableBox não precisa de ref direta aqui
            >
              {/* O conteúdo interno agora tem a ref para manipulação de estilo */}
              <div
                ref={filterInnerRef} // Ref para aplicar estilos do onResize
                className="panel-wrapper"
                // Aplica o tamanho inicial via style, será atualizado pelo onResize
                style={{ width: `${filterPanelSize.width}px`, height: isFilterCollapsed ? '40px' : `${filterPanelSize.height}px`, display: 'flex', flexDirection: 'column' }}
              >
                <div
                  className="drag-handle"
                  onDoubleClick={toggleFilterCollapse}
                >
                  <span>Filtros e Busca</span>
                  <button onClick={toggleFilterVisible} className="close-panel-button">&times;</button>
                </div>
                {!isFilterCollapsed && (
                  <div className="panel-content">
                    <FilterPanel {...panelProps} />
                  </div>
                )}
              </div>
            </ResizableBox>
          </div>
        </Draggable>
      )}

      {isResultsVisible && (
         <Draggable
            nodeRef={resultsWrapperRef}
            handle=".drag-handle"
            bounds="parent"
            cancel=".react-resizable-handle"
        >
          <div ref={resultsWrapperRef} className="draggable-wrapper results-draggable-wrapper">
            <ResizableBox
                width={resultsPanelSize.width}
                height={isResultsCollapsed ? 40 : resultsPanelSize.height}
                minConstraints={[250, isResultsCollapsed ? 40 : 150]}
                maxConstraints={[700, isResultsCollapsed ? 40 : Infinity]}
                onResize={onResultsResize} // Usa onResize
                onResizeStop={onResultsResizeStop}
                className={`floating-panel results-panel ${isResultsCollapsed ? 'collapsed' : ''}`}
                resizeHandles={isResultsCollapsed ? [] : ['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n']}
            >
              <div
                ref={resultsInnerRef} // Ref interna
                className="panel-wrapper"
                style={{ width: `${resultsPanelSize.width}px`, height: isResultsCollapsed ? '40px' : `${resultsPanelSize.height}px`, display: 'flex', flexDirection: 'column' }}
              >
                <div
                  className="drag-handle"
                  onDoubleClick={toggleResultsCollapse}
                >
                  <span>Resultados</span>
                  <button onClick={toggleResultsVisible} className="close-panel-button">&times;</button>
                </div>
                {!isResultsCollapsed && (
                  <div className="panel-content">
                    <ResultsPanel {...panelProps} />
                  </div>
                )}
              </div>
            </ResizableBox>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default FullScreenMapLayout;