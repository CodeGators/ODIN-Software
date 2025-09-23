import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css'; // Vamos criar este CSS

const Header = () => {
  return (
    <header className="main-header">
      <div className="logo">
        <i className="fa-regular fa-eye"></i>
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