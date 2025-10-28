// src/components/Modal.jsx
import React from 'react';
import './Modal.css'; // Importa o CSS que você já tem

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null; // Não renderiza nada se não estiver aberto
  }

  return (
    // Overlay (fundo escuro) que fecha o modal ao clicar fora
    <div className="modal-overlay" onClick={onClose}>
      {/* Conteúdo do modal (caixa branca) que NÃO fecha ao clicar dentro */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times; {/* Botão 'x' para fechar */}
        </button>
        {children} {/* Renderiza o conteúdo que for passado (no seu caso, o TimeseriesChart) */}
      </div>
    </div>
  );
};

export default Modal;