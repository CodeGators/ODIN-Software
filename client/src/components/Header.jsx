import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css'; // Vamos modificar este arquivo

// Ícones (mantidos como texto)
const FullscreenEnterIcon = () => <span className="icon-symbol">&#x26F6;</span>;
const FullscreenExitIcon = () => <span className="icon-symbol">&#x2922;</span>;

const Header = ({
  selectedCoords,
  handleCoordinateChange,
  interfaceMode,
  toggleInterfaceMode
}) => {
  return (
    // Adicionamos uma classe 'modern-header' para aplicar os novos estilos
    <header className="main-header modern-header">
      <div className="logo">
        <img
          src="/odin_logo.png" // Certifique-se que o caminho está correto na pasta public
          alt="Logo ODIN"
          className="logo-image"
        />
        {/* Adicionamos a classe 'site-title' para o gradiente */}
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
        {/* Mapa e Botão de Tela Cheia JUNTOS */}
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Mapa
        </NavLink>
        <button
          onClick={toggleInterfaceMode}
          className="nav-link interface-toggle-button" // Reutiliza nav-link para estilo base
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