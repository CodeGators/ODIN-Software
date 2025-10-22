import React from 'react';

// Este componente contém o desenho (SVG) da lupa.
// A cor da borda ('stroke') já usa a variável de cor do seu tema.
const LoadingSpinner = () => (
  <div className="spinner-container">
    <svg className="lupa-spinner" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <g className="lupa-gfx" fill="none" fillRule="evenodd">
        <g transform="translate(2 1)" stroke="var(--cor-primaria)" strokeWidth="4">
          <circle cx="20" cy="20" r="16" />
          <path d="M32.929 32.929L43.354 43.354" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  </div>
);

export default LoadingSpinner;