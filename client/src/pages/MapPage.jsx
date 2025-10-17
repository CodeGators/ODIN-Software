import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import { getCollections, searchStac, getItemDetails } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// --- Configuração do ícone ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const customIcon = new L.Icon({
  iconUrl: '/images/pin-icon.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// --- Componentes auxiliares do mapa ---
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
  return selectedCoords ? <Marker position={selectedCoords} icon={customIcon} /> : null;
}

// --- Componente principal ---
const MapPage = ({
  searchResults,
  setSearchResults,
  selectedItemDetails,
  setSelectedItemDetails,
  selectedCoords,
  setSelectedCoords,
}) => {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSatellites, setSelectedSatellites] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [geoJsonKey, setGeoJsonKey] = useState(null);
  const [groupedResults, setGroupedResults] = useState({});
  const [openResultGroups, setOpenResultGroups] = useState(new Set());

  useEffect(() => {
    getCollections()
      .then((response) => {
        if (!response || !Array.isArray(response.data)) return;
        const cleanedData = response.data.filter(
          (item) => item && typeof item === 'object' && item.id && typeof item.title === 'string'
        );
        const seenIds = new Set();
        const uniqueData = cleanedData.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
        const sortedCollections = [...uniqueData].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        setCollections(sortedCollections);
      })
      .catch((error) => console.error('ERRO ao buscar coleções:', error));
  }, []);

  useEffect(() => {
    return () => {
      setSelectedGeometry(null);
      if (setSelectedItemDetails) setSelectedItemDetails(null);
    };
  }, [setSelectedItemDetails]);

  const handleMapClick = (latlng) => setSelectedCoords(latlng);

  const handleSatelliteChange = (event) => {
    const { value, checked } = event.target;
    setSelectedSatellites((prev) =>
      checked ? [...prev, value] : prev.filter((id) => id !== value)
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedSatellites(collections.map((c) => c.id));
    } else {
      setSelectedSatellites([]);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!selectedCoords || selectedCoords.lat == null || selectedCoords.lng == null) {
      alert('Selecione um ponto no mapa ou preencha a latitude e longitude.');
      return;
    }
    if (selectedSatellites.length === 0) {
      alert('Selecione pelo menos um satélite.');
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    setGroupedResults({});
    setSelectedGeometry(null);
    setSelectedItemDetails(null); // Limpa o popup ao iniciar nova busca

    const collectionsForSearch = selectedSatellites.map(id => {
      if (id && id.toUpperCase().startsWith('AMAZONIA')) {
        return 'AMAZONIA';
      }
      return id;
    });
    const uniqueCollectionsForSearch = [...new Set(collectionsForSearch)];
    
    const BATCH_SIZE = 15;
    const allBatches = [];
    for (let i = 0; i < uniqueCollectionsForSearch.length; i += BATCH_SIZE) {
      const batch = uniqueCollectionsForSearch.slice(i, i + BATCH_SIZE);
      allBatches.push(batch);
    }

    console.log(`Dividindo a busca de ${uniqueCollectionsForSearch.length} satélites em ${allBatches.length} lotes de até ${BATCH_SIZE} cada.`);

    try {
      let allResults = [];
      for (const batch of allBatches) {
        const searchPayload = {
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
          collections: batch,
          startDate,
          endDate,
        };
        console.log("Buscando lote:", batch);
        const response = await searchStac(searchPayload);
        if (response && Array.isArray(response.data)) {
          allResults = [...allResults, ...response.data];
        }
      }

      const seenResultIds = new Set();
      const finalResults = allResults.filter((item) => {
        if (!item || !item.id) return false;
        if (seenResultIds.has(item.id)) return false;
        seenResultIds.add(item.id);
        return true;
      });

      setSearchResults(finalResults);

      const groups = finalResults.reduce((acc, feature) => {
        const collectionId = feature.collection || 'sem_id';
        const matchedCollection = collections.find((c) => c.id === collectionId);
        const collectionTitle = matchedCollection?.title || feature.collection || 'Resultados';
        if (!acc[collectionTitle]) acc[collectionTitle] = [];
        acc[collectionTitle].push(feature);
        return acc;
      }, {});

      const sortedGroups = Object.keys(groups)
        .sort((a, b) => a.localeCompare(b))
        .reduce((obj, key) => {
          if (groups[key].length > 0) obj[key] = groups[key];
          return obj;
        }, {});
      setGroupedResults(sortedGroups);

    } catch (error) {
      console.error('Erro na busca STAC em lotes:', error);
      setSearchResults([]);
      setGroupedResults({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = async (item) => {
    if (selectedItemDetails && selectedItemDetails.id === item.id) {
      setSelectedItemDetails(null);
      setSelectedGeometry(null);
      return;
    }

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

  const toggleResultGroup = (groupName) => {
    setOpenResultGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) newSet.delete(groupName);
      else newSet.add(groupName);
      return newSet;
    });
  };

  const meuToken = import.meta.env.VITE_MAPBOX_TOKEN;

  return (
    <div className="main-container" style={{ height: '100%' }}>
      <aside className="sidebar">
        <form className="filter-form" onSubmit={handleSearch}>
          <div className="custom-dropdown-container">
            <label>Satélite Desejado</label>
            <button type="button" className="dropdown-button" onClick={() => setDropdownOpen(!isDropdownOpen)}>
              <span>
                {selectedSatellites.length === 0
                  ? 'Selecione um ou mais satélites'
                  : `${selectedSatellites.length} satélite(s) selecionado(s)`}
              </span>
              <span>{isDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-list">
                {collections.length > 0 ? (
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
                    {collections.map((col) => (
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
                ) : (
                  <p>Carregando satélites...</p>
                )}
              </div>
            )}
          </div>
          <div className="date-inputs">
            <div className="date-field">
              <label>Data de Início</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="date-field">
              <label>Data de Fim</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
              <p>Nenhum resultado encontrado.</p>
            ) : (
              Object.entries(groupedResults).map(([collectionName, features]) => {
                const isOpen = openResultGroups.has(collectionName);
                return (
                  <div key={collectionName} className={`result-group ${isOpen ? 'is-open' : ''}`}>
                    <div className="result-group-header" onClick={() => toggleResultGroup(collectionName)}>
                      <div className="result-group-title">
                        <strong>{collectionName}</strong>
                        <span className="result-count">({features.length})</span>
                      </div>
                      <span className="accordion-icon">›</span>
                    </div>
                    <div className="result-group-items">
                      <div className="result-items-wrapper">
                        {features.map((feature) => (
                          <div
                            key={feature.id}
                            className={`result-item ${selectedItemDetails?.id === feature.id ? 'active' : ''}`}
                            onClick={() => handleResultClick(feature)}
                          >
                            <div className="img-placeholder">IMG</div>
                            <div className="result-info">
                              <small>Nuvens:</small>
                              <strong>{feature.cloud_cover?.toFixed(2) ?? 'N/A'}%</strong>
                              <small>Data:</small>
                              <strong>{new Date(feature.date).toLocaleDateString()}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
      <main className="map-container">
        <MapContainer center={[-14.235, -51.925]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            // --- ALTERAÇÃO APLICADA AQUI ---
            url={`https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${meuToken}`}
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onMapClick={handleMapClick} selectedCoords={selectedCoords} />
          <MapUpdater coords={selectedCoords} />
          {selectedGeometry && <GeoJSON key={geoJsonKey} data={selectedGeometry} />}
        </MapContainer>
      </main>
    </div>
  );
};

export default MapPage;