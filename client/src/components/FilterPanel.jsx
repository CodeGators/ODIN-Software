import React from 'react';
import LoadingSpinner from './LoadingSpiner'; // Pode ser necessário se o botão de busca mostrar loading

// Recebe todas as props necessárias do MapPage
const FilterPanel = ({
  collections, // Usado nos grupos lógicos e talvez na busca avançada se não for dividido
  startDate,
  endDate,
  selectedSatellites,
  isAdvancedSearch,
  simpleFilter,
  logicalGroups, // Necessário para o modo simples
  wtssCollections, // Para modo avançado
  nonWtssCollections, // Para modo avançado
  allWtssSelected, // Helper para modo avançado
  allNonWtssSelected, // Helper para modo avançado
  isLoading, // Para desabilitar botão
  
  // Funções handler
  handleSearch,
  setIsAdvancedSearch,
  setSimpleFilter,
  handleSatelliteChange, // Para modo avançado
  handleSelectAllWtss, // Para modo avançado
  handleSelectAllNonWtss, // Para modo avançado
  setStartDate,
  setEndDate,
}) => {

  return (
    <form className="filter-form" onSubmit={handleSearch}>
      {/* Seletor de Modo de Busca */}
      <div className="filter-group">
        <label>Modo de Busca</label>
        <div className="search-mode-toggle">
          <button
            type="button"
            className={!isAdvancedSearch ? 'active' : ''}
            onClick={() => setIsAdvancedSearch(false)}
          >
            Busca por Coleção
          </button>
          <button
            type="button"
            className={isAdvancedSearch ? 'active' : ''}
            onClick={() => setIsAdvancedSearch(true)}
          >
            Busca Avançada
          </button>
        </div>
      </div>

      {/* Modo Simples ou Avançado */}
      {!isAdvancedSearch ? (
        <div className="filter-group">
          <label>Coleções de Satélites</label>
          <select
            className="simple-filter-select"
            value={simpleFilter}
            onChange={(e) => setSimpleFilter(e.target.value)}
          >
            {Object.entries(logicalGroups)
              .filter(([key, group]) => {
                if (key === 'all' || key === 'wtss') return true;
                // Certifica que getIds existe e retorna um array antes de checar length
                return typeof group.getIds === 'function' && Array.isArray(group.getIds()) && group.getIds().length > 0;
              })
              .map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
          </select>
        </div>
      ) : (
        <div className="advanced-search-container">
          {/* Lista WTSS */}
          <div className="filter-group">
            <label style={{ marginBottom: '5px' }}>
              Satélites WTSS ({wtssCollections.length})
            </label>
            <div className="dropdown-list open">
              <ul>
                <li>
                  <input
                    type="checkbox"
                    id="select-all-wtss"
                    checked={allWtssSelected}
                    onChange={handleSelectAllWtss}
                  />
                  <label htmlFor="select-all-wtss">
                    <strong>Selecionar Todos WTSS</strong>
                  </label>
                </li>
                {wtssCollections.map(col => (
                  <li key={col.id}>
                    <input
                      type="checkbox"
                      id={`filter-${col.id}`} // Adiciona prefixo para evitar IDs duplicados
                      value={col.id}
                      checked={selectedSatellites.includes(col.id)}
                      onChange={handleSatelliteChange}
                    />
                    <label htmlFor={`filter-${col.id}`}>
                      {col.title}
                      <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                        {' '}(WTSS)
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Lista Não-WTSS */}
          <div className="filter-group">
            <label style={{ marginBottom: '5px' }}>
              Outros Satélites ({nonWtssCollections.length})
            </label>
            <div className="dropdown-list open">
              <ul>
                <li>
                  <input
                    type="checkbox"
                    id="select-all-non-wtss"
                    checked={allNonWtssSelected}
                    onChange={handleSelectAllNonWtss}
                  />
                  <label htmlFor="select-all-non-wtss">
                    <strong>Selecionar Todos (Outros)</strong>
                  </label>
                </li>
                {nonWtssCollections.map(col => (
                  <li key={col.id}>
                    <input
                      type="checkbox"
                      id={`filter-${col.id}`} // Adiciona prefixo
                      value={col.id}
                      checked={selectedSatellites.includes(col.id)}
                      onChange={handleSatelliteChange}
                    />
                    <label htmlFor={`filter-${col.id}`}>{col.title}</label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Datas */}
      <div className="date-inputs">
        <div className="date-field">
          <label>Data de Início</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="date-field">
          <label>Data de Fim</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      {/* Botão Buscar */}
      <button
        type="submit"
        className="search-button"
        disabled={isLoading}
      >
        {isLoading ? 'Buscando...' : 'Buscar Dados'}
      </button>
    </form>
  );
};

export default FilterPanel;