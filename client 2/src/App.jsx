// Arquivo: App.jsx (Versão Corrigida)

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value ? parseFloat(value) : null;
    
    setSelectedCoords(prev => ({
      ...prev,
      [name === 'latitude' ? 'lat' : 'lng']: numericValue
    }));
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