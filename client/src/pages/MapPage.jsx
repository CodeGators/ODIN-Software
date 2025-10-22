import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  GeoJSON,
  ImageOverlay
} from 'react-leaflet';
import {
  getCollections,
  searchStac,
  getItemDetails,
  getTimeseries
} from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AttributeSelector from '../components/AttributeSelector';
import '../components/AttributeSelector.css';
import LoadingSpinner from '../components/LoadingSpiner';

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

// --- NOVO: Definição dos estilos do Mapbox ---
// Colocamos isso fora do componente para não ser recriado
const MAPBOX_STYLES = {
  navigation: { id: 'navigation-night-v1', label: 'Navegação (Escuro)' },
  streets: { id: 'streets-v12', label: 'Ruas' },
  satellite: { id: 'satellite-v9', label: 'Satélite' },
  light: { id: 'light-v11', label: 'Claro' },
  outdoors: { id: 'outdoors-v12', label: 'Relevo' }
};

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
  const [collections, setCollections] = useState([]); // Lista completa
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // Usado APENAS no modo avançado
  const [selectedSatellites, setSelectedSatellites] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [geoJsonKey, setGeoJsonKey] = useState(null);
  const [groupedResults, setGroupedResults] = useState({});
  const [openResultGroups, setOpenResultGroups] = useState(new Set());
  const [selectedAttributes, setSelectedAttributes] = useState(['NDVI']);

  // --- NOVO: Estados para o filtro avançado ---
  const [wtssCollections, setWtssCollections] = useState([]);
  const [nonWtssCollections, setNonWtssCollections] = useState([]);

  // --- NOVO: Estado para controlar o modo de busca ---
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);

  // --- NOVO: Estado para o filtro simples (grupos lógicos) ---
  const [simpleFilter, setSimpleFilter] = useState('all');

  // --- NOVO: Estado para o estilo do mapa ---
  // O valor padrão ('navigation') é a chave do objeto MAPBOX_STYLES
  const [currentStyleKey, setCurrentStyleKey] = useState('navigation');

  useEffect(() => {
    getCollections()
      .then((response) => {
        if (!response || !Array.isArray(response.data)) return;

        const cleanedData = response.data.filter(item =>
          item && typeof item === 'object' && item.id && typeof item.title === 'string'
        );

        const seenIds = new Set();
        const uniqueData = cleanedData.filter(item => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

        const sortedCollections = [...uniqueData].sort((a, b) =>
          (a.title || '').localeCompare(b.title || '')
        );

        setCollections(sortedCollections); // Armazena a lista completa

        // --- NOVO: Separa as coleções em WTSS e não-WTSS ---
        const wtssList = sortedCollections.filter(c =>
          wtssCompatibleCollections.includes(c.id)
        );
        const nonWtssList = sortedCollections.filter(c =>
          !wtssCompatibleCollections.includes(c.id)
        );

        setWtssCollections(wtssList);
        setNonWtssCollections(nonWtssList);
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

  // --- ATUALIZADO: Grupos Lógicos para o filtro simples --- 
  // (Este objeto agora é a fonte única da verdade para os grupos)
  const logicalGroups = {
    'all': {
      label: 'Todos os Satélites',
      getIds: () => collections.map(c => c.id)
    },
    'wtss': {
      label: 'Apenas Satélites WTSS',
      getIds: () => wtssCollections.map(c => c.id)
    },
    'amazonia': {
      label: 'Coleção AMAZONIA',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('amazonia'))
        .map(c => c.id)
    },
    'cbers': {
      label: 'Coleção CBERS',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('cbers'))
        .map(c => c.id)
    },
    'eta': {
      label: 'Coleção Eta Model',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('eta model'))
        .map(c => c.id)
    },
    'goes': {
      label: 'Coleção GOES',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('goes'))
        .map(c => c.id)
    },
    'landsat': {
      label: 'Coleção LANDSAT',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('landsat'))
        .map(c => c.id)
    },
    'lcc': {
      label: 'Coleção Land Cover (LCC)',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('lcc -'))
        .map(c => c.id)
    },
    'merge': {
      label: 'Coleção MERGE',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('merge'))
        .map(c => c.id)
    },
    'modis': {
      label: 'Coleção MODIS',
      getIds: () => collections
        .filter(c => {
          const title = c.title.toLowerCase();
          return title.startsWith('modis') ||
            title.startsWith('mod11') ||
            title.startsWith('mod13') ||
            title.startsWith('myd11') ||
            title.startsWith('myd13');
        })
        .map(c => c.id)
    },
    'samet': {
      label: 'Coleção SAMeT',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('samet'))
        .map(c => c.id)
    },
    'sentinel1': {
      label: 'Coleção Sentinel-1',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('sentinel-1'))
        .map(c => c.id)
    },
    'sentinel2': {
      label: 'Coleção Sentinel-2',
      getIds: () => collections
        .filter(c => {
          const title = c.title.toLowerCase();
          return title.startsWith('sentinel-2') || title.startsWith('s2 ');
        })
        .map(c => c.id)
    },
    'sentinel3': {
      label: 'Coleção Sentinel-3',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('sentinel-3'))
        .map(c => c.id)
    },
    'sentinel5p': {
      label: 'Coleção Sentinel-5P',
      getIds: () => collections
        .filter(c => c.title.toLowerCase().startsWith('sentinel-5p'))
        .map(c => c.id)
    },
    // --- REMOVIDO o grupo 'others' ---
  };


  // --- Função de seleção para o MODO AVANÇADO ---
  const handleSatelliteChange = (event) => {
    const { value, checked } = event.target;
    setSelectedSatellites((prev) =>
      checked ? [...prev, value] : prev.filter((id) => id !== value)
    );
  };

  // --- Seletores "Todos" para o modo avançado ---
  const handleSelectAllWtss = (event) => {
    const { checked } = event.target;
    const wtssIds = wtssCollections.map(c => c.id);
    setSelectedSatellites(prev => {
      const otherSatellites = prev.filter(id => !wtssIds.includes(id));
      return checked ? [...otherSatellites, ...wtssIds] : otherSatellites;
    });
  };

  const handleSelectAllNonWtss = (event) => {
    const { checked } = event.target;
    const nonWtssIds = nonWtssCollections.map(c => c.id);
    setSelectedSatellites(prev => {
      const otherSatellites = prev.filter(id => !nonWtssIds.includes(id));
      return checked ? [...otherSatellites, ...nonWtssIds] : otherSatellites;
    });
  };

  // --- Helpers para o estado dos checkboxes "Selecionar Todos" ---
  const allWtssSelected = wtssCollections.length > 0 &&
    wtssCollections.every(c => selectedSatellites.includes(c.id));

  const allNonWtssSelected = nonWtssCollections.length > 0 &&
    nonWtssCollections.every(c => selectedSatellites.includes(c.id));

  // --- handleSearch agora usa a lógica de modo de busca ---
  const handleSearch = async (event) => {
    event.preventDefault();
    if (!selectedCoords || selectedCoords.lat == null || selectedCoords.lng == null) {
      alert('Selecione um ponto no mapa ou preencha a latitude e longitude.');
      return;
    }

    let collectionsForSearchIds = [];

    if (isAdvancedSearch) {
      // --- MODO AVANÇADO: Usa a lista de 'selectedSatellites' ---
      if (selectedSatellites.length === 0) {
        alert('Selecione pelo menos um satélite na busca avançada.');
        return;
      }
      collectionsForSearchIds = [...selectedSatellites];
    } else {
      // --- MODO SIMPLES: Usa os grupos lógicos ---
      const group = logicalGroups[simpleFilter];
      if (!group) {
        alert('Grupo de filtro inválido.');
        return;
      }
      collectionsForSearchIds = group.getIds();

      if (collectionsForSearchIds.length === 0) {
        // --- LÓGICA DE ALERTA ATUALIZADA ---
        alert(`O grupo "${group.label}" não retornou nenhum satélite (verifique se já foram carregados).`);
        return; // Para a busca se o grupo selecionado está vazio
      }
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setSearchResults([]);
    setGroupedResults({});
    setSelectedGeometry(null);
    setSelectedItemDetails(null);
    setImageOverlay(null);

    // Agrupamento de 'AMAZONIA' mantido
    const collectionsForSearch = collectionsForSearchIds.map(id => {
      if (id && id.toUpperCase().startsWith('AMAZONIA')) {
        return 'AMAZONIA';
      }
      return id;
    });
    const uniqueCollectionsForSearch = [...new Set(collectionsForSearch)];

    const BATCH_SIZE = 15;
    const allBatches = [];
    for (let i = 0; i < uniqueCollectionsForSearch.length; i += BATCH_SIZE) {
      allBatches.push(uniqueCollectionsForSearch.slice(i, i + BATCH_SIZE));
    }

    console.log(`Iniciando busca de ${uniqueCollectionsForSearch.length} coleções em ${allBatches.length} lotes.`);

    try {
      let allResults = [];
      let batchesProcessed = 0;

      for (const batch of allBatches) {
        const searchPayload = {
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
          collections: batch,
          startDate,
          endDate,
        };

        console.log(`Buscando lote ${batchesProcessed + 1}/${allBatches.length}`);
        const response = await searchStac(searchPayload);
        if (response && Array.isArray(response.data)) {
          allResults = [...allResults, ...response.data];
        }

        batchesProcessed++;
        const progress = (batchesProcessed / allBatches.length) * 100;
        setLoadingProgress(progress);
      }

      const seenResultIds = new Set();
      const finalResults = allResults.filter(item => {
        if (!item || !item.id || !item.geometry) return false;
        if (seenResultIds.has(item.id)) return false;
        seenResultIds.add(item.id);
        return true;
      });

      setSearchResults(finalResults);

      // Agrupamento de resultados (pós-busca)
      const groups = finalResults.reduce((acc, feature) => {
        const collectionTitle = collections.find(
          c => c.id === feature.collection
        )?.title || feature.collection || 'Resultados';

        if (!acc[collectionTitle]) acc[collectionTitle] = [];
        acc[collectionTitle].push(feature);
        return acc;
      }, {});

      const sortedGroups = Object.keys(groups)
        .sort((a, b) => a.localeCompare(b))
        .reduce((obj, key) => {
          obj[key] = groups[key];
          return obj;
        }, {});

      setGroupedResults(sortedGroups);

    } catch (error) {
      console.error('Erro na busca STAC em lotes:', error);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0); // Reseta ao final
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
        // bbox: [oeste, sul, leste, norte]
        // bounds: [[sul, oeste], [norte, leste]]
        const bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
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
      alert('Não foi possível buscar a série temporal.');
    }
  };

  const toggleResultGroup = (groupName) => {
    setOpenResultGroups(prev => {
      const newSet = new Set(prev);
      newSet.has(groupName) ? newSet.delete(groupName) : newSet.add(groupName);
      return newSet;
    });
  };

  // --- Lógica do seletor de atributos (WTSS) ---
  const primaryWtssCollection = isAdvancedSearch
    ? selectedSatellites.find(sat => wtssCompatibleCollections.includes(sat))
    : (simpleFilter === 'wtss' ? wtssCollections[0]?.id : undefined);

  const meuToken = import.meta.env.VITE_MAPBOX_TOKEN;

  return (
    <div className="main-container" style={{ height: '100%' }}>
      <aside className="sidebar">
        <form className="filter-form" onSubmit={handleSearch}>

          {/* --- Seletor de Modo de Busca (Simples / Avançado) --- */}
          <div className="filter-group">
            <label>Modo de Busca</label>
            <div className="search-mode-toggle">
              <button
                type="button"
                className={!isAdvancedSearch ? 'active' : ''}
                onClick={() => setIsAdvancedSearch(false)}
              >
                Busca por Coleção
              </button>
              <button
                type="button"
                className={isAdvancedSearch ? 'active' : ''}
                onClick={() => setIsAdvancedSearch(true)}
              >
                Busca Avançada
              </button>
            </div>
          </div>

          {!isAdvancedSearch ? (
            // --- MODO SIMPLES (Grupos Lógicos) ---
            <div className="filter-group">
              <label>Coleções de Satélites</label>
              <select
                className="simple-filter-select"
                value={simpleFilter}
                onChange={(e) => setSimpleFilter(e.target.value)}
              >
                {/* Filtra grupos que realmente têm coleções, para não poluir o dropdown */}
                {Object.entries(logicalGroups)
                  .filter(([key, group]) => {
                    // Sempre mostra 'Todos' e 'WTSS'
                    if (key === 'all' || key === 'wtss') return true;
                    // Só mostra outros grupos se eles tiverem itens
                    return group.getIds().length > 0;
                  })
                  .map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
            </div>
          ) : (
            // --- MODO AVANÇADO (Listas Detalhadas) ---
            <div className="advanced-search-container">
              <div className="filter-group">
                <label style={{ marginBottom: '5px' }}>
                  Satélites WTSS ({wtssCollections.length})
                </label>
                <div className="dropdown-list open">
                  <ul>
                    <li>
                      <input
                        type="checkbox"
                        id="select-all-wtss"
                        checked={allWtssSelected}
                        onChange={handleSelectAllWtss}
                      />
                      <label htmlFor="select-all-wtss">
                        <strong>Selecionar Todos WTSS</strong>
                      </label>
                    </li>
                    {wtssCollections.map(col => (
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
                          <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                            {' '}(WTSS)
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="filter-group">
                <label style={{ marginBottom: '5px' }}>
                  Outros Satélites ({nonWtssCollections.length})
                </label>
                <div className="dropdown-list open">
                  <ul>
                    <li>
                      <input
                        type="checkbox"
                        id="select-all-non-wtss"
                        checked={allNonWtssSelected}
                        onChange={handleSelectAllNonWtss}
                      />
                      <label htmlFor="select-all-non-wtss">
                        <strong>Selecionar Todos (Outros)</strong>
                      </label>
                    </li>
                    {nonWtssCollections.map(col => (
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
              </div>
            </div>
          )}

          <div className="date-inputs">
            <div className="date-field">
              <label>Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label>Data de Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {primaryWtssCollection && (
            <AttributeSelector
              selectedCollection={primaryWtssCollection}
              selectedAttributes={selectedAttributes}
              setSelectedAttributes={setSelectedAttributes}
            />
          )}
          <button
            type="submit"
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? 'Buscando...' : 'Buscar Dados'}
          </button>
        </form>

        {/* --- Seção de Resultados --- */}
        <div className="results-section">
          <h3>Resultados da Busca</h3>
          <div id="search-results-list">
            {isLoading ? (
              <div className="loading-with-progress">
                <LoadingSpinner />
                <p>Carregando... {Math.round(loadingProgress)}%</p>
              </div>
            ) : searchResults.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>
                Nenhum resultado encontrado.
              </p>
            ) : (
              Object.entries(groupedResults).map(([collectionName, features]) => {
                const isOpen = openResultGroups.has(collectionName);
                return (
                  <div
                    key={collectionName}
                    className={`result-group ${isOpen ? 'is-open' : ''}`}
                  >
                    <div
                      className="result-group-header"
                      onClick={() => toggleResultGroup(collectionName)}
                    >
                      <div className="result-group-title">
                        <strong>{collectionName}</strong>
                        <span className="result-count">({features.length})</span>
                      </div>
                      <span className="accordion-icon">›</span>
                    </div>
                    <div className="result-group-items">
                      <div className="result-items-wrapper">
                        {features.map(feature => (
                          <div
                            key={feature.id}
                            className={`result-item ${selectedItemDetails?.id === feature.id ? 'active' : ''
                              }`}
                            onClick={() => handleResultClick(feature)}
                          >
                            <div className="img-placeholder">IMG</div>
                            <div className="result-info">
                              <small>Nuvens:</small>
                              <strong>
                                {feature.cloud_cover?.toFixed(2) ?? 'N/A'}%
                              </strong>
                              <small>Data:</small>
                              <strong>
                                {new Date(feature.date).toLocaleDateString()}
                              </strong>
                            </div>
                            {wtssCompatibleCollections.includes(feature.collection) && (
                              <button
                                className="download-button-table"
                                style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                                title="Analisar Série Temporal (WTSS)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGetTimeseries(feature);
                                }}
                              >
                                WTSS
                              </button>
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

      {/* --- Mapa --- */}
      <main className="map-container">
        {/* --- NOVO: Wrapper para posicionar o seletor sobre o mapa --- */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          
          {/* --- NOVO: Seletor de Estilo do Mapa --- */}
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000, // zIndex alto para ficar sobre o mapa
            background: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontFamily: 'sans-serif',
            fontSize: '0.9rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}>
            <label htmlFor="style-select" style={{ marginRight: '5px', cursor: 'pointer' }}>Estilo:</label>
            <select
              id="style-select"
              value={currentStyleKey}
              onChange={(e) => setCurrentStyleKey(e.target.value)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              {Object.entries(MAPBOX_STYLES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <MapContainer
            center={[-14.235, -51.925]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            {/* --- ATUALIZADO: TileLayer agora é dinâmico --- */}
            <TileLayer
              // A "key" força o React-Leaflet a recarregar a camada
              key={currentStyleKey} 
              // A URL usa o ID do estilo que está no estado
              url={`https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLES[currentStyleKey].id}/tiles/{z}/{x}/{y}?access_token=${meuToken}`}
              attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler
              onMapClick={handleMapClick}
              selectedCoords={selectedCoords}
            />
            <MapUpdater coords={selectedCoords} />
            {selectedGeometry && (
              <GeoJSON
                key={geoJsonKey}
                data={selectedGeometry}
                style={{ fillOpacity: 0, color: '#007bff', weight: 2 }}
              />
            )}
            {imageOverlay && (
              <ImageOverlay
                url={imageOverlay.url}
                bounds={imageOverlay.bounds}
                opacity={0.7}
                zIndex={10}
              />
            )}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default MapPage;