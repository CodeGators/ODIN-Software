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
          <li>🗺️ 📍 <strong>Mapa Interativo:</strong> Explore localizações com zoom e arraste. Um marcador guia o levará às áreas de interesse no mapa.</li>
          <li>📊 <strong>Gráficos Dinâmicos:</strong> Visualize dados de séries temporais em tempo real. Passe o mouse sobre os gráficos para obter detalhes e valores específicos.</li>
          <li>🔄 <strong>Janelas Redimensionáveis:</strong> Personalize seu layout arrastando e redimensionando qualquer janela de widget para a organização que desejar.</li>
          <li>📄 <strong>Exportar Visualizações:</strong> Use os botões de exportação (PDF) para salvar e compartilhar suas análises e visualizações.</li>
          <li>➡️⬆️ <strong>Estilo de Visualização:</strong> Utilize o filtro no canto superior direito na pagina do mapa para selecionar o estilo visual que mais lhe agrada.</li>
          <li>🔍 <strong>Filtros Avançados:</strong> Defina o modo de busca, escolha as coleções de satélites e especifique a série temporal (período de tempo de início e fim) para sua análise.</li>
        </ul>
        
        <button className="modal-finish-button" onClick={onClose}>
          Entendi, começar a usar!
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;