// Arquivo: MapPage.jsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON } from 'react-leaflet'; 
import { getCollections, searchStac, getItemDetails } from '../services/api';

// --- INÍCIO DA SOLUÇÃO DO ÍCONE ---
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Garante que o CSS do Leaflet seja carregado

// Bloco de código que corrige problemas comuns de carregamento de ícones no Leaflet com Vite/Webpack
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
});

// Definição do seu ícone personalizado
// Como a imagem está em 'public/images/pin-icon.png', o caminho é direto da raiz do site.
const customIcon = new L.Icon({
  iconUrl: '/images/pin-icon.png',
  iconSize: [35, 35],       // Tamanho do ícone [largura, altura]
  iconAnchor: [17, 35],      // Ponto do ícone que corresponde à localização no mapa (ponta inferior)
});
// --- FIM DA SOLUÇÃO DO ÍCONE ---


function MapUpdater({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat != null && coords.lng != null) {
      map.flyTo([coords.lat, coords.lng], map.getZoom());
    }
  }, [coords, map]);
  return null;
}

// Função MapClickHandler modificada para usar o ícone personalizado
function MapClickHandler({ onMapClick, selectedCoords }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  // Adiciona a propriedade "icon" com o ícone customizado ao Marker
  return selectedCoords ? <Marker position={selectedCoords} icon={customIcon} /> : null;
}

const MapPage = ({ 
  searchResults, 
  setSearchResults, 
  setSelectedItemDetails,
  selectedCoords,
  setSelectedCoords
}) => {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSatellites, setSelectedSatellites] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [geoJsonKey, setGeoJsonKey] = useState(null);

  useEffect(() => {
    getCollections()
      .then(response => setCollections(response.data))
      .catch(error => console.error('Erro ao carregar coleções:', error));
  }, []);
  
  useEffect(() => {
    return () => {
      setSelectedGeometry(null);
      if (setSelectedItemDetails) {
        setSelectedItemDetails(null);
      }
    };
  }, [setSelectedItemDetails]);

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
    if (!selectedCoords || selectedCoords.lat === null || selectedCoords.lng === null) {
      alert("Selecione um ponto no mapa ou preencha a latitude e longitude.");
      return;
    }
    if (selectedSatellites.length === 0) {
      alert("Selecione pelo menos um satélite.");
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    setSelectedGeometry(null);
    
    const searchPayload = {
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      collections: selectedSatellites,
      startDate: startDate,
      endDate: endDate,
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

  const handleResultClick = async (item) => {
    if (item.geometry) {
      setSelectedGeometry(item.geometry);
      setGeoJsonKey(item.id);
    } else {
      setSelectedGeometry(null);
    }

    try {
        const response = await getItemDetails(item.collection, item.id);
        setSelectedItemDetails(response.data);
    } catch (error) {
        console.error('Erro ao buscar detalhes do item:', error);
        setSelectedItemDetails(null);
    }
  };

  const meuToken = import.meta.env.VITE_MAPBOX_TOKEN;

  return (
    <div className="main-container" style={{ height: '100%' }}>
      <aside className="sidebar">
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
              <input
                type="date"
                id="start-date"
                name="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label htmlFor="end-date">Data de Fim</label>
              <input
                type="date"
                id="end-date"
                name="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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
                <div key={feature.id} className="result-item" onClick={() => handleResultClick(feature)}>
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
                url={`https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${meuToken}`}
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
          <MapClickHandler onMapClick={handleMapClick} selectedCoords={selectedCoords} />
          <MapUpdater coords={selectedCoords} />
          
          {selectedGeometry && (
            <GeoJSON 
              key={geoJsonKey} 
              data={selectedGeometry} 
            />
          )}

        </MapContainer>
      </main>
    </div>
  );
};

export default MapPage;