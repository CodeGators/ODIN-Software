// Arquivo: App.jsx

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);

  // 1. O ESTADO DAS COORDENADAS AGORA VIVE AQUI
  const [selectedCoords, setSelectedCoords] = useState(null);

  // 2. A FUNÇÃO PARA ATUALIZAR AS COORDENADAS TAMBÉM VEM PARA CÁ
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value ? parseFloat(value) : null;

    setSelectedCoords(prev => {
      const newCoords = prev ? { ...prev } : { lat: null, lng: null };
      if (name === 'latitude') {
        newCoords.lat = numericValue;
      } else if (name === 'longitude') {
        newCoords.lng = numericValue;
      }
      if (newCoords.lat === null && newCoords.lng === null) {
          return null;
      }
      return newCoords;
    });
  };

  return (
    <div className="app-container">
      {/* 3. PASSAMOS O ESTADO E A FUNÇÃO PARA O HEADER */}
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
              setSelectedItemDetails={setSelectedItemDetails}
              // 4. PASSAMOS O ESTADO E A FUNÇÃO PARA A PÁGINA DO MAPA
              selectedCoords={selectedCoords}
              setSelectedCoords={setSelectedCoords}
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
            <button onClick={() => setSelectedItemDetails(null)} style={{marginTop: '10px', width: '100%'}}>Fechar</button>
        </div>
      )}
    </div>
  );
}

export default App;