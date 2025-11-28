import React, { useState } from 'react';
import './WelcomeModal.css';

// --- Componente Auxiliar para Desenvolvedores (Mantido) ---
const DeveloperList = ({ role, name, github, portfolio, style }) => (
    <div style={{ marginBottom: '10px', paddingLeft: '10px', ...style }}>
        <p style={{ margin: '3px 0', fontWeight: 'bold' }}>
            {/* Aplica cor diferente para destaque da Função */}
            {role && <span style={{ marginRight: '5px', color: '#FF9800' }}>[{role}]</span>} 
            {name}
        </p>
        <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', marginTop: '5px' }}>
            {/* Link GitHub com 📌 */}
            <a 
                href={github} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#0366d6', textDecoration: 'none' }}
            >
                <span role="img" aria-label="GitHub Pin">📌</span> GitHub
            </a>
            {/* Link Portfólio com 🔗 */}
            <a 
                href={portfolio} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#00838F', textDecoration: 'none' }}
            >
                🔗 Portfólio
            </a>
        </div>
    </div>
);


const WelcomeModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('bem-vindo');

    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'bem-vindo':
                return (
                    <div className="tab-content fade-in">
                        <h2>Bem-vindo ao ODIN</h2>
                        <p className="intro-text">
                            O <strong>ODIN</strong> (Observatório de Dados e Imagens da Natureza) é a sua plataforma avançada para exploração e análise de dados de observação da terra.
                        </p>
                        
                        <div className="feature-cards">
                            <div className="card">
                                <div className="icon">🌍</div>
                                <h3>Exploração Visual</h3>
                                <p>Navegue por mapas interativos e visualize imagens de satélite de diversas fontes.</p>
                            </div>
                            <div className="card">
                                <div className="icon">📈</div>
                                <h3>Análise Temporal</h3>
                                <p>Gere gráficos de séries temporais (NDVI, EVI) para monitorar a vegetação ao longo dos anos.</p>
                            </div>
                            <div className="card">
                                <div className="icon">🛰️</div>
                                <h3>Multi-Satélite</h3>
                                <p>Acesso integrado a dados do Landsat, Sentinel, CBERS e Amazonia-1.</p>
                            </div>
                        </div>
                        
                        <div className="action-area">
                            <p>Selecione um tópico no menu ao lado para aprender mais.</p>
                            <button className="btn-primary" onClick={() => setActiveTab('funcionalidades')}>
                                Conhecer Funcionalidades
                            </button>
                        </div>
                    </div>
                );

            case 'funcionalidades':
                return (
                    <div className="tab-content fade-in">
                        <h2>Funcionalidades Principais</h2>

                        <section className="concept-section">
                            <h3>⛶ Modo Tela Cheia (Fullscreen)</h3>
                            <p>
                                Para uma imersão total, clique no botão <span className="icon-inline">⛶</span> no cabeçalho. 
                            </p>
                            <ul className="concept-list">
                                <li><strong>O que acontece:</strong> As barras laterais e menus do navegador são ocultados, maximizando a área do mapa.</li>
                                <li><strong>Ideal para:</strong> Apresentações, visualização de grandes áreas ou quando você precisa de mais espaço para arrastar as janelas de gráficos.</li>
                                <li><strong>Como sair:</strong> Pressione <code>Esc</code> ou clique novamente no botão <span className="icon-inline">⤢</span>.</li>
                            </ul>
                        </section>

                        <hr className="divider"/>

                        <section className="concept-section">
                            <h3>🔍 Modos de Busca</h3>
                            <div className="comparison-box">
                                <div>
                                    <h4>Busca por Coleção (Padrão)</h4>
                                    <p>Ideal para pesquisas rápidas. Você seleciona <strong>um grupo lógico</strong> (ex: "Apenas Satélites Sentinel-2") e o sistema busca todos os dados relacionados.</p>
                                </div>
                                <div className="separator">vs</div>
                                <div>
                                    <h4>Busca Avançada</h4>
                                    <p>Para usuários experientes. Permite selecionar <strong>múltiplas coleções específicas</strong> individualmente (ex: misturar <em>CBERS-4</em> com <em>Landsat-8</em> na mesma busca) através de caixas de seleção.</p>
                                </div>
                            </div>
                        </section>

                        <hr className="divider"/>

                        <section className="concept-section">
                            <h3>📊 Dashboard & Relatórios</h3>
                            <p>
                                A página de Dashboard centraliza todas as séries temporais que você gerou durante sua sessão.
                            </p>
                            <ul className="concept-list">
                                <li><strong>Interatividade:</strong> Passe o mouse sobre os pontos dos gráficos para ver os valores exatos e as datas.</li>
                                <li><strong>Exportação PDF:</strong> Selecione os gráficos mais relevantes e gere um relatório PDF profissional pronto para impressão.</li>
                                <li><strong>Comparação:</strong> Visualize dados de diferentes locais ou satélites lado a lado.</li>
                            </ul>
                        </section>

                        <hr className="divider"/>

                        <section className="concept-section warning-box">
                            <h3>⚠️ Sobre as Thumbnails (Visualização)</h3>
                            <p>
                                Ao clicar em um resultado, uma imagem ("Overlay") é projetada sobre o mapa.
                            </p>
                            <p><strong>Importante:</strong> Estas imagens são <em>prévias rápidas (Thumbnails)</em> geradas pelos provedores.</p>
                            <ul>
                                <li>Elas <strong>não possuem precisão geográfica absoluta</strong> e podem apresentar leves deslocamentos em relação ao mapa base.</li>
                                <li>Elas têm <strong>resolução reduzida</strong> para carregamento rápido.</li>
                                <li>Para análises científicas rigorosas, utilize os botões de "Baixar JSON" ou acesse os dados brutos via link original.</li>
                            </ul>
                        </section>
                    </div>
                );

            case 'conceitos':
                return (
                    <div className="tab-content fade-in">
                        <h2>Conceitos Fundamentais</h2>
                        
                        <section className="concept-section">
                            <h3>📡 O que é STAC?</h3>
                            <p className="subtitle">SpatioTemporal Asset Catalog</p>
                            <p>
                                O <strong>STAC</strong> é como um "índice de biblioteca" gigante para imagens de satélite. 
                                Em vez de baixar terabytes de dados para procurar uma imagem, o ODIN usa o STAC para perguntar: 
                                <em>"Quais imagens existem nesta localização (Latitude/Longitude) e nesta data?"</em>.
                            </p>
                            <ul className="concept-list">
                                <li>Padroniza a busca de imagens de diferentes fornecedores (INPE, USGS, ESA).</li>
                                <li>Permite encontrar rapidamente metadados (cobertura de nuvens, data, satélite).</li>
                            </ul>
                        </section>

                        <hr className="divider"/>

                        <section className="concept-section">
                            <h3>📉 O que é WTSS?</h3>
                            <p className="subtitle">Web Time Series Service</p>
                            <p>
                                O <strong>WTSS</strong> extrai a "história" de um único ponto no mapa.
                                Imagine furar uma pilha de 1000 imagens de satélite no mesmo local e extrair o valor do pixel em cada data.
                            </p>
                            <p>Isso permite criar gráficos de índices como <strong>NDVI</strong> (Vegetação) e <strong>EVI</strong>.</p>
                        </section>
                    </div>
                );

            case 'tutoriais':
                return (
                    <div className="tab-content fade-in">
                        <h2>Fluxo de Trabalho Básico</h2>
                        
                        <div className="tutorial-step">
                            <div className="step-number">1</div>
                            <div className="step-info">
                                <h3>Busca e Filtros</h3>
                                <p>
                                    Vá ao <strong>Mapa</strong>. Defina o intervalo de datas (Início/Fim) e escolha o satélite. 
                                    Clique no mapa para marcar o ponto (Pin) ou digite as coordenadas no cabeçalho. Clique em "Buscar Dados".
                                </p>
                            </div>
                        </div>

                        <div className="tutorial-step">
                            <div className="step-number">2</div>
                            <div className="step-info">
                                <h3>Resultados e Overlay</h3>
                                <p>
                                    Os resultados aparecem na lista lateral. Clique em um item para ver a <strong>Thumbnail</strong> projetada no mapa e checar a cobertura de nuvens.
                                </p>
                            </div>
                        </div>

                        <div className="tutorial-step">
                            <div className="step-number">3</div>
                            <div className="step-info">
                                <h3>Análise WTSS</h3>
                                <p>
                                    Se o item for compatível, um botão <strong>WTSS</strong> aparecerá. Clique nele para gerar o gráfico de série temporal em uma janela flutuante.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'sobre':
                return (
                    <div className="tab-content fade-in">
                        <h2>Sobre o Projeto</h2>
                        <p>
                            O <strong>ODIN</strong> foi desenvolvido para facilitar o acesso aos dados abertos do INPE e outras agências espaciais.
                        </p>
                        <ul className="tech-list">
                            <li><strong>Front-end:</strong> React, Vite, Leaflet, Chart.js</li>
                            <li><strong>Dados:</strong> API STAC (INPE), API WTSS (INPE)</li>
                        </ul>
                        
                        {/* Bloco CodeGators Original */}
                        <div className="credits" style={{ marginBottom: '20px' }}>
                            <p style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                <a 
                                    href="https://github.com/CodeGators" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
                                >
                                    <img 
                                        src="/images/codegators.png" // <-- Caminho corrigido para public/images
                                        alt="Logo CodeGators - Crocodilo"
                                        style={{ 
                                            width: '150px', 
                                            height: 'auto', 
                                            marginRight: '8px',
                                            transform: 'scaleX(-1)'
                                        }}
                                    />
                                    Desenvolvido por CodeGators
                                </a> 
                                &copy; {new Date().getFullYear()}
                            </p>
                        </div>
                        
                        {/* --- NOVA SEÇÃO DE DESENVOLVEDORES --- */}
                        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '15px', color: '#006064' }}>Desenvolvedores do Projeto</h3>

                            {/* Lideranças: Scrum Master e Product Owner LADO A LADO */}
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                <DeveloperList 
                                    role="Scrum Master" 
                                    name="Gustavo Silva" 
                                    github="https://github.com/GustavoReis-xml" 
                                    portfolio="https://fatec-jacarei-dsm-portfolio.github.io/ra2581392423001/" 
                                    style={{ flex: '1 1 45%' }}
                                />
                                
                                <DeveloperList 
                                    role="Product Owner" 
                                    name="Anderson Fontes" 
                                    github="https://github.com/Anderson-Fontes" 
                                    portfolio="https://fatec-jacarei-dsm-portfolio.github.io/ra2581392423014/" 
                                    style={{ flex: '1 1 45%' }}
                                />
                            </div>

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#00838F' }}>Desenvolvedores:</h4>
                            
                            {/* Desenvolvedores: Três lado a lado (Dividindo em 3) */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <DeveloperList 
                                    name="Arthur Souza" 
                                    github="https://github.com/ArthurAugusto10" 
                                    portfolio="https://fatec-jacarei-dsm-portfolio.github.io/ra2581392423010/" 
                                    style={{ flex: '1 1 30%' }}
                                />

                                <DeveloperList 
                                    name="Rafael Shinji" 
                                    github="https://github.com/RafaelShinjiTomokame" 
                                    portfolio="https://fatec-jacarei-dsm-portfolio.github.io/ra2581392423029/" 
                                    style={{ flex: '1 1 30%' }}
                                />

                                <DeveloperList 
                                    name="Stefan Souza" 
                                    github="https://github.com/Stefan0212" 
                                    portfolio="https://fatec-jacarei-dsm-portfolio.github.io/ra2581392423024/" 
                                    style={{ flex: '1 1 30%' }}
                                />
                            </div>
                        </div>
                        {/* --- FIM DA NOVA SEÇÃO --- */}

                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="help-modal-overlay" onClick={onClose}>
            <div className="help-modal-container" onClick={(e) => e.stopPropagation()}>
                
                {/* Sidebar de Navegação */}
                <aside className="help-sidebar">
                    <div className="sidebar-header">
                        <span className="logo-icon">👁️</span>
                        <h3>Central de Ajuda</h3>
                    </div>
                    
                    <nav className="help-nav">
                        <button 
                            className={activeTab === 'bem-vindo' ? 'active' : ''} 
                            onClick={() => setActiveTab('bem-vindo')}
                        >
                            🏠 Início
                        </button>
                        <button 
                            className={activeTab === 'funcionalidades' ? 'active' : ''} 
                            onClick={() => setActiveTab('funcionalidades')}
                        >
                            🛠️ Funcionalidades
                        </button>
                        <button 
                            className={activeTab === 'conceitos' ? 'active' : ''} 
                            onClick={() => setActiveTab('conceitos')}
                        >
                            📚 Conceitos (STAC/WTSS)
                        </button>
                        <button 
                            className={activeTab === 'tutoriais' ? 'active' : ''} 
                            onClick={() => setActiveTab('tutoriais')}
                        >
                            🎓 Tutoriais
                        </button>
                        <button 
                            className={activeTab === 'sobre' ? 'active' : ''} 
                            onClick={() => setActiveTab('sobre')}
                        >
                            ℹ️ Sobre
                        </button>
                    </nav>

                    <div className="sidebar-footer">
                        <button className="close-btn-sidebar" onClick={onClose}>
                            Fechar Ajuda
                        </button>
                    </div>
                </aside>

                {/* Área de Conteúdo */}
                <main className="help-content-area">
                    <button className="close-btn-absolute" onClick={onClose}>&times;</button>
                    {renderContent()}
                </main>

            </div>
        </div>
    );
};

export default WelcomeModal;