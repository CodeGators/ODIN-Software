// Arquivo: App.jsx
import React, { useState, useRef, useEffect } from 'react'; 
import { Routes, Route, Outlet } from 'react-router-dom';
import MapPage from './pages/MapPage';
// REMOVIDO: import DataPage from './pages/DataPage'; 
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import WelcomeModal from './components/WelcomeModal'; 

import 'react-resizable/css/styles.css'; 

// Chave para o localStorage
const LOCAL_STORAGE_KEY = 'hasVisitedOdinTutorial';

function App() {
  // --- Seus Estados Atuais ---
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(() => {
    const savedCoords = sessionStorage.getItem('odin_map_selectedCoords');
    try { return savedCoords ? JSON.parse(savedCoords) : null; }
    catch { sessionStorage.removeItem('odin_map_selectedCoords'); return null; }
  });
  const [timeseriesData, setTimeseriesData] = useState([]); 
  const [imageOverlay, setImageOverlay] = useState(null);
  const [interfaceMode, setInterfaceMode] = useState('sidebar');

  // --- Nova Lógica para Controlar o Modal de Ajuda ---
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // 1. Verifica na montagem (apenas uma vez) se o usuário já visitou
  useEffect(() => {
    const hasVisited = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    // Se a chave não existir, abre o modal
    if (!hasVisited) {
      setIsHelpModalOpen(true);
    }
  }, []); 

  // 2. Função para o botão de "Ajuda" (no Header)
  const handleHelpClick = () => {
    setIsHelpModalOpen(true);
  };

  // 3. Função para fechar o modal (passada para o WelcomeModal)
  const handleModalClose = () => {
    // Salva no localStorage para não mostrar automaticamente de novo
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    // Fecha o modal
    setIsHelpModalOpen(false);
  };
  // --- Fim da Lógica do Modal ---


  // --- Seus Handlers Atuais ---
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value ? parseFloat(value) : null;
    setSelectedCoords(prev => ({ lat: name === 'latitude' ? numericValue : (prev?.lat ?? null), lng: name === 'longitude' ? numericValue : (prev?.lng ?? null) }));
  };

  const toggleInterfaceMode = () => {
    setInterfaceMode(prevMode => prevMode === 'sidebar' ? 'fullscreen' : 'sidebar');
    setSelectedItemDetails(null);
    setImageOverlay(null);
  };

  return (
    <div className={`app-container app-mode-${interfaceMode}`}>
      <Header
        selectedCoords={selectedCoords}
        handleCoordinateChange={handleCoordinateChange}
        interfaceMode={interfaceMode}
        toggleInterfaceMode={toggleInterfaceMode}
        onHelpClick={handleHelpClick} 
      />
        <Routes>
          <Route
            path="/"
            element={<MapPage
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              selectedItemDetails={selectedItemDetails}
              setSelectedItemDetails={setSelectedItemDetails}
              selectedCoords={selectedCoords}
              setSelectedCoords={setSelectedCoords}
              timeseriesData={timeseriesData} 
              setTimeseriesData={setTimeseriesData} 
              imageOverlay={imageOverlay}
              setImageOverlay={setImageOverlay}
              interfaceMode={interfaceMode}
            />}
          />
          <Route element={<ContentWrapper />}>
            {/* Rota /data REMOVIDA AQUI */}
            <Route path="/dashboard" element={
                <DashboardPage
                    timeseriesData={timeseriesData} 
                    selectedCoords={selectedCoords}
                    searchResults={searchResults} 
                />}
            />
          </Route>
        </Routes>

      {/* 5. Renderiza o modal com as props de controle */}
      <WelcomeModal 
        isOpen={isHelpModalOpen} 
        onClose={handleModalClose} 
      />

    </div>
  );
}

// Componente Wrapper para adicionar a classe page-content
const ContentWrapper = () => (
    <main className="page-content">
      <Outlet />
    </main>
);

export default App;