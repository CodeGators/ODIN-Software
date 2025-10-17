// Arquivo: App.jsx

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import TimeseriesChart from './components/TimeseriesChart';
import './components/Modal.css';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. ADICIONAR ESTADO PARA A SOBREPOSIÇÃO DA IMAGEM
  const [imageOverlay, setImageOverlay] = useState(null);

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value ? parseFloat(value) : null;

    setSelectedCoords(prev => {
      const newCoords = prev ? { ...prev } : { lat: null, lng: null };
      if (name === 'latitude') newCoords.lat = numericValue;
      else if (name === 'longitude') newCoords.lng = numericValue;
      if (newCoords.lat === null && newCoords.lng === null) return null;
      return newCoords;
    });
  };

  const closeInfoBox = () => {
    setSelectedItemDetails(null);
    // 2. LIMPAR A SOBREPOSIÇÃO QUANDO A CAIXA DE INFORMAÇÃO É FECHADA
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
              selectedItemDetails={selectedItemDetails} // Passar o estado para a MapPage
              setSelectedItemDetails={setSelectedItemDetails}
              selectedCoords={selectedCoords}
              setSelectedCoords={setSelectedCoords}
              setTimeseriesData={setTimeseriesData}
              setIsModalOpen={setIsModalOpen}
              // 3. PASSAR O ESTADO E A FUNÇÃO DE ATUALIZAÇÃO PARA A MAPPAGE
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
            {/* 4. USAR A NOVA FUNÇÃO PARA FECHAR */}
            <button onClick={closeInfoBox} style={{marginTop: '10px', width: '100%'}}>Fechar</button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setIsModalOpen(false)}>
              &times;
            </button>
            <TimeseriesChart timeseriesData={timeseriesData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;