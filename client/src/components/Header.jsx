import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

// Ícones (mantidos como texto)
const FullscreenEnterIcon = () => <span className="icon-symbol">&#x26F6;</span>;
const FullscreenExitIcon = () => <span className="icon-symbol">&#x2922;</span>;
const HelpIcon = () => <span className="icon-symbol" style={{ fontWeight: 'bold' }}>?</span>; // Novo ícone

const Header = ({
  selectedCoords,
  handleCoordinateChange,
  interfaceMode,
  toggleInterfaceMode,
  onHelpClick // 1. Recebendo a função de abrir o modal
}) => {
  return (
    <header className="main-header modern-header">
      <div className="logo">
        <img
          src="/odin_logo.png"
          alt="Logo ODIN"
          className="logo-image"
        />
        <h1 className="site-title">ODIN</h1>
      </div>

      <div className="location-inputs-header">
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
        {/* Mapa e Toggle Tela Cheia */}
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Mapa
        </NavLink>
        
        <button
          onClick={toggleInterfaceMode}
          className="nav-link interface-toggle-button"
          title={interfaceMode === 'sidebar' ? "Mudar para Tela Cheia" : "Mudar para Vista Padrão"}
        >
          {interfaceMode === 'sidebar' ? <FullscreenEnterIcon /> : <FullscreenExitIcon />}
        </button>

        {/* Links de Navegação */}
        <NavLink to="/data" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dados
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>

        {/* 2. Novo Botão de Ajuda */}
        <button 
          className="nav-link help-button" 
          onClick={onHelpClick}
          title="Ajuda / Tutorial"
          style={{ marginLeft: '10px', cursor: 'pointer' }} // Um pequeno ajuste inline para separar
        >
          <HelpIcon />
        </button>

      </nav>
    </header>
  );
};

export default Header;