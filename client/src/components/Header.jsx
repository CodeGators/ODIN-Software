import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="main-header">
      <div className="logo">
        {/* CORRIGIDO: O nome do arquivo foi atualizado para odin_logo.png */}
        <img 
          src="/odin_logo.png" 
          alt="Logo ODIN" 
          className="logo-image" 
        />
        <h1>ODIN</h1>
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