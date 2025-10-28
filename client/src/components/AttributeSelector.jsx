// src/components/AttributeSelector.jsx
import React from 'react';
// Importe o CSS se ele existir separado, senão os estilos do index.css devem pegar
import './AttributeSelector.css';

// Mapeamento de coleções para seus atributos WTSS disponíveis
// Certifique-se que os nomes dos atributos aqui correspondem EXATAMENTE aos da API WTSS
const attributesMap = {
  'S2-16D-2': ['NDVI', 'EVI', 'red', 'green', 'blue', 'nir', 'swir16', 'swir22'],
  'LANDSAT-16D-1': ['NDVI', 'EVI', 'red', 'green', 'blue', 'nir08', 'swir16', 'swir22'],
  'CBERS4-WFI-16D-2': ['NDVI', 'EVI', 'BAND13', 'BAND14', 'BAND15', 'BAND16'],
  'CBERS-WFI-8D-1': ['NDVI', 'EVI', 'BAND13', 'BAND14', 'BAND15', 'BAND16'],
  'CBERS4-MUX-2M-1': ['NDVI', 'EVI', 'BAND5', 'BAND6', 'BAND7', 'BAND8'],
  'mod13q1-6.1': ['NDVI', 'EVI', 'red_reflectance', 'NIR_reflectance'],
  'myd13q1-6.1': ['NDVI', 'EVI', 'red_reflectance', 'NIR_reflectance'],
  'mod11a2-6.1': ['LST_Day_1km', 'LST_Night_1km'],
  'myd11a2-6.1': ['LST_Day_1km', 'LST_Night_1km'],
  // Adicione outras coleções WTSS e seus atributos aqui se necessário
};

// --- NOVO: Exporta o mapa para poder ser usado no MapPage.jsx ---
export { attributesMap };

const AttributeSelector = ({
  selectedCollection, // ID da coleção WTSS selecionada (vem do FilterPanel)
  selectedAttributes, // Array com os atributos selecionados (vem do FilterPanel -> MapPage)
  setSelectedAttributes // Função para atualizar o array (vem do FilterPanel -> MapPage)
}) => {

  // Obtém os atributos disponíveis para a coleção selecionada ou um array vazio
  const availableAttributes = attributesMap[selectedCollection] || [];

  // Se não houver atributos para a coleção selecionada (ou nenhuma coleção), não renderiza nada
  // A lógica no MapPage/FilterPanel já deve esconder esta seção se primaryWtssCollection for null/undefined
  // Mas esta verificação garante que não tentemos renderizar uma lista vazia.
  if (availableAttributes.length === 0) {
     // Poderia opcionalmente retornar uma mensagem se selectedCollection existe mas não está no map
     // if (selectedCollection) {
     //    return <div className="filter-group attribute-selector-container"><label>Atributos WTSS</label><p>Nenhum atributo WTSS mapeado para {selectedCollection}.</p></div>;
     // }
     return null; // Não mostra nada se não houver atributos
  }

  const handleAttributeChange = (e) => {
    const { value, checked } = e.target;
    setSelectedAttributes(prev =>
      checked ? [...prev, value] : prev.filter(attr => attr !== value)
    );
  };

  return (
    // Usa a classe 'filter-group' do index.css para consistência
    <div className="filter-group attribute-selector-container">
      <label>Atributos WTSS</label> {/* Label padrão */}
      {/* Container estilizado para a lista */}
      <div className="attribute-list-box">
        <ul>
          {/* Mapeia os atributos disponíveis para a coleção atual */}
          {availableAttributes.map(attr => (
            <li key={attr}>
              <input
                type="checkbox"
                id={`attr-${attr}`} // ID único para o input
                value={attr}
                checked={selectedAttributes.includes(attr)}
                onChange={handleAttributeChange}
              />
              {/* Label associado ao input pelo htmlFor */}
              <label htmlFor={`attr-${attr}`}>{attr}</label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AttributeSelector;