// src/components/SelectedItemPopup.jsx
import React from 'react';
import { Rnd } from "react-rnd";
import './SelectedItemPopup.css';

// --- CORREÇÃO 1: Adicione "bounds" aqui para receber a prop ---
const SelectedItemPopup = ({ details, imageUrl, onClose, bounds }) => {
  if (!details) return null;

  const title = details.properties?.title || details.id || "Detalhes do Item";
  const collectionName = details.collection || "N/A";
  const date = details.properties?.datetime
    ? new Date(details.properties.datetime).toLocaleDateString()
    : "N/A";
  const cloudCover = details.properties?.['eo:cloud_cover']?.toFixed(2) ?? 'N/A';

  return (
    <Rnd
      default={{
        x: 20, // Posição X: Próximo à borda esquerda
        y: window.innerHeight - 450, // Posição Y: Mais para cima (ajuste 450)
        width: 350, // Largura inicial
        height: "auto", // Altura automática inicial
      }}
      minWidth={250}
      minHeight={200}

      // --- CORREÇÃO 2: Use a prop "bounds" que veio do MapPage ---
      // (O MapPage está enviando "parent" para esta prop)
      bounds={bounds} 
      
      dragHandleClassName="popup-header"
      className="popup-window"
      enableResizing={{
        top: false, right: true, bottom: true, left: false,
        topRight: false, bottomRight: true, bottomLeft: false, topLeft: false
      }}
      style={{ zIndex: 1000 }} // Garante que fique acima do mapa
    >
      <div className="popup-header">
        <span className="popup-title" title={title}>
          {title.length > 40 ? `${title.substring(0, 37)}...` : title}
        </span>
        <button className="popup-close-button" onClick={onClose} title="Fechar">
          &times;
        </button>
      </div>

      <div className="popup-content">
        {imageUrl && (
          <img src={imageUrl} alt="Thumbnail" className="popup-thumbnail" />
        )}
        <div className="popup-metadata">
          <p><strong>Coleção:</strong> {collectionName}</p>
          <p><strong>Data:</strong> {date}</p>
          <p><strong>Nuvens:</strong> {cloudCover}%</p>
        </div>
      </div>
    </Rnd>
  );
};

export default SelectedItemPopup;