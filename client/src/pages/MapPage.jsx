// Arquivo: MapPage.jsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON, ImageOverlay } from 'react-leaflet';
import { getCollections, searchStac, getItemDetails, getTimeseries } from '../services/api';
import AttributeSelector from '../components/AttributeSelector';
import '../components/AttributeSelector.css';

const wtssCompatibleCollections = [
  'CBERS4-MUX-2M-1', 'CBERS4-WFI-16D-2', 'CBERS-WFI-8D-1', 'LANDSAT-16D-1',
  'mod11a2-6.1', 'mod13q1-6.1', 'myd11a2-6.1', 'myd13q1-6.1', 'S2-16D-2'
];

function MapUpdater({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat != null && coords.lng != null) {
      map.flyTo([coords.lat, coords.lng], map.getZoom());
    }
  }, [coords, map]);
  return null;
}

function MapClickHandler({ onMapClick, selectedCoords }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return selectedCoords ? <Marker position={selectedCoords} /> : null;
}

const MapPage = ({
  searchResults,
  setSearchResults,
  setSelectedItemDetails,
  selectedCoords,
  setSelectedCoords,
  setTimeseriesData,
  setIsModalOpen,
  imageOverlay,
  setImageOverlay
}) => {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSatellites, setSelectedSatellites] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState(['NDVI']);
  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [geoJsonKey, setGeoJsonKey] = useState(Date.now());

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
    setImageOverlay(null);

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
    try {
      const response = await getItemDetails(item.collection, item.id);
      const details = response.data;
      setSelectedItemDetails(details);

      setImageOverlay(null);
      setSelectedGeometry(null);
      
      if (details.geometry) {
        setSelectedGeometry(details.geometry);
        setGeoJsonKey(Date.now());
      }

      const thumbnailUrl = details.assets?.thumbnail?.href;
      const bbox = details.bbox;

      if (thumbnailUrl && bbox) {
        const bounds = [ [bbox[1], bbox[0]], [bbox[3], bbox[2]] ];
        setImageOverlay({ url: thumbnailUrl, bounds: bounds });
      }

    } catch (error) {
      console.error('Erro ao buscar detalhes do item:', error);
      setSelectedItemDetails(null);
      setImageOverlay(null);
    }
  };

  const handleGetTimeseries = async (item) => {
    if (!selectedCoords || !startDate || !endDate) {
      alert("Por favor, selecione um ponto no mapa e um intervalo de datas para buscar a série temporal.");
      return;
    }
    if (selectedAttributes.length === 0) {
        alert("Por favor, selecione pelo menos um atributo WTSS para analisar.");
        return;
    }

    const params = {
      coverage: item.collection,
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      attributes: selectedAttributes.join(','),
      startDate: startDate,
      endDate: endDate,
    };

    try {
      const response = await getTimeseries(params);
      setTimeseriesData(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar série temporal do WTSS:', error);
      alert('Não foi possível buscar a série temporal. Verifique o console para mais detalhes.');
    }
  };

  const primaryWtssCollection = selectedSatellites.find(sat => wtssCompatibleCollections.includes(sat));

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
                    <input type="checkbox" id="select-all" onChange={handleSelectAll} />
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
                      <label htmlFor={col.id}>
                        {col.title}
                        {wtssCompatibleCollections.includes(col.id) && (
                          <span style={{ color: '#007bff', fontWeight: 'bold' }}> (WTSS)</span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="date-inputs">
            <div className="date-field">
              <label htmlFor="start-date">Data de Início</label>
              <input type="date" id="start-date" name="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="date-field">
              <label htmlFor="end-date">Data de Fim</label>
              <input type="date" id="end-date" name="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          
          {primaryWtssCollection && (
            <AttributeSelector
              selectedCollection={primaryWtssCollection}
              selectedAttributes={selectedAttributes}
              setSelectedAttributes={setSelectedAttributes}
            />
          )}

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
                  <div className="result-info">
                    <div className="img-placeholder">IMG</div>
                    <div>
                        <strong>{feature.collection}</strong>
                        <small>Nuvens: {feature.cloud_cover?.toFixed(2) ?? 'N/A'}%</small>
                        <small>Data: {feature.date}</small>
                    </div>
                  </div>
                  {wtssCompatibleCollections.includes(feature.collection) && (
                    <button
                      className="download-button-table"
                      style={{ marginLeft: 'auto' }}
                      title="Analisar Série Temporal (WTSS)"
                      onClick={(e) => { e.stopPropagation(); handleGetTimeseries(feature); }}
                    >
                      WTSS
                    </button>
                  )}
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
          <MapUpdater coords={selectedCoords} />
          
          {/* ALTERAÇÃO AQUI: Adicionado a prop 'style' */}
          {selectedGeometry && ( 
            <GeoJSON 
              key={geoJsonKey} 
              data={selectedGeometry} 
              style={{
                fillOpacity: 0,    // Remove o preenchimento
                color: '#007bff',   // Define a cor da borda
                weight: 2          // Define a espessura da borda
              }}
            /> 
          )}

          {imageOverlay && (
            <ImageOverlay
              url={imageOverlay.url}
              bounds={imageOverlay.bounds}
              opacity={1}
              zIndex={10}
            />
          )}

        </MapContainer>
      </main>
    </div>
  );
};

export default MapPage;