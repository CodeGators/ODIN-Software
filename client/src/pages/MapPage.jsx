import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON, ImageOverlay } from 'react-leaflet';
import { getCollections, searchStac, getItemDetails, getTimeseries } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AttributeSelector from '../components/AttributeSelector';
import '../components/AttributeSelector.css';

// --- Configuração dos Ícones (mantida da sua versão) ---
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const customIcon = new L.Icon({
  iconUrl: '/images/pin-icon.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// --- Lista de Coleções compatíveis com WTSS ---
const wtssCompatibleCollections = [
  'CBERS4-MUX-2M-1', 'CBERS4-WFI-16D-2', 'CBERS-WFI-8D-1', 'LANDSAT-16D-1',
  'mod11a2-6.1', 'mod13q1-6.1', 'myd11a2-6.1', 'myd13q1-6.1', 'S2-16D-2'
];

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
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return selectedCoords ? <Marker position={selectedCoords} icon={customIcon} /> : null;
}

// --- Componente principal ---
const MapPage = ({
  searchResults, setSearchResults, selectedItemDetails, setSelectedItemDetails,
  selectedCoords, setSelectedCoords, setTimeseriesData, setIsModalOpen,
  imageOverlay, setImageOverlay
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
  const [selectedAttributes, setSelectedAttributes] = useState(['NDVI']); 

  useEffect(() => {
    getCollections()
      .then((response) => {
        if (!response || !Array.isArray(response.data)) return;
        const cleanedData = response.data.filter(item => item && typeof item === 'object' && item.id && typeof item.title === 'string');
        const seenIds = new Set();
        const uniqueData = cleanedData.filter(item => {
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
      if (setImageOverlay) setImageOverlay(null);
    };
  }, [setSelectedItemDetails, setImageOverlay]);

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
    setSelectedItemDetails(null);
    setImageOverlay(null); 

    const BATCH_SIZE = 15;
    const allBatches = [];
    for (let i = 0; i < selectedSatellites.length; i += BATCH_SIZE) {
      allBatches.push(selectedSatellites.slice(i, i + BATCH_SIZE));
    }

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
        const response = await searchStac(searchPayload);
        if (response && Array.isArray(response.data)) {
          allResults = [...allResults, ...response.data];
        }
      }

      const seenResultIds = new Set();
      const finalResults = allResults.filter(item => {
        if (!item || !item.id || !item.geometry) return false;
        if (seenResultIds.has(item.id)) return false;
        seenResultIds.add(item.id);
        return true;
      });

      setSearchResults(finalResults);

      const groups = finalResults.reduce((acc, feature) => {
        const collectionTitle = collections.find(c => c.id === feature.collection)?.title || feature.collection || 'Resultados';
        if (!acc[collectionTitle]) acc[collectionTitle] = [];
        acc[collectionTitle].push(feature);
        return acc;
      }, {});

      const sortedGroups = Object.keys(groups).sort((a, b) => a.localeCompare(b)).reduce((obj, key) => {
        obj[key] = groups[key];
        return obj;
      }, {});
      setGroupedResults(sortedGroups);

    } catch (error) {
      console.error('Erro na busca STAC em lotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = async (item) => {
    if (selectedItemDetails && selectedItemDetails.id === item.id) {
        setSelectedItemDetails(null);
        setSelectedGeometry(null);
        setImageOverlay(null);
        return;
    }

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
      alert("Por favor, selecione um ponto no mapa e um intervalo de datas.");
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
      startDate,
      endDate,
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
  
  const toggleResultGroup = (groupName) => {
    setOpenResultGroups(prev => {
      const newSet = new Set(prev);
      newSet.has(groupName) ? newSet.delete(groupName) : newSet.add(groupName);
      return newSet;
    });
  };
  
  const primaryWtssCollection = selectedSatellites.find(sat => wtssCompatibleCollections.includes(sat));
  const meuToken = import.meta.env.VITE_MAPBOX_TOKEN;

  return (
    <div className="main-container" style={{ height: '100%' }}>
      <aside className="sidebar">
        <form className="filter-form" onSubmit={handleSearch}>
          <div className="custom-dropdown-container">
            <label>Satélite Desejado</label>
            <button type="button" className="dropdown-button" onClick={() => setDropdownOpen(!isDropdownOpen)}>
              <span>{selectedSatellites.length === 0 ? 'Selecione um ou mais satélites' : `${selectedSatellites.length} satélite(s) selecionado(s)`}</span>
              <span>{isDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-list">
                {collections.length > 0 ? (
                  <ul>
                    <li>
                      <input type="checkbox" id="select-all" checked={collections.length > 0 && collections.length === selectedSatellites.length} onChange={handleSelectAll} />
                      <label htmlFor="select-all"><strong>Selecionar Todos</strong></label>
                    </li>
                    {collections.map(col => (
                      <li key={col.id}>
                        <input type="checkbox" id={col.id} value={col.id} checked={selectedSatellites.includes(col.id)} onChange={handleSatelliteChange} />
                        <label htmlFor={col.id}>
                          {col.title}
                          {wtssCompatibleCollections.includes(col.id) && <span style={{ color: '#007bff', fontWeight: 'bold' }}> (WTSS)</span>}
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : <p>Carregando satélites...</p>}
              </div>
            )}
          </div>
          <div className="date-inputs">
            <div className="date-field"><label>Data de Início</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="date-field"><label>Data de Fim</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          {primaryWtssCollection && (
            <AttributeSelector
              selectedCollection={primaryWtssCollection}
              selectedAttributes={selectedAttributes}
              setSelectedAttributes={setSelectedAttributes}
            />
          )}
          <button type="submit" className="search-button" disabled={isLoading}>{isLoading ? 'Buscando...' : 'Buscar Dados'}</button>
        </form>
        <div className="results-section">
          <h3>Resultados da Busca</h3>
          <div id="search-results-list">
            {isLoading ? <p>Carregando resultados...</p> : searchResults.length === 0 ? <p>Nenhum resultado encontrado.</p> : (
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
                        {features.map(feature => (
                          <div key={feature.id} className={`result-item ${selectedItemDetails?.id === feature.id ? 'active' : ''}`} onClick={() => handleResultClick(feature)}>
                            <div className="img-placeholder">IMG</div>
                            <div className="result-info">
                                <strong>{feature.collection}</strong>
                                <small>Nuvens: {feature.cloud_cover?.toFixed(2) ?? 'N/A'}%</small>
                                <small>Data: {new Date(feature.date).toLocaleDateString()}</small>
                            </div>
                            {wtssCompatibleCollections.includes(feature.collection) && (
                              <button
                                className="download-button-table"
                                style={{ marginLeft: 'auto' }}
                                title="Analisar Série Temporal (WTSS)"
                                onClick={(e) => { e.stopPropagation(); handleGetTimeseries(feature); }}
                              >WTSS</button>
                            )}
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
            url={`https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${meuToken}`}
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onMapClick={handleMapClick} selectedCoords={selectedCoords} />
          <MapUpdater coords={selectedCoords} />
          {selectedGeometry && <GeoJSON key={geoJsonKey} data={selectedGeometry} style={{ fillOpacity: 0, color: '#007bff', weight: 2 }} />}
          {imageOverlay && <ImageOverlay url={imageOverlay.url} bounds={imageOverlay.bounds} opacity={0.7} zIndex={10} />}
        </MapContainer>
      </main>
    </div>
  );
};

export default MapPage;