import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

// 🎨 ÍCONES ULTRA MODERNOS COM EFEITOS
const FullscreenEnterIcon = () => (
  <span className="icon-symbol" title="Expandir para Tela Cheia">
    ⛶
  </span>
);

const FullscreenExitIcon = () => (
  <span className="icon-symbol" title="Sair da Tela Cheia">
    ⤢
  </span>
);

const HelpIcon = () => (
  <span className="icon-symbol" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
    ?
  </span>
);

const MapIcon = () => (
  <span style={{ marginRight: '6px', fontSize: '1.1rem' }}>🗺️</span>
);

const DataIcon = () => (
  <span style={{ marginRight: '6px', fontSize: '1.1rem' }}>📊</span>
);

const DashboardIcon = () => (
  <span style={{ marginRight: '6px', fontSize: '1.1rem' }}>📈</span>
);

// ✨ COMPONENTE HEADER ULTRA PREMIUM
const Header = ({
  selectedCoords,
  handleCoordinateChange,
  interfaceMode,
  toggleInterfaceMode,
  onHelpClick
}) => {
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [coordsValid, setCoordsValid] = useState({ lat: true, lng: true });

  // 📜 Detectar scroll para adicionar efeitos
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🎯 Validação de coordenadas em tempo real
  const validateCoordinate = (name, value) => {
    if (value === '' || value === '-') return true;
    
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    if (name === 'latitude') {
      return num >= -90 && num <= 90;
    } else {
      return num >= -180 && num <= 180;
    }
  };

  // 📍 Handler para mudanças de coordenadas com validação avançada
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validação visual
    const isValid = validateCoordinate(name, value);
    setCoordsValid(prev => ({
      ...prev,
      [name === 'latitude' ? 'lat' : 'lng']: isValid
    }));
    
    // Permite valores vazios, negativos e decimais
    if (value === '' || value === '-' || !isNaN(value)) {
      handleCoordinateChange(e);
    }
  };

  // 🎨 Handler para efeitos visuais ao focar
  const handleInputFocus = (e) => {
    e.target.select();
    e.target.parentElement.style.transform = 'scale(1.02)';
  };

  const handleInputBlur = (e) => {
    e.target.parentElement.style.transform = 'scale(1)';
  };

  // 🌟 Formatar coordenadas para exibição limpa
  const formatCoordinate = (coord) => {
    if (coord === null || coord === undefined || coord === '') return '';
    const num = Number(coord);
    return isNaN(num) ? '' : num.toFixed(6);
  };

  // 🎭 Determinar estilo do input baseado na validação
  const getInputStyle = (field) => {
    if (!coordsValid[field]) {
      return {
        borderColor: '#ff0080',
        boxShadow: '0 0 0 4px rgba(255, 0, 128, 0.2), 0 0 20px rgba(255, 0, 128, 0.4)'
      };
    }
    return {};
  };

  return (
    <header 
      className={`main-header modern-header ${isScrolled ? 'scrolled' : ''}`}
      role="banner"
    >
      {/* 🏆 LOGO E TÍTULO ESPETACULAR */}
      <div className="logo" role="img" aria-label="Logo ODIN">
        <img
          src="/odin_logo.png"
          alt="Logo ODIN - Sistema de Observação"
          className="logo-image"
        />
        <h1 className="site-title" aria-label="ODIN">ODIN</h1>
      </div>

      {/* 📍 INPUTS DE LOCALIZAÇÃO FUTURÍSTICOS */}
      <div className="location-inputs-header" role="group" aria-label="Coordenadas de localização">
        <div className="location-field-header">
          <label htmlFor="latitude">
            <span role="img" aria-label="Latitude">📍</span> Latitude
          </label>
          <input
            type="number"
            id="latitude"
            name="latitude"
            placeholder="-23.550520"
            step="any"
            value={selectedCoords?.lat ?? ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
            style={getInputStyle('lat')}
            aria-label="Latitude"
            aria-describedby="latitude-help"
          />
          {!coordsValid.lat && (
            <small 
              id="latitude-help" 
              style={{ 
                color: '#ff0080', 
                fontSize: '0.7rem', 
                marginTop: '4px',
                textShadow: '0 0 10px rgba(255, 0, 128, 0.5)'
              }}
            >
              Latitude deve estar entre -90 e 90
            </small>
          )}
        </div>
        
        <div className="location-field-header">
          <label htmlFor="longitude">
            <span role="img" aria-label="Longitude">🌐</span> Longitude
          </label>
          <input
            type="number"
            id="longitude"
            name="longitude"
            placeholder="-46.633308"
            step="any"
            value={selectedCoords?.lng ?? ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
            style={getInputStyle('lng')}
            aria-label="Longitude"
            aria-describedby="longitude-help"
          />
          {!coordsValid.lng && (
            <small 
              id="longitude-help"
              style={{ 
                color: '#ff0080', 
                fontSize: '0.7rem', 
                marginTop: '4px',
                textShadow: '0 0 10px rgba(255, 0, 128, 0.5)'
              }}
            >
              Longitude deve estar entre -180 e 180
            </small>
          )}
        </div>
      </div>

      {/* 🎨 NAVEGAÇÃO ESPACIAL */}
      <nav className="main-nav" role="navigation" aria-label="Navegação principal">
        
        {/* 🎯 Botão de Toggle Tela Cheia (MOVIDO PARA O INÍCIO) */}
        <button
          onClick={toggleInterfaceMode}
          className="nav-link interface-toggle-button"
          title={interfaceMode === 'sidebar' 
            ? "Expandir para Tela Cheia (F11)" 
            : "Retornar para Vista Padrão"}
          aria-label={interfaceMode === 'sidebar' 
            ? "Ativar modo Tela Cheia" 
            : "Desativar modo Tela Cheia"}
          aria-pressed={interfaceMode === 'fullscreen'}
        >
          {interfaceMode === 'sidebar' ? <FullscreenEnterIcon /> : <FullscreenExitIcon />}
        </button>
        
        {/* 🗺️ Link para o Mapa */}
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          title="Visualizar Mapa Interativo"
          aria-label="Ir para Mapa"
        >
          <MapIcon />
          Mapa
        </NavLink>
        
        {/* 📈 Link para Dashboard */}
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          title="Visualizar Dashboard e Métricas"
          aria-label="Ir para Dashboard"
        >
          <DashboardIcon />
          Dashboard
        </NavLink>

        {/* 🆘 Botão de Ajuda Premium */}
        <button 
          className="nav-link help-button" 
          onClick={onHelpClick}
          title="Abrir Guia de Ajuda e Tutorial"
          aria-label="Abrir Ajuda"
          aria-haspopup="dialog"
        >
          <HelpIcon />
        </button>
      </nav>
    </header>
  );
};

export default Header;