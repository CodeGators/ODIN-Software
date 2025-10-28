import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  GeoJSON,
  ImageOverlay // Mantido
} from 'react-leaflet';
import {
  getCollections,
  searchStac,
  getItemDetails,
  getTimeseries
} from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LoadingSpinner from '../components/LoadingSpiner';
import { Rnd } from "react-rnd"; // Mantido para popup WTSS

// Importa os componentes de painel, popup e modal
import FilterPanel from '../components/FilterPanel';
import ResultsPanel from '../components/ResultsPanel';
import FullScreenMapLayout from '../layouts/FullScreenMapLayout';
import SelectedItemPopup from '../components/SelectedItemPopup'; // Mantido
import TimeseriesChart from '../components/TimeseriesChart';
// import Modal from '../components/Modal'; // REMOVIDO

// --- Mapeamento de Atributos (pode mover para outro arquivo e importar) ---
const attributesMap = {
  'S2-16D-2': ['NDVI', 'EVI', 'red', 'green', 'blue', 'nir', 'swir16', 'swir22'],
  'LANDSAT-16D-1': ['NDVI', 'EVI', 'red', 'green', 'blue', 'nir08', 'swir16', 'swir22'],
  'CBERS4-WFI-16D-2': ['NDVI', 'EVI', 'BAND13', 'BAND14', 'BAND15', 'BAND16'],
  'CBERS-WFI-8D-1': ['NDVI', 'EVI', 'BAND13', 'BAND14', 'BAND15', 'BAND16'],
  'CBERS4-MUX-2M-1': ['NDVI', 'EVI', 'BAND5', 'BAND6', 'BAND7', 'BAND8'],
  'mod13q1-6.1': ['NDVI', 'EVI', 'red_reflectance', 'NIR_reflectance'],
  'myd13q1-6.1': ['NDVI', 'EVI', 'red_reflectance', 'NIR_reflectance'],
  'mod11a2-6.1': ['LST_Day_1km', 'LST_Night_1km'],
  'myd11a2-6.1': ['LST_Day_1km', 'LST_Night_1km'],
  // Adicione outras coleções WTSS e seus atributos aqui
};
export { attributesMap }; // Exporta para FilterPanel/AttributeSelector


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

// --- Constantes ---
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
    if (coords?.lat != null && coords?.lng != null) {
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
  // --- Props do App.jsx ---
  searchResults, setSearchResults,
  selectedItemDetails, setSelectedItemDetails,
  selectedCoords, setSelectedCoords,
  timeseriesData, setTimeseriesData, // Recebe timeseriesData
  // isModalOpen, // REMOVIDO
  // setIsModalOpen, // REMOVIDO
  imageOverlay, setImageOverlay, // Recebe imageOverlay e setImageOverlay
  interfaceMode
}) => {

  // --- Estados INTERNOS da MapPage ---
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [geoJsonKey, setGeoJsonKey] = useState(null);
  const [groupedResults, setGroupedResults] = useState({});
  const [openResultGroups, setOpenResultGroups] = useState(new Set());
  const [wtssCollections, setWtssCollections] = useState([]);
  const [nonWtssCollections, setNonWtssCollections] = useState([]);
  const [currentStyleKey, setCurrentStyleKey] = useState('navigation');
  const [isWtssPopupOpen, setIsWtssPopupOpen] = useState(false); // Estado LOCAL para popup WTSS

  // --- STORAGE: Carrega valores iniciais ---
  const [startDate, setStartDate] = useState(() => sessionStorage.getItem('odin_map_startDate') || '');
  const [endDate, setEndDate] = useState(() => sessionStorage.getItem('odin_map_endDate') || '');
  const [selectedAttributes, setSelectedAttributes] = useState(() => {
      const saved = sessionStorage.getItem('odin_map_selectedAttributes');
      try { return saved ? JSON.parse(saved) : ['NDVI']; } catch { return ['NDVI']; }
  });
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(() => (sessionStorage.getItem('odin_map_isAdvancedSearch') === 'true'));
  const [simpleFilter, setSimpleFilter] = useState(() => sessionStorage.getItem('odin_map_simpleFilter') || 'all');
  const [selectedSatellites, setSelectedSatellites] = useState(() => {
      const saved = sessionStorage.getItem('odin_map_selectedSatellites');
      try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  // --- Grupos Lógicos ---
  const logicalGroups = {
      'all': { label: 'Todos os Satélites', getIds: () => collections.map(c => c.id) },
      'wtss': { label: 'Apenas Satélites WTSS', getIds: () => wtssCollections.map(c => c.id) },
      'amazonia': { label: 'Coleção AMAZONIA', getIds: () => collections.filter(c => c.title?.toLowerCase().startsWith('amazonia')).map(c => c.id) },
      'cbers': { label: 'Coleção CBERS', getIds: () => collections.filter(c => c.title?.toLowerCase().startsWith('cbers')).map(c => c.id) },
      'eta': { label: 'Coleção Eta Model', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('eta model')).map(c => c.id) },
      'goes': { label: 'Coleção GOES', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('goes')).map(c => c.id) },
      'landsat': { label: 'Coleção LANDSAT', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('landsat')).map(c => c.id) },
      'lcc': { label: 'Coleção Land Cover (LCC)', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('lcc -')).map(c => c.id) },
      'merge': { label: 'Coleção MERGE', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('merge')).map(c => c.id) },
      'modis': { label: 'Coleção MODIS', getIds: () => collections.filter(c => { const t=c.title.toLowerCase(); return t.startsWith('modis') || t.startsWith('mod11') || t.startsWith('mod13') || t.startsWith('myd11') || t.startsWith('myd13'); }).map(c => c.id) },
      'samet': { label: 'Coleção SAMeT', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('samet')).map(c => c.id) },
      'sentinel1': { label: 'Coleção Sentinel-1', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('sentinel-1')).map(c => c.id) },
      'sentinel2': { label: 'Coleção Sentinel-2', getIds: () => collections.filter(c => { const t=c.title.toLowerCase(); return t.startsWith('sentinel-2') || t.startsWith('s2 '); }).map(c => c.id) },
      'sentinel3': { label: 'Coleção Sentinel-3', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('sentinel-3')).map(c => c.id) },
      'sentinel5p': { label: 'Coleção Sentinel-5P', getIds: () => collections.filter(c => c.title.toLowerCase().startsWith('sentinel-5p')).map(c => c.id) },
  };

  // --- Helpers (calculados a partir dos estados) ---
  const allWtssSelected = wtssCollections.length > 0 && wtssCollections.every(c => selectedSatellites.includes(c.id));
  const allNonWtssSelected = nonWtssCollections.length > 0 && nonWtssCollections.every(c => selectedSatellites.includes(c.id));
  const primaryWtssCollection = isAdvancedSearch
    ? selectedSatellites.find(sat => wtssCompatibleCollections.includes(sat))
    : (simpleFilter === 'wtss' && wtssCollections.length > 0 ? wtssCollections[0]?.id : undefined);

  // --- useEffect para buscar coleções ---
  useEffect(() => {
    let isMounted = true;
    getCollections()
      .then((response) => {
        if (!isMounted || !response?.data) return;
        const cleaned = response.data.filter(item => item?.id && item.title);
        const seen = new Set();
        const unique = cleaned.filter(item => !seen.has(item.id) && seen.add(item.id));
        const sorted = [...unique].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        setCollections(sorted);
        setWtssCollections(sorted.filter(c => wtssCompatibleCollections.includes(c.id)));
        setNonWtssCollections(sorted.filter(c => !wtssCompatibleCollections.includes(c.id)));
      })
      .catch((error) => { if (isMounted) console.error('ERRO getCollections:', error); });
    return () => { isMounted = false; };
  }, []);

  // --- useEffect para cleanup (visual) ---
  useEffect(() => { return () => { setSelectedGeometry(null); }; }, []);

  // --- STORAGE: Efeitos para SALVAR ---
  useEffect(() => { if (selectedCoords) { try { sessionStorage.setItem('odin_map_selectedCoords', JSON.stringify(selectedCoords)); } catch (e) { console.error("Erro salvar coords:", e); } } else { sessionStorage.removeItem('odin_map_selectedCoords'); } }, [selectedCoords]);
  useEffect(() => { sessionStorage.setItem('odin_map_startDate', startDate); }, [startDate]);
  useEffect(() => { sessionStorage.setItem('odin_map_endDate', endDate); }, [endDate]);
  useEffect(() => { try { sessionStorage.setItem('odin_map_selectedAttributes', JSON.stringify(selectedAttributes)); } catch (e) { console.error("Erro salvar attributes:", e); } }, [selectedAttributes]);
  useEffect(() => { sessionStorage.setItem('odin_map_isAdvancedSearch', isAdvancedSearch.toString()); }, [isAdvancedSearch]);
  useEffect(() => { sessionStorage.setItem('odin_map_simpleFilter', simpleFilter); }, [simpleFilter]);
  useEffect(() => { try { sessionStorage.setItem('odin_map_selectedSatellites', JSON.stringify(selectedSatellites)); } catch (e) { console.error("Erro salvar satellites:", e); } }, [selectedSatellites]);

  // --- useEffect para limpar atributos selecionados inválidos ---
  useEffect(() => {
    if (primaryWtssCollection) {
      const validAttributesForCurrent = attributesMap[primaryWtssCollection] || [];
      const validSelected = selectedAttributes.filter(attr => validAttributesForCurrent.includes(attr));
      if (JSON.stringify(validSelected) !== JSON.stringify(selectedAttributes)) {
            console.log(`Filtrando atributos inválidos para ${primaryWtssCollection}. Válidos agora:`, validSelected);
            setSelectedAttributes(validSelected);
      }
    }
  }, [primaryWtssCollection, selectedAttributes]);


  // --- Handlers ---
  const handleMapClick = (latlng) => setSelectedCoords(latlng);
  const handleSatelliteChange = (event) => { const { value, checked } = event.target; setSelectedSatellites(prev => checked ? [...prev, value] : prev.filter(id => id !== value)); };
  const handleSelectAllWtss = (event) => { const { checked } = event.target; const ids = wtssCollections.map(c => c.id); setSelectedSatellites(prev => { const others = prev.filter(id => !ids.includes(id)); return checked ? [...others, ...ids] : others; }); };
  const handleSelectAllNonWtss = (event) => { const { checked } = event.target; const ids = nonWtssCollections.map(c => c.id); setSelectedSatellites(prev => { const others = prev.filter(id => !ids.includes(id)); return checked ? [...others, ...ids] : others; }); };

  const handleSearch = async (event) => {
      event.preventDefault();
      if (!selectedCoords) { alert('Selecione um ponto no mapa.'); return; }
      let idsToSearch = [];
      if (isAdvancedSearch) {
          if (selectedSatellites.length === 0) { alert('Selecione satélites.'); return; }
          idsToSearch = [...selectedSatellites];
      } else {
          const group = logicalGroups[simpleFilter];
          if (!group?.getIds) { alert('Grupo inválido.'); return; }
          idsToSearch = group.getIds();
          if (!Array.isArray(idsToSearch)) { alert('Erro getIds.'); return; }
          if (idsToSearch.length === 0 && collections.length > 0) { alert(`Grupo "${group.label}" sem satélites.`); }
      }
      setIsLoading(true); setLoadingProgress(0); setSearchResults([]); setGroupedResults({});
      setSelectedGeometry(null); setSelectedItemDetails(null); setImageOverlay(null);

      const collectionsAPI = idsToSearch.map(id => id?.toUpperCase().startsWith('AMAZONIA') ? 'AMAZONIA' : id).filter(Boolean);
      const uniqueCollections = [...new Set(collectionsAPI)];
      const BATCH_SIZE = 15; const batches = [];
      for (let i = 0; i < uniqueCollections.length; i += BATCH_SIZE) { batches.push(uniqueCollections.slice(i, i + BATCH_SIZE)); }
      console.log(`Buscando ${uniqueCollections.length} coleções em ${batches.length} lotes.`);
      try {
          let results = []; let processed = 0;
          for (const batch of batches) {
              if (batch.length === 0) continue;
              const payload = { latitude: selectedCoords.lat, longitude: selectedCoords.lng, collections: batch, startDate, endDate };
              console.log(`Lote ${processed + 1}/${batches.length}: ${batch.join(', ')}`);
              try { const res = await searchStac(payload); if (res?.data) results = [...results, ...res.data]; }
              catch (batchErr) { console.error(`Erro lote ${processed + 1}:`, batchErr); }
              processed++; setLoadingProgress((processed / batches.length) * 100);
          }
          const seen = new Set();
          const final = results.filter(item => { if (!item?.id || !item.geometry || seen.has(item.id)) return false; seen.add(item.id); return true; });
          setSearchResults(final);
          const groups = final.reduce((acc, f) => { const cId=f.collection; const title=collections.find(c=>c.id===cId)?.title||cId||'Res'; if(!acc[title])acc[title]=[]; acc[title].push(f); return acc; }, {});
          const sorted = Object.keys(groups).sort().reduce((obj, key) => {obj[key]=groups[key]; return obj;}, {});
          setGroupedResults(sorted);
          setOpenResultGroups(Object.keys(sorted).length > 0 ? new Set([Object.keys(sorted)[0]]) : new Set());
      } catch (err) { console.error('Erro busca:', err); alert('Erro na busca.'); }
      finally { setIsLoading(false); setLoadingProgress(0); }
  };

  const handleResultClick = async (item) => {
      if (selectedItemDetails?.id === item.id) {
          setSelectedItemDetails(null); setSelectedGeometry(null); setImageOverlay(null); return;
      }
      try {
          const res = await getItemDetails(item.collection, item.id); const details = res.data;
          setSelectedItemDetails(details); setSelectedGeometry(null); setImageOverlay(null);
          if (details.geometry) { setSelectedGeometry(details.geometry); setGeoJsonKey(Date.now()); }
          const thumb = details.assets?.thumbnail?.href; const bbox = details.bbox;
          if (thumb && bbox?.length === 4) { const bounds=[[bbox[1],bbox[0]],[bbox[3],bbox[2]]]; setImageOverlay({url:thumb,bounds:bounds}); }
          else { console.warn("Thumb/BBox inválido:", item.id); setImageOverlay(null); }
      } catch (err) { console.error('Erro detalhes:', err); setSelectedItemDetails(null); setImageOverlay(null); setSelectedGeometry(null); }
  };

  const handleGetTimeseries = async (item) => {
      if (!selectedCoords || !startDate || !endDate) { alert("Selecione ponto e datas."); return; }
      const validAttributesForRequest = selectedAttributes.filter(attr => (attributesMap[item.collection] || []).includes(attr));
      if (validAttributesForRequest.length === 0) { alert(`Nenhum atributo selecionado válido para ${item.collection}.`); return; }

      const params = { coverage: item.collection, latitude: selectedCoords.lat, longitude: selectedCoords.lng, attributes: validAttributesForRequest.join(','), startDate, endDate };
      console.log("handleGetTimeseries: Chamando API com params:", params);
      try {
          const res = await getTimeseries(params);
          console.log("handleGetTimeseries: Resposta da API:", res.data);
          setTimeseriesData(res.data); // Atualiza PAI
          setIsWtssPopupOpen(true);    // Abre o POPUP LOCAL
          console.log("handleGetTimeseries: Chamou setIsWtssPopupOpen(true)");
      } catch (err) {
          console.error('Erro WTSS:', err);
          const apiErrorDescription = err.response?.data?.description;
          alert(`Erro ao buscar série temporal.${apiErrorDescription ? `\nDetalhes: ${apiErrorDescription}` : ''}`);
      }
  };

  const toggleResultGroup = (groupName) => {
      setOpenResultGroups(prev => { const n=new Set(prev); n.has(groupName)?n.delete(groupName):n.add(groupName); return n; });
  };

  // --- Token Mapbox ---
  const meuToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // --- Renderização do mapa ---
  const renderMap = () => (
    <div
      className={interfaceMode === 'fullscreen' ? 'map-container-fullscreen' : 'map-container'}
      style={{ height: '100%', width: '100%' }}
    >
      <div className="map-inner-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* --- Seletor de Estilo com a CLASSE --- */}
          <div className="map-style-selector">
              <label htmlFor="style-select">Estilo:</label>
              <select id="style-select" value={currentStyleKey} onChange={(e) => setCurrentStyleKey(e.target.value)}>
                  {Object.entries(MAPBOX_STYLES).map(([key, { label }]) => ( <option key={key} value={key}>{label}</option> ))}
              </select>
          </div>
          {/* Mapa Leaflet */}
          <MapContainer center={[-14.235, -51.925]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer key={currentStyleKey} url={`https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLES[currentStyleKey].id}/tiles/{z}/{x}/{y}?access_token=${meuToken}`} attribution='&copy; Mapbox &copy; OpenStreetMap'/>
              <MapClickHandler onMapClick={handleMapClick} selectedCoords={selectedCoords} />
              <MapUpdater coords={selectedCoords} />
              {selectedGeometry && <GeoJSON key={geoJsonKey} data={selectedGeometry} style={{ fillOpacity: 0, color: '#007bff', weight: 2 }} />}
              {/* Renderiza ImageOverlay */}
              {imageOverlay && imageOverlay.url && imageOverlay.bounds && ( <ImageOverlay url={imageOverlay.url} bounds={imageOverlay.bounds} opacity={0.7} zIndex={10} /> )}
          </MapContainer>
           {/* Renderiza o Popup Móvel da Imagem */}
           {selectedItemDetails && (
              <SelectedItemPopup
                  details={selectedItemDetails}
                  imageUrl={imageOverlay?.url}
                  onClose={() => { setSelectedItemDetails(null); setImageOverlay(null); setSelectedGeometry(null); }}
                  bounds=".map-inner-container" // Certifique-se que esta classe existe no div pai
              />
          )}
          {/* Renderiza o Popup Móvel da Série Temporal */}
          {isWtssPopupOpen && timeseriesData && (
              <Rnd
                  default={{ x: 40, y: window.innerHeight - 500, width: 600, height: 400 }}
                  minWidth={300} minHeight={250}
                  bounds=".map-inner-container"
                  dragHandleClassName="popup-header"
                  className="popup-window wtss-chart-popup" // Usa as classes
                  enableResizing={{ bottomRight: true, right: true, bottom: true }}
                  style={{ zIndex: 1005 }}
                  cancel=".popup-content"
              >
                  <div className="popup-header">
                      <span className="popup-title">Série Temporal WTSS</span>
                      <button className="popup-close-button" onClick={() => setIsWtssPopupOpen(false)} title="Fechar">&times;</button>
                  </div>
                  <div className="popup-content" style={{ overflow: 'auto' }}>
                      <TimeseriesChart timeseriesData={timeseriesData} />
                  </div>
              </Rnd>
          )}
      </div>
    </div>
  );

  // --- Renderização do conteúdo da sidebar/painel ---
  const renderSidebarContent = () => (
    <>
      <FilterPanel {...{ collections, startDate, endDate, selectedSatellites, isAdvancedSearch, simpleFilter, logicalGroups, wtssCollections, nonWtssCollections, allWtssSelected, allNonWtssSelected, primaryWtssCollection, selectedAttributes, isLoading, handleSearch, setIsAdvancedSearch, setSimpleFilter, handleSatelliteChange, handleSelectAllWtss, handleSelectAllNonWtss, setStartDate, setEndDate, setSelectedAttributes, attributesMap }} />
      <ResultsPanel {...{ isLoading, loadingProgress, searchResults, groupedResults, openResultGroups, selectedItemDetails, collections, wtssCompatibleCollections, toggleResultGroup, handleResultClick, handleGetTimeseries }} />
    </>
  );

  // --- Renderização Condicional Principal ---
  return (
    interfaceMode === 'sidebar' ? (
        <div className="main-container" style={{ height: '100%' }}>
          <aside className="sidebar">
            {renderSidebarContent()}
          </aside>
          {renderMap()}
        </div>
      ) : (
        <FullScreenMapLayout {...{ collections, startDate, endDate, selectedSatellites, isAdvancedSearch, simpleFilter, logicalGroups, wtssCollections, nonWtssCollections, allWtssSelected, allNonWtssSelected, primaryWtssCollection, selectedAttributes, isLoading, loadingProgress, searchResults, groupedResults, openResultGroups, selectedItemDetails, wtssCompatibleCollections, handleSearch, setIsAdvancedSearch, setSimpleFilter, handleSatelliteChange, handleSelectAllWtss, handleSelectAllNonWtss, setStartDate, setEndDate, setSelectedAttributes, toggleResultGroup, handleResultClick, handleGetTimeseries, attributesMap }}>
          {renderMap()}
        </FullScreenMapLayout>
      )
  );
}; // Fim do componente MapPage

export default MapPage;