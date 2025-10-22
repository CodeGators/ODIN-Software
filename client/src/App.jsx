// Arquivo: App.jsx

import React, { useState, useRef } from 'react'; // Import useRef
import { Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import TimeseriesChart from './components/TimeseriesChart';
import './components/Modal.css'; // Estilo para o modal
import Draggable from 'react-draggable'; // Importa Draggable
import 'react-resizable/css/styles.css';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageOverlay, setImageOverlay] = useState(null);

  // Cria uma referência para o nó do modal (necessário para Draggable)
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

  return (
    <div className="app-container">
      <Header
        selectedCoords={selectedCoords}
        handleCoordinateChange={handleCoordinateChange}
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
            />}
          />
          <Route path="/data" element={<DataPage searchResults={searchResults} />} />
          <Route path="/dashboard" element={<DashboardPage searchResults={searchResults} />} />
        </Routes>
      </main>

      {selectedItemDetails && (
         <div id="map-info-box">
           {selectedItemDetails.assets.thumbnail?.href && <img src={selectedItemDetails.assets.thumbnail.href} alt="Pré-visualização" />}
           <h4>{selectedItemDetails.collection}</h4>
           <p><strong>ID:</strong> {selectedItemDetails.id}</p>
           <button onClick={closeInfoBox} style={{marginTop: '10px', width: '100%'}}>Fechar</button>
       </div>
      )}

      {/* Modal Arrastável para o gráfico WTSS */}
      {isModalOpen && (
        <div className="modal-overlay"> {/* Overlay não é arrastável */}
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