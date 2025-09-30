import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { getCollections, searchStac, getItemDetails } from '../services/api';
import './MapPage.css';


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
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para o novo filtro
  const [selectedSatellites, setSelectedSatellites] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    getCollections()
      .then(response => setCollections(response.data))
      .catch(error => console.error('Erro ao carregar coleções:', error));
  }, []);

  const handleMapClick = (latlng) => {
    setSelectedCoords(latlng);
  };

  const handleSatelliteChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedSatellites(prev => [...prev, value]);
    } else {
      setSelectedSatellites(prev => prev.filter(id => id !== value));
    }
  };
  
  // NOVA FUNÇÃO ADICIONADA
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allCollectionIds = collections.map(c => c.id);
      setSelectedSatellites(allCollectionIds);
    } else {
      setSelectedSatellites([]);
    }
  };
  
  const handleSearch = async (event) => {
    event.preventDefault();
    if (!selectedCoords) {
      alert("Selecione um ponto no mapa.");
      return;
    }
    if (selectedSatellites.length === 0) {
      alert("Selecione pelo menos um satélite.");
      return;
    }

    setIsLoading(true);
    setSearchResults([]);

    const formData = new FormData(event.target);
    const collectionsToSend = selectedSatellites;
    
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
        </div>
        <form className="filter-form" onSubmit={handleSearch}>
          
          <div className="custom-dropdown-container">
            <label>Satélite Desejado</label>
            <button 
              type="button" 
              className="dropdown-button" 
              onClick={() => setDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedSatellites.length === 0 
                  ? 'Selecione um ou mais satélites' 
                  : `${selectedSatellites.length} satélite(s) selecionado(s)`}
              </span>
              <span>{isDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-list">
                <ul>
                  {/* JSX ATUALIZADO AQUI */}
                  <li>
                    <input 
                      type="checkbox" 
                      id="select-all"
                      checked={collections.length > 0 && collections.length === selectedSatellites.length}
                      onChange={handleSelectAll}
                    />
                    <label htmlFor="select-all"><strong>Selecionar Todos</strong></label>
                  </li>

                  {collections.map(col => (
                    <li key={col.id}>
                      <input 
                        type="checkbox" 
                        id={col.id} 
                        value={col.id}
                        checked={selectedSatellites.includes(col.id)}
                        onChange={handleSatelliteChange}
                      />
                      <label htmlFor={col.id}>{col.title}</label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
