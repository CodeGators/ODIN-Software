import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

//RECEBEMOS AS PROPS VINDAS DO APP.JSX
const Header = ({ selectedCoords, handleCoordinateChange }) => {
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

      {/*ADICIONAMOS OS CAMPOS DE INPUT DE LOCALIZAÇÃO AQUI */}
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
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Mapa
        </NavLink>
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