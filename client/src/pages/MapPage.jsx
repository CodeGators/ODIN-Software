import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { getCollections, searchStac, getItemDetails } from '../services/api';

function MapClickHandler({ onMapClick, selectedCoords }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return selectedCoords ? <Marker position={selectedCoords} /> : null;
}

const MapPage = ({ searchResults, setSearchResults, setSelectedItemDetails }) => {
  const [collections, setCollections] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [latDisplay, setLatDisplay] = useState('--.--');
  const [lonDisplay, setLonDisplay] = useState('--.--');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getCollections()
      .then(response => setCollections(response.data))
      .catch(error => console.error('Erro ao carregar coleções:', error));
  }, []);

  const handleMapClick = (latlng) => {
    setSelectedCoords(latlng);
    setLatDisplay(latlng.lat.toFixed(4));
    setLonDisplay(latlng.lng.toFixed(4));
  };
  
  const handleSearch = async (event) => {
    event.preventDefault();
    if (!selectedCoords) {
      alert("Selecione um ponto no mapa.");
      return;
    }

    setIsLoading(true);
    setSearchResults([]);

    const formData = new FormData(event.target);
    const selectedSatelite = formData.get('satelites');
    
    let collectionsToSend;
    if (selectedSatelite === 'all') {
      collectionsToSend = collections.map(c => c.id);
    } else {
      collectionsToSend = [selectedSatelite];
    }
    
    const searchPayload = {
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      collections: collectionsToSend,
      startDate: formData.get('start-date'),
      endDate: formData.get('end-date'),
    };

    try {
        const response = await searchStac(searchPayload);
        setSearchResults(response.data);
    } catch (error) {
        console.error('Erro na busca STAC:', error);
        setSearchResults([]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleResultClick = async (collection, itemId) => {
    try {
        const response = await getItemDetails(collection, itemId);
        setSelectedItemDetails(response.data);
    } catch (error) {
        console.error('Erro ao buscar detalhes do item:', error);
    }
  };

  return (
    <div className="main-container" style={{ height: '100%' }}>
      <aside className="sidebar">
        <div className="filter-header">
            {/* Opcional: Adicionar lat/lon aqui se desejar */}
        </div>
        <form className="filter-form" onSubmit={handleSearch}>
          <label htmlFor="satelite-select">Satélite Desejado</label>
          <select id="satelite-select" name="satelites">
            <option value="all">Todos os Satélites</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>
          <div className="date-inputs">
            <div className="date-field">
              <label htmlFor="start-date">Data de Início</label>
              <input type="date" id="start-date" name="start-date" />
            </div>
            <div className="date-field">
              <label htmlFor="end-date">Data de Fim</label>
              <input type="date" id="end-date" name="end-date" />
            </div>
          </div>
          <button type="submit" className="search-button" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar Dados'}
          </button>
        </form>
        <div className="results-section">
          <h3>Resultados da Busca</h3>
          <div id="search-results-list">
            {isLoading ? (
              <p>Carregando resultados...</p>
            ) : searchResults.length === 0 ? (
              <p>Selecione um ponto e busque os dados.</p>
            ) : (
              searchResults.map(feature => (
                <div key={feature.id} className="result-item" onClick={() => handleResultClick(feature.collection, feature.id)}>
                  <div className="img-placeholder">IMG</div>
                  <div className="result-info">
                    <strong>{feature.collection}</strong>
                    <small>Nuvens: {feature.cloud_cover?.toFixed(2) ?? 'N/A'}%</small>
                    <small>Data: {feature.date}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
      <main className="map-container">
        <MapContainer center={[-14.235, -51.925]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onMapClick={handleMapClick} selectedCoords={selectedCoords} />
        </MapContainer>
      </main>
    </div>
  );
};

export default MapPage;