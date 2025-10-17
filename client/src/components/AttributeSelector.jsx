import React from 'react';

// Mapeamento de coleções para seus atributos WTSS disponíveis
const attributesMap = {
  'S2-16D-2': ['NDVI', 'EVI', 'red', 'green', 'blue', 'nir', 'swir16', 'swir22'],
  'LANDSAT-16D-1': ['NDVI', 'EVI', 'red', 'green', 'blue', 'nir08', 'swir16', 'swir22'],
  'CBERS4-WFI-16D-2': ['NDVI', 'EVI', 'BAND13', 'BAND14', 'BAND15', 'BAND16'],
  'CBERS-WFI-8D-1': ['NDVI', 'EVI', 'BAND13', 'BAND14', 'BAND15', 'BAND16'],
  'mod13q1-6.1': ['NDVI', 'EVI', 'red_reflectance', 'NIR_reflectance'],
  'myd13q1-6.1': ['NDVI', 'EVI', 'red_reflectance', 'NIR_reflectance'],
  // Coleções de temperatura
  'mod11a2-6.1': ['LST_Day_1km', 'LST_Night_1km'],
  'myd11a2-6.1': ['LST_Day_1km', 'LST_Night_1km'],
  // Adicione outras coleções e atributos aqui, se necessário
};

const AttributeSelector = ({ selectedCollection, selectedAttributes, setSelectedAttributes }) => {
  // Encontra os atributos disponíveis para a coleção selecionada
  const availableAttributes = attributesMap[selectedCollection] || [];

  if (availableAttributes.length === 0) {
    return null; // Não mostra nada se a coleção não tiver atributos mapeados
  }

  const handleAttributeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedAttributes(prev => [...prev, value]);
    } else {
      setSelectedAttributes(prev => prev.filter(attr => attr !== value));
    }
  };

  return (
    <div className="attribute-selector">
      <label>Atributos WTSS</label>
      <div className="attribute-list">
        {availableAttributes.map(attr => (
          <div key={attr} className="attribute-item">
            <input
              type="checkbox"
              id={`attr-${attr}`}
              value={attr}
              checked={selectedAttributes.includes(attr)}
              onChange={handleAttributeChange}
            />
            <label htmlFor={`attr-${attr}`}>{attr}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttributeSelector;