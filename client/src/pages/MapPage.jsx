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

// Importa os novos componentes de painel
import FilterPanel from '../components/FilterPanel'; 
import ResultsPanel from '../components/ResultsPanel'; 
import FullScreenMapLayout from '../layouts/FullScreenMapLayout'; 

// --- Configuração dos Ícones ---
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

// --- Constantes (mantidas da sua versão original) ---
const wtssCompatibleCollections = [
  'CBERS4-MUX-2M-1', 'CBERS4-WFI-16D-2', 'CBERS-WFI-8D-1', 'LANDSAT-16D-1',
  'mod11a2-6.1', 'mod13q1-6.1', 'myd11a2-6.1', 'myd13q1-6.1', 'S2-16D-2'
];

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
  imageOverlay, setImageOverlay,
  interfaceMode // Recebe o modo da interface
}) => {
  
  // --- Estados ---
  const [collections, setCollections] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedSatellites, setSelectedSatellites] = useState([]); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [geoJsonKey, setGeoJsonKey] = useState(null);
  const [groupedResults, setGroupedResults] = useState({});
  const [openResultGroups, setOpenResultGroups] = useState(new Set());
  const [selectedAttributes, setSelectedAttributes] = useState(['NDVI']);
  const [wtssCollections, setWtssCollections] = useState([]);
  const [nonWtssCollections, setNonWtssCollections] = useState([]);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [simpleFilter, setSimpleFilter] = useState('all');
  const [currentStyleKey, setCurrentStyleKey] = useState('navigation');
  
  // --- Grupos Lógicos (Definição deve estar aqui ou ser importada) ---
  // (Mantido como estava definido anteriormente)
  const logicalGroups = {
    'all': { label: 'Todos os Satélites', getIds: () => collections.map(c => c.id) },
    'wtss': { label: 'Apenas Satélites WTSS', getIds: () => wtssCollections.map(c => c.id) },
    'amazonia': { label: 'Coleção AMAZONIA', getIds: () => collections.filter(c => c.title?.toLowerCase().startsWith('amazonia')).map(c => c.id) },
    'cbers': { label: 'Coleção CBERS', getIds: () => collections.filter(c => c.title?.toLowerCase().startsWith('cbers')).map(c => c.id) },
    // ... (restante dos grupos lógicos)
     'eta': {
      label: 'Coleção Eta Model',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('eta model')).map(c => c.id)
    },
    'goes': {
      label: 'Coleção GOES',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('goes')).map(c => c.id)
    },
    'landsat': {
      label: 'Coleção LANDSAT',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('landsat')).map(c => c.id)
    },
    'lcc': {
      label: 'Coleção Land Cover (LCC)',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('lcc -')).map(c => c.id)
    },
    'merge': {
      label: 'Coleção MERGE',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('merge')).map(c => c.id)
    },
    'modis': {
      label: 'Coleção MODIS',
      getIds: () => collections.filter(c => {
        const title = c.title.toLowerCase();
        return title.startsWith('modis') || title.startsWith('mod11') || title.startsWith('mod13') || title.startsWith('myd11') || title.startsWith('myd13');
      }).map(c => c.id)
    },
    'samet': {
      label: 'Coleção SAMeT',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('samet')).map(c => c.id)
    },
    'sentinel1': {
      label: 'Coleção Sentinel-1',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('sentinel-1')).map(c => c.id)
    },
    'sentinel2': {
      label: 'Coleção Sentinel-2',
      getIds: () => collections.filter(c => {
        const title = c.title.toLowerCase();
        return title.startsWith('sentinel-2') || title.startsWith('s2 ');
      }).map(c => c.id)
    },
    'sentinel3': {
      label: 'Coleção Sentinel-3',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('sentinel-3')).map(c => c.id)
    },
    'sentinel5p': {
      label: 'Coleção Sentinel-5P',
      getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('sentinel-5p')).map(c => c.id)
    },
  };

  // --- useEffect para buscar coleções ---
  useEffect(() => {
    getCollections()
      .then((response) => {
        if (!response || !Array.isArray(response.data)) return;
        // ... (lógica de limpeza e ordenação das coleções)
        const cleanedData = response.data.filter(item => item && typeof item === 'object' && item.id && typeof item.title === 'string');
        const seenIds = new Set();
        const uniqueData = cleanedData.filter(item => { if (seenIds.has(item.id)) return false; seenIds.add(item.id); return true; });
        const sortedCollections = [...uniqueData].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

        setCollections(sortedCollections); 

        const wtssList = sortedCollections.filter(c => wtssCompatibleCollections.includes(c.id));
        const nonWtssList = sortedCollections.filter(c => !wtssCompatibleCollections.includes(c.id));
        setWtssCollections(wtssList);
        setNonWtssCollections(nonWtssList);
      })
      .catch((error) => console.error('ERRO ao buscar coleções:', error));
  }, []);

  // --- useEffect para cleanup ---
  useEffect(() => {
    return () => {
      setSelectedGeometry(null);
      if (setSelectedItemDetails) setSelectedItemDetails(null);
      if (setImageOverlay) setImageOverlay(null);
    };
  }, [setSelectedItemDetails, setImageOverlay]);

  // --- Handlers ---
  const handleMapClick = (latlng) => setSelectedCoords(latlng);
  
  const handleSatelliteChange = (event) => {
    const { value, checked } = event.target;
    setSelectedSatellites((prev) =>
      checked ? [...prev, value] : prev.filter((id) => id !== value)
    );
  };

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
  
  const handleSearch = async (event) => {
    event.preventDefault();
    if (!selectedCoords || selectedCoords.lat == null || selectedCoords.lng == null) {
      alert('Selecione um ponto no mapa ou preencha a latitude e longitude.');
      return;
    }

    let collectionsForSearchIds = [];
    if (isAdvancedSearch) {
      if (selectedSatellites.length === 0) { alert('Selecione pelo menos um satélite na busca avançada.'); return; }
      collectionsForSearchIds = [...selectedSatellites];
    } else {
      const group = logicalGroups[simpleFilter];
      if (!group || typeof group.getIds !== 'function') { alert('Grupo de filtro inválido.'); return; }
      collectionsForSearchIds = group.getIds();
      if (!Array.isArray(collectionsForSearchIds)) { alert('Erro interno: getIds não retornou um array.'); return; }
      if (collectionsForSearchIds.length === 0 && collections.length > 0) { // Só alerta se coleções já carregaram
        alert(`O grupo "${group.label}" não retornou nenhum satélite.`);
        // Não retorna aqui, permite busca vazia se o usuário insistir
      }
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setSearchResults([]);
    setGroupedResults({});
    setSelectedGeometry(null);
    setSelectedItemDetails(null);
    setImageOverlay(null);

    // Agrupamento 'AMAZONIA' mantido
    const collectionsForSearch = collectionsForSearchIds.map(id => id?.toUpperCase().startsWith('AMAZONIA') ? 'AMAZONIA' : id).filter(Boolean); // Filtra nulos/undefined
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
        if (batch.length === 0) continue; // Pula lotes vazios
        
        const searchPayload = {
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
          collections: batch,
          startDate,
          endDate,
        };

        console.log(`Buscando lote ${batchesProcessed + 1}/${allBatches.length}: ${batch.join(', ')}`);
        try {
          const response = await searchStac(searchPayload);
          if (response && Array.isArray(response.data)) {
            allResults = [...allResults, ...response.data];
          }
        } catch (batchError) {
          console.error(`Erro ao buscar lote ${batchesProcessed + 1}:`, batchError);
          // Continua para o próximo lote
        }

        batchesProcessed++;
        const progress = (batchesProcessed / allBatches.length) * 100;
        setLoadingProgress(progress);
      }

      // Filtra duplicados e itens inválidos APÓS buscar todos os lotes
      const seenResultIds = new Set();
      const finalResults = allResults.filter(item => {
        if (!item || !item.id || !item.geometry) return false; // Verifica se tem id e geometria
        if (seenResultIds.has(item.id)) return false;
        seenResultIds.add(item.id);
        return true;
      });

      setSearchResults(finalResults);

      // Agrupamento (pós-busca)
      const groups = finalResults.reduce((acc, feature) => {
        // Encontra o título original da coleção, mesmo se agrupado (ex: AMAZONIA)
        const originalCollectionId = feature.collection;
        const collectionTitle = collections.find(c => c.id === originalCollectionId)?.title || originalCollectionId || 'Resultados';
        
        if (!acc[collectionTitle]) acc[collectionTitle] = [];
        acc[collectionTitle].push(feature);
        return acc;
      }, {});
      
      const sortedGroups = Object.keys(groups).sort((a, b) => a.localeCompare(b)).reduce((obj, key) => { obj[key] = groups[key]; return obj; }, {});
      setGroupedResults(sortedGroups);
      // Abre o primeiro grupo por padrão se houver resultados
      if (Object.keys(sortedGroups).length > 0) {
        setOpenResultGroups(new Set([Object.keys(sortedGroups)[0]]));
      } else {
        setOpenResultGroups(new Set());
      }


    } catch (error) {
      console.error('Erro geral na busca STAC em lotes:', error);
      alert('Ocorreu um erro durante a busca. Verifique o console.'); // Mensagem mais genérica
    } finally {
      setIsLoading(false);
      setLoadingProgress(0); 
    }
  };

  const handleResultClick = async (item) => {
    // ... (lógica mantida)
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
      setImageOverlay(null); // Limpa overlay anterior
      setSelectedGeometry(null); // Limpa geometria anterior

      if (details.geometry) {
        setSelectedGeometry(details.geometry);
        setGeoJsonKey(Date.now()); // Força rerenderização do GeoJSON
      }

      const thumbnailUrl = details.assets?.thumbnail?.href;
      const bbox = details.bbox; // bbox: [oeste, sul, leste, norte]

      if (thumbnailUrl && bbox && Array.isArray(bbox) && bbox.length === 4) {
        const bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]]; // bounds: [[sul, oeste], [norte, leste]]
        setImageOverlay({ url: thumbnailUrl, bounds: bounds });
      } else {
         console.warn("Thumbnail ou BBox ausente/inválido para:", item.id);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do item:', error);
      setSelectedItemDetails(null);
      setImageOverlay(null);
      setSelectedGeometry(null); // Limpa em caso de erro também
    }
  };

  const handleGetTimeseries = async (item) => {
    // ... (lógica mantida)
     if (!selectedCoords || !startDate || !endDate) {
      alert("Por favor, selecione um ponto no mapa e um intervalo de datas.");
      return;
    }
    if (selectedAttributes.length === 0) {
      alert("Por favor, selecione pelo menos um atributo WTSS para analisar.");
      return;
    }
    const params = { coverage: item.collection, latitude: selectedCoords.lat, longitude: selectedCoords.lng, attributes: selectedAttributes.join(','), startDate, endDate, };
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

  // --- Helpers ---
  const allWtssSelected = wtssCollections.length > 0 && wtssCollections.every(c => selectedSatellites.includes(c.id));
  const allNonWtssSelected = nonWtssCollections.length > 0 && nonWtssCollections.every(c => selectedSatellites.includes(c.id));
  const primaryWtssCollection = isAdvancedSearch
    ? selectedSatellites.find(sat => wtssCompatibleCollections.includes(sat))
    : (simpleFilter === 'wtss' && wtssCollections.length > 0 ? wtssCollections[0]?.id : undefined); // Pega o primeiro WTSS se o filtro simples for 'wtss'

  const meuToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // --- Lógica de renderização do mapa ---
  const renderMap = () => (
    <div 
      className={interfaceMode === 'fullscreen' ? 'map-container-fullscreen' : 'map-container'}
      style={{ height: '100%', width: '100%' }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', padding: '5px 10px', borderRadius: '5px', fontFamily: 'sans-serif', fontSize: '0.9rem', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', cursor: 'pointer' }}>
              <label htmlFor="style-select" style={{ marginRight: '5px', cursor: 'pointer' }}>Estilo:</label>
              <select id="style-select" value={currentStyleKey} onChange={(e) => setCurrentStyleKey(e.target.value)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  {Object.entries(MAPBOX_STYLES).map(([key, { label }]) => ( <option key={key} value={key}>{label}</option> ))}
              </select>
          </div>
          <MapContainer center={[-14.235, -51.925]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer key={currentStyleKey} url={`https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLES[currentStyleKey].id}/tiles/{z}/{x}/{y}?access_token=${meuToken}`} attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
              <MapClickHandler onMapClick={handleMapClick} selectedCoords={selectedCoords} />
              <MapUpdater coords={selectedCoords} />
              {selectedGeometry && <GeoJSON key={geoJsonKey} data={selectedGeometry} style={{ fillOpacity: 0, color: '#007bff', weight: 2 }} />}
              {imageOverlay && <ImageOverlay url={imageOverlay.url} bounds={imageOverlay.bounds} opacity={0.7} zIndex={10} />}
          </MapContainer>
      </div>
    </div>
  );

  // --- Lógica de renderização do painel lateral ---
  const renderSidebarContent = () => (
    <>
      <FilterPanel
        collections={collections}
        startDate={startDate}
        endDate={endDate}
        selectedSatellites={selectedSatellites}
        isAdvancedSearch={isAdvancedSearch}
        simpleFilter={simpleFilter}
        logicalGroups={logicalGroups}
        wtssCollections={wtssCollections}
        nonWtssCollections={nonWtssCollections}
        allWtssSelected={allWtssSelected}
        allNonWtssSelected={allNonWtssSelected}
        primaryWtssCollection={primaryWtssCollection}
        selectedAttributes={selectedAttributes}
        isLoading={isLoading}
        handleSearch={handleSearch}
        setIsAdvancedSearch={setIsAdvancedSearch}
        setSimpleFilter={setSimpleFilter}
        handleSatelliteChange={handleSatelliteChange}
        handleSelectAllWtss={handleSelectAllWtss}
        handleSelectAllNonWtss={handleSelectAllNonWtss}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setSelectedAttributes={setSelectedAttributes}
      />
      <ResultsPanel
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        searchResults={searchResults}
        groupedResults={groupedResults}
        openResultGroups={openResultGroups}
        selectedItemDetails={selectedItemDetails}
        collections={collections} 
        wtssCompatibleCollections={wtssCompatibleCollections} 
        toggleResultGroup={toggleResultGroup}
        handleResultClick={handleResultClick}
        handleGetTimeseries={handleGetTimeseries}
      />
    </>
  );

  // --- Renderização Condicional Principal ---
  return (
    interfaceMode === 'sidebar' ? (
      // modo Sidebar (original)
      <div className="main-container" style={{ height: '100%' }}> 
        <aside className="sidebar">
          {renderSidebarContent()} {/* Renderiza painéis na sidebar */}
        </aside>
        {renderMap()} 
      </div>
    ) : (
      //tela cheia
      <FullScreenMapLayout
        // --- NOVO: Passa TODAS as props necessárias para os painéis ---
        collections={collections}
        startDate={startDate}
        endDate={endDate}
        selectedSatellites={selectedSatellites}
        isAdvancedSearch={isAdvancedSearch}
        simpleFilter={simpleFilter}
        logicalGroups={logicalGroups}
        wtssCollections={wtssCollections}
        nonWtssCollections={nonWtssCollections}
        allWtssSelected={allWtssSelected}
        allNonWtssSelected={allNonWtssSelected}
        primaryWtssCollection={primaryWtssCollection}
        selectedAttributes={selectedAttributes}
        isLoading={isLoading}
        loadingProgress={loadingProgress} // Para ResultsPanel
        searchResults={searchResults} // Para ResultsPanel
        groupedResults={groupedResults} // Para ResultsPanel
        openResultGroups={openResultGroups} // Para ResultsPanel
        selectedItemDetails={selectedItemDetails} // Para ResultsPanel (highlight)
        wtssCompatibleCollections={wtssCompatibleCollections} // Para ResultsPanel (botão WTSS)
        // Funções
        handleSearch={handleSearch}
        setIsAdvancedSearch={setIsAdvancedSearch}
        setSimpleFilter={setSimpleFilter}
        handleSatelliteChange={handleSatelliteChange}
        handleSelectAllWtss={handleSelectAllWtss}
        handleSelectAllNonWtss={handleSelectAllNonWtss}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setSelectedAttributes={setSelectedAttributes}
        toggleResultGroup={toggleResultGroup} // Para ResultsPanel
        handleResultClick={handleResultClick} // Para ResultsPanel
        handleGetTimeseries={handleGetTimeseries} // Para ResultsPanel
      >
         {renderMap()} {/* Renderiza o mapa como filho */}
      </FullScreenMapLayout>
    )
  );
};

export default MapPage;