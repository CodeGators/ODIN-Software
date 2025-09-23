import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header'; // Importe o novo Header

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);

  return (
    <div className="app-container">
      <Header /> {/* Use o Header aqui */}
      <main className="page-content">
        <Routes>
          <Route
            path="/"
            element={<MapPage
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              setSelectedItemDetails={setSelectedItemDetails}
            />}
          />
          <Route path="/data" element={<DataPage searchResults={searchResults} />} />
          <Route path="/dashboard" element={<DashboardPage searchResults={searchResults} />} />
        </Routes>
      </main>
      
      {/* A InfoBox do mapa continua aqui, separada */}
      {selectedItemDetails && (
         <div id="map-info-box">
            {selectedItemDetails.assets.thumbnail?.href && <img src={selectedItemDetails.assets.thumbnail.href} alt="Pré-visualização" />}
            <h4>{selectedItemDetails.collection}</h4>
            <p><strong>ID:</strong> {selectedItemDetails.id}</p>
            {/* ... (resto do conteúdo da InfoBox) ... */}
            <button onClick={() => setSelectedItemDetails(null)} style={{marginTop: '10px', width: '100%'}}>Fechar</button>
        </div>
      )}
    </div>
  );
}

export default App;