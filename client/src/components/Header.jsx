import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

// --- NOVO: Ícones (exemplo usando texto, pode substituir por SVGs/FontAwesome) ---
const FullscreenEnterIcon = () => <span>&#x26F6;</span>; // Exemplo: Quadrado com setas
const FullscreenExitIcon = () => <span>&#x2922;</span>; // Exemplo: Setas para dentro

// --- Recebe as novas props ---
const Header = ({ 
  selectedCoords, 
  handleCoordinateChange, 
  interfaceMode, 
  toggleInterfaceMode 
}) => {
  return (
    <header className="main-header">
      <div className="logo">
        <img 
          src="/odin_logo.png" 
          alt="Logo ODIN" 
          className="logo-image" 
        />
        <h1>ODIN</h1>
      </div>

      <div className="location-inputs-header">
        {/* Inputs de Latitude/Longitude */}
        <div className="location-field-header">
          <label htmlFor="latitude">Latitude</label>
          <input
            type="number"
            id="latitude"
            name="latitude"
            placeholder="Ex: -14.23"
            step="any"
            value={selectedCoords?.lat ?? ''}
            onChange={handleCoordinateChange}
          />
        </div>
        <div className="location-field-header">
          <label htmlFor="longitude">Longitude</label>
          <input
            type="number"
            id="longitude"
            name="longitude"
            placeholder="Ex: -51.92"
            step="any"
            value={selectedCoords?.lng ?? ''}
            onChange={handleCoordinateChange}
          />
        </div>
      </div>

      <nav className="main-nav">
        {/* Mapa e Botão de Tela Cheia JUNTOS */}
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Mapa
        </NavLink>
        <button 
          onClick={toggleInterfaceMode} 
          className="nav-link interface-toggle-button" // Mantém a classe para estilo base
          title={interfaceMode === 'sidebar' ? "Mudar para Tela Cheia" : "Mudar para Vista Padrão"}
        >
          {interfaceMode === 'sidebar' ? <FullscreenEnterIcon /> : <FullscreenExitIcon />}
        </button>
        
        {/* Outros Links */}
        <NavLink to="/data" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dados
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;