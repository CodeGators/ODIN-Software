import React from 'react';
import './WelcomeModal.css';

// Chave para o localStorage (agora só usada no App.jsx)
// const LOCAL_STORAGE_KEY = 'hasVisitedOdinTutorial'; 

// Este modal agora é "controlado". Ele recebe 'isOpen' e 'onClose' do "pai" (App.jsx)
const WelcomeModal = ({ isOpen, onClose }) => {

  // Se o "pai" diz que não está aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Renderiza o modal (o popup)
  return (
    // O 'handleClose' foi substituído por 'onClose'
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        
        <h2>Bem-vindo ao ODIN!</h2>
        <p>Este é um rápido tutorial sobre como usar as funcionalidades:</p>
        
        {/* Usando a sua lista personalizada (sem o <li> vazio) */}
        <ul className="tutorial-list">
          <li>🗺️ 📍 <strong>Mapa Interativo:</strong> Use o mapa para explorar as localizações. Você pode dar zoom e arrastar, além de visualiza as áreas de interesse. Um marcador o guirará no mapa.</li>
          <li>📊 <strong>Gráficos Dinâmicos:</strong> Os gráficos mostram dados em tempo real, referente as séries temporais selecionadas. Passe o mouse sobre eles para mais detalhes.</li>
          <li>🔄 <strong>Janelas Redimensionáveis:</strong> Você pode arrastar e redimensionar qualquer janela de widget para organizar seu layout.</li>
          <li>📄 <strong>Exportar:</strong> Use os botões de exportação (PDF/PNG) para salvar suas visualizações.</li>
          <li>➡️⬆️ <strong>Estilo:</strong> Utilize o filtro no canto superior para escolher um estilo que melhor o agrade visualmente.</li>
          <li>🔍 <strong>Filtros:</strong> Use os filtros para escolher o modo de busca, as coleções de satélites e as série temporal (Período de tempo que deseja, com inicio e fim) .</li>
        </ul>
        
        <button className="modal-finish-button" onClick={onClose}>
          Entendi, começar a usar!
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;