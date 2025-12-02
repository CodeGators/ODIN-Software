// client/src/components/WtssOptionsModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getAttributesForCollection } from '../utils/wtssConfig';
import './WtssOptionsModal.css';

const WtssOptionsModal = ({ isOpen, onClose, collectionId, onConfirm }) => {
  const [selectedAttrs, setSelectedAttrs] = useState([]);
  
  // Carrega os atributos disponíveis baseados na coleção selecionada
  const availableAttributes = getAttributesForCollection(collectionId);

  // Resetar seleção quando muda a coleção ou abre o modal
  useEffect(() => {
    if (isOpen) {
      // Padrão: Selecionar NDVI e EVI se disponíveis, ou os 2 primeiros
      const defaults = availableAttributes
        .filter(a => ['NDVI', 'EVI'].includes(a.id))
        .map(a => a.id);
      
      setSelectedAttrs(defaults.length > 0 ? defaults : []);
    }
  }, [isOpen, collectionId]);

  const handleToggle = (attrId) => {
    setSelectedAttrs(prev => 
      prev.includes(attrId) 
        ? prev.filter(id => id !== attrId) 
        : [...prev, attrId]
    );
  };

  const handleConfirm = () => {
    if (selectedAttrs.length === 0) {
      alert("Selecione pelo menos um atributo.");
      return;
    }
    onConfirm(selectedAttrs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="wtss-config-container">
        <h3>Configurar Série Temporal</h3>
        <p className="wtss-subtitle">
          Coleção: <strong>{collectionId}</strong>
        </p>
        
        {availableAttributes.length === 0 ? (
          <div className="wtss-error">
            <p>⚠ Esta coleção não possui configuração mapeada para WTSS ou não é compatível.</p>
          </div>
        ) : (
          <>
            <div className="wtss-attributes-grid">
              {availableAttributes.map((attr) => (
                <label 
                  key={attr.id} 
                  className={`wtss-attr-card ${selectedAttrs.includes(attr.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAttrs.includes(attr.id)}
                    onChange={() => handleToggle(attr.id)}
                  />
                  <span>{attr.label}</span>
                </label>
              ))}
            </div>

            <div className="wtss-actions">
              <span className="selection-count">
                {selectedAttrs.length} atributos selecionados
              </span>
              <button className="wtss-confirm-btn" onClick={handleConfirm}>
                Gerar Gráfico
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WtssOptionsModal;