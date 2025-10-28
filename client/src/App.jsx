// Arquivo: App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import MapPage from './pages/MapPage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
// import TimeseriesChart from './components/TimeseriesChart'; // Não precisa mais aqui
// import './components/Modal.css'; // Não precisa mais aqui (a menos que outro componente use)
// import Draggable from 'react-draggable'; // Não precisa mais aqui
// import { ResizableBox } from 'react-resizable'; // Não precisa mais aqui
import 'react-resizable/css/styles.css'; // Mantenha se SelectedItemPopup usar RND indiretamente

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(() => { /* ... (lógica sessionStorage) ... */
    const savedCoords = sessionStorage.getItem('odin_map_selectedCoords');
    try { return savedCoords ? JSON.parse(savedCoords) : null; }
    catch { sessionStorage.removeItem('odin_map_selectedCoords'); return null; }
  });
  const [timeseriesData, setTimeseriesData] = useState(null); // Mantém para Dashboard
  // const [isModalOpen, setIsModalOpen] = useState(false); // --- REMOVIDO ---
  const [imageOverlay, setImageOverlay] = useState(null);
  const [interfaceMode, setInterfaceMode] = useState('sidebar');

  // const nodeRef = useRef(null); // --- REMOVIDO ---

  const handleCoordinateChange = (e) => { /* ... (lógica idêntica) ... */
    const { name, value } = e.target;
    const numericValue = value ? parseFloat(value) : null;
    setSelectedCoords(prev => ({ lat: name === 'latitude' ? numericValue : (prev?.lat ?? null), lng: name === 'longitude' ? numericValue : (prev?.lng ?? null) }));
  };

  const toggleInterfaceMode = () => { /* ... (lógica idêntica) ... */
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
              timeseriesData={timeseriesData} // Passa os dados
              setTimeseriesData={setTimeseriesData} // Passa a função
              // isModalOpen={isModalOpen} // --- REMOVIDO ---
              // setIsModalOpen={setIsModalOpen} // --- REMOVIDO ---
              imageOverlay={imageOverlay}
              setImageOverlay={setImageOverlay}
              interfaceMode={interfaceMode}
            />}
          />
          <Route element={<ContentWrapper />}>
            <Route path="/data" element={<DataPage searchResults={searchResults} />} />
            <Route path="/dashboard" element={
                <DashboardPage
                    searchResults={searchResults}
                    // collections={/* buscar ou passar collections */}
                    timeseriesData={timeseriesData} // Passa dados WTSS para Dashboard
                />}
            />
          </Route>
        </Routes>

      {/* --- Modal WTSS REMOVIDO daqui --- */}

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