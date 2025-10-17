// Arquivo: App.jsx (Versão Atualizada)

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import TimeseriesChart from './components/TimeseriesChart';
import './components/Modal.css'; // Estilo para o modal

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  
  // STATES ADICIONADOS
  const [timeseriesData, setTimeseriesData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageOverlay, setImageOverlay] = useState(null);

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value ? parseFloat(value) : null;
    
    setSelectedCoords(prev => ({
      ...prev,
      [name === 'latitude' ? 'lat' : 'lng']: numericValue
    }));
  };

  const closeInfoBox = () => {
    setSelectedItemDetails(null);
    setImageOverlay(null); // Limpar a imagem do mapa ao fechar a caixa
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
              // Props adicionadas para WTSS e Thumbnail
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

      {/* Modal para o gráfico WTSS */}
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