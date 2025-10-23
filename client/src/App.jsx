// Arquivo: App.jsx
import React, { useState, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import TimeseriesChart from './components/TimeseriesChart';
import './components/Modal.css';
import Draggable from 'react-draggable';
import 'react-resizable/css/styles.css';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageOverlay, setImageOverlay] = useState(null);
  
  // --- NOVO: Estado para o modo da interface ---
  const [interfaceMode, setInterfaceMode] = useState('sidebar'); // 'sidebar' ou 'fullscreen'

  const nodeRef = useRef(null);

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value ? parseFloat(value) : null;
    setSelectedCoords(prev => ({ ...prev, [name === 'latitude' ? 'lat' : 'lng']: numericValue }));
  };

  const closeInfoBox = () => {
    setSelectedItemDetails(null);
    setImageOverlay(null);
  };

  // --- NOVO: Função para alternar o modo da interface ---
  const toggleInterfaceMode = () => {
    setInterfaceMode(prevMode => prevMode === 'sidebar' ? 'fullscreen' : 'sidebar');
    // Adicional: Pode ser útil fechar painéis abertos ao trocar de modo
    setSelectedItemDetails(null);
    setImageOverlay(null);
  };

  return (
    // Adiciona uma classe ao contêiner principal baseada no modo
    <div className={`app-container app-mode-${interfaceMode}`}> 
      <Header
        selectedCoords={selectedCoords}
        handleCoordinateChange={handleCoordinateChange}
        // --- NOVO: Passa props para o Header ---
        interfaceMode={interfaceMode}
        toggleInterfaceMode={toggleInterfaceMode}
      />
      <main className="page-content">
        <Routes>
          <Route
            path="/"
            element={<MapPage
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              selectedItemDetails={selectedItemDetails}
              setSelectedItemDetails={setSelectedItemDetails}
              selectedCoords={selectedCoords}
              setSelectedCoords={setSelectedCoords}
              setTimeseriesData={setTimeseriesData}
              setIsModalOpen={setIsModalOpen}
              imageOverlay={imageOverlay}
              setImageOverlay={setImageOverlay}
              // --- NOVO: Passa o modo para a MapPage ---
              interfaceMode={interfaceMode} 
            />}
          />
          <Route path="/data" element={<DataPage searchResults={searchResults} />} />
          <Route path="/dashboard" element={<DashboardPage searchResults={searchResults} />} />
        </Routes>
      </main>

      {/* InfoBox e Modal permanecem aqui, pois são sobreposições globais */}
      {selectedItemDetails && interfaceMode === 'sidebar' && ( // Mostra apenas no modo sidebar por enquanto
         <div id="map-info-box">
           {selectedItemDetails.assets.thumbnail?.href && <img src={selectedItemDetails.assets.thumbnail.href} alt="Pré-visualização" />}
           <h4>{selectedItemDetails.collection}</h4>
           <p><strong>ID:</strong> {selectedItemDetails.id}</p>
           <button onClick={closeInfoBox} style={{marginTop: '10px', width: '100%'}}>Fechar</button>
       </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <Draggable nodeRef={nodeRef} handle=".modal-drag-handle">
            <div ref={nodeRef} className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-drag-handle">
                <span>Gráfico de Série Temporal</span>
                <button className="modal-close-button" onClick={() => setIsModalOpen(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-chart-content">
                <TimeseriesChart timeseriesData={timeseriesData} />
              </div>
            </div>
          </Draggable>
        </div>
      )}
    </div>
  );
}

export default App;