/* --- CONFIGURAÇÕES GERAIS E PALETA DARK PUB --- */
:root {
    --bg-main: #121214;
    --bg-card: #1a1a1e;
    --bg-input: #26262b;
    --border-color: #323238;
    --text-main: #e1e1e6;
    --text-muted: #a4a4ac;
    --primary: #4e59ff;
    --primary-hover: #3b44d1;
    --accent: #ff9f1c;
    --accent-hover: #f39c12;
    --success: #00b37e;
    --success-hover: #00875f;
    --danger: #f75a68;
    --danger-hover: #cc4350;
    --gold: #fdca40;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Poppins', sans-serif;
}

body {
    background-color: var(--bg-main);
    color: var(--text-main);
    padding: 20px;
    font-size: 14px;
}

.app-container {
    max-width: 1400px;
    margin: 0 auto;
}

/* --- CABEÇALHO --- */
#cabecalho-estabelecimento {
    background: linear-gradient(135deg, #1f1c2c, #3a1c41);
    border: 1px solid var(--border-color);
    padding: 20px 30px;
    margin-bottom: 25px;
    border-radius: 12px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.logo-area {
    display: flex;
    align-items: center;
    gap: 15px;
}

.icon-beer {
    font-size: 2.5rem;
}

#nome-estabelecimento {
    color: var(--gold);
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

#contatos-estabelecimento {
    margin-left: auto;
    text-align: right;
}

#contatos-estabelecimento p {
    color: var(--text-muted);
}

#contatos-estabelecimento strong {
    color: var(--accent);
}

/* --- MENU HAMBÚRGUER --- */
.menu-toggle {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border-color);
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
}

.menu-toggle span {
    display: block;
    width: 22px;
    height: 2px;
    background-color: var(--gold);
    border-radius: 2px;
    transition: all 0.2s ease;
}

.menu-toggle:hover {
    background: rgba(255,255,255,0.1);
    border-color: var(--accent);
}

/* --- DRAWER LATERAL --- */
.drawer-menu {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 300px;
    max-width: 85vw;
    background-color: var(--bg-card);
    border-right: 1px solid var(--border-color);
    box-shadow: 4px 0 20px rgba(0,0,0,0.5);
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    display: flex;
    flex-direction: column;
}

.drawer-menu.open {
    transform: translateX(0);
}

.drawer-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 25px 20px;
    border-bottom: 1px solid var(--border-color);
    background: linear-gradient(135deg, #1f1c2c, #3a1c41);
}

.drawer-header h2 {
    color: var(--gold);
    font-size: 1.25rem;
    font-weight: 700;
}

.drawer-links {
    list-style: none;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.drawer-link {
    width: 100%;
    text-align: left;
    background: transparent;
    color: var(--text-main);
    padding: 14px 16px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    border-left: 3px solid transparent;
}

.drawer-link:hover {
    background-color: rgba(255,255,255,0.06);
}

.drawer-link.active {
    background-color: rgba(78, 89, 255, 0.18);
    color: #9aa1ff;
    border-left: 3px solid var(--primary);
}

.drawer-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0,0,0,0.6);
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
}

.drawer-overlay.open {
    opacity: 1;
    pointer-events: auto;
}

/* --- CONTROLE DE VIEWS (PÁGINAS) --- */
.view {
    display: none;
}

.view.active {
    display: block;
}

.single-column {
    display: flex;
    flex-direction: column;
    gap: 25px;
    max-width: 1000px;
    margin: 0 auto;
}

/* --- GRID LAYOUT (VENDAS) --- */
.main-layout {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 25px;
}

@media (max-width: 1024px) {
    .main-layout {
        grid-template-columns: 1fr;
    }
}

/* --- COMPONENTES DOS CARDS --- */
.card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 25px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.card.principal {
    border-left: 4px solid var(--accent);
}

.card h2 {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 20px;
    color: #fff;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}

.card h3 {
    font-size: 1.05rem;
    font-weight: 500;
    margin: 20px 0 10px 0;
    color: var(--text-muted);
}

/* --- FORMULÁRIOS, INPUTS E SELETORES --- */
.input-group, .adicionar-produto-zone {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 15px;
}

input[type="text"], 
input[type="number"], 
textarea, 
select {
    width: 100%;
    background-color: var(--bg-input);
    border: 1px solid var(--border-color);
    color: #fff;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(255, 159, 28, 0.2);
}

.select-wrapper {
    position: relative;
    width: 100%;
}

textarea {
    resize: vertical;
}

/* --- FORMULÁRIO EM GRID (CADASTRO / ESTOQUE) --- */
.form-grid-cadastro {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

@media (max-width: 600px) {
    .form-grid-cadastro {
        grid-template-columns: 1fr;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 15px;
}

.form-grid-cadastro .form-group {
    margin-bottom: 0;
}

.form-group label {
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 500;
}

.hint {
    color: var(--text-muted);
    font-size: 0.75rem;
    display: block;
    margin-top: 2px;
}

/* --- BOTÕES --- */
button {
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s, transform 0.1s;
    font-size: 0.95rem;
}

button:active {
    transform: scale(0.98);
}

.btn-primary { background-color: var(--primary); color: white; width: 100%; }
.btn-primary:hover { background-color: var(--primary-hover); }

.btn-accent { background-color: var(--accent); color: #121214; }
.btn-accent:hover { background-color: var(--accent-hover); }

.btn-success { background-color: var(--success); color: white; width: 100%; }
.btn-success:hover { background-color: var(--success-hover); }

.btn-remover {
    padding: 5px 10px;
    background-color: rgba(247, 90, 104, 0.1);
    color: var(--danger);
    border: 1px solid rgba(247, 90, 104, 0.2);
    border-radius: 4px;
    font-size: 0.8rem;
}
.btn-remover:hover {
    background-color: var(--danger);
    color: white;
}

/* --- LISTAS CUSTOMIZADAS --- */
.custom-list {
    list-style: none;
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: rgba(0,0,0,0.1);
}

.custom-list li {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.custom-list li:last-child {
    border-bottom: none;
}

/* --- GRID DE MESAS (QUADRADOS) --- */
.mesas-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-height: 320px;
    border: none;
    background-color: transparent;
    padding: 4px;
}

.mesas-list li {
    position: relative;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    padding: 8px;
    background-color: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mesas-list li:hover {
    background-color: rgba(78, 89, 255, 0.15);
    border-color: var(--primary);
    transform: translateY(-2px);
}

.mesas-list li:active {
    transform: scale(0.96);
}

.mesas-list li.mesa-aberta {
    border-color: var(--accent);
    background-color: rgba(255, 159, 28, 0.08);
}

.mesas-list li .mesa-nome {
    font-weight: 600;
    color: #fff;
    font-size: 0.9rem;
    line-height: 1.2;
    word-break: break-word;
}

.mesas-list li .mesa-status {
    font-size: 0.68rem;
    color: var(--text-muted);
}

.mesas-list li .btn-remover-mesa {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    padding: 0;
    border-radius: 50%;
    background-color: rgba(247, 90, 104, 0.15);
    color: var(--danger);
    border: none;
    font-size: 0.65rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.mesas-list li:hover .btn-remover-mesa {
    opacity: 1;
}

.mesas-list li.mesa-vazia {
    grid-column: 1 / -1;
    aspect-ratio: auto;
    cursor: default;
    color: var(--text-muted);
    background-color: transparent;
    border-style: dashed;
}

.mesas-list li.mesa-vazia:hover {
    transform: none;
    border-color: var(--border-color);
    background-color: transparent;
}

.mesas-list li:last-child {
    border-bottom: 1px solid var(--border-color);
}

@media (max-width: 480px) {
    .mesas-list {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* --- PAINEL DE CONTROLE DE VENDAS --- */
.status-badge {
    background-color: rgba(78, 89, 255, 0.15);
    color: #9aa1ff;
    padding: 12px;
    border-radius: 6px;
    font-weight: 600;
    margin-bottom: 20px;
    border: 1px solid rgba(78, 89, 255, 0.3);
    text-align: center;
}

.adicionar-produto-zone {
    display: grid;
    grid-template-columns: 1fr 100px auto;
    gap: 15px;
    margin-top: 20px;
}

/* --- TABELAS --- */
.table-responsive {
    overflow-x: auto;
    margin: 15px 0;
}

table {
    width: 100%;
    border-collapse: collapse;
    background-color: rgba(0,0,0,0.1);
    border-radius: 8px;
    overflow: hidden;
}

th, td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

th {
    background-color: #202024;
    color: var(--text-muted);
    font-weight: 500;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

td {
    color: #fff;
}

/* --- ZONA DE CHECKOUT DO PEDIDO --- */
.checkout-box {
    background-color: #202024;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;
    margin-top: 25px;
}

.subtotal-row, .total-row, .pagamento-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.subtotal-row span:first-child { color: var(--text-muted); }
#subtotal-bruto { font-size: 1.15rem; color: #fff; font-weight: 500;}

.taxas-info {
    border-top: 1px dashed var(--border-color);
    border-bottom: 1px dashed var(--border-color);
    padding: 12px 0;
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    color: var(--text-muted);
    font-size: 0.9rem;
}

#taxa-aplicada { color: var(--danger); font-weight: 500; }
#valor-taxa { color: var(--text-main); }

.total-row {
    margin-top: 5px;
    margin-bottom: 25px;
}
.total-row span:first-child { font-size: 1.3rem; font-weight: 600; color: #fff; }
#total-final { font-size: 1.8rem; font-weight: 700; color: var(--gold); }

.btn-checkout {
    background: linear-gradient(90deg, #00b37e, #029469);
    color: white;
    width: 100%;
    padding: 16px;
    font-size: 1.1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 179, 126, 0.3);
}
.btn-checkout:hover { background: var(--success-hover); }

/* --- HISTÓRICO --- */
.historico-list {
    list-style: none;
    max-height: 400px;
    overflow-y: auto;
}

.historico-list li {
    background-color: rgba(0,0,0,0.15);
    border: 1px solid var(--border-color);
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 12px;
    line-height: 1.6;
}

/* --- PREVIEW DE LUCRO (ESTOQUE) --- */
.estoque-preview {
    background-color: #202024;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 20px;
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
}

.preview-grid div {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.preview-grid span {
    color: var(--text-muted);
    font-size: 0.78rem;
}

.preview-grid strong {
    font-size: 1.1rem;
    color: #fff;
}

@media (max-width: 700px) {
    .preview-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* --- CARDS DE RESUMO (RELATÓRIO) --- */
.resumo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 12px;
}

.resumo-card {
    background-color: #202024;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.resumo-card span {
    color: var(--text-muted);
    font-size: 0.85rem;
}

.resumo-card strong {
    font-size: 1.5rem;
}

.resumo-card small {
    color: var(--text-muted);
    font-size: 0.75rem;
}

@media (max-width: 900px) {
    .resumo-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 500px) {
    .resumo-grid { grid-template-columns: 1fr; }
}

/* --- TOAST SYSTEM (SISTEMA DE AVISOS) --- */
#toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast {
    background-color: #202024;
    color: #fff;
    padding: 16px 24px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    border-left: 4px solid var(--primary);
    min-width: 300px;
    font-weight: 500;
    animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast.success { border-left-color: var(--success); }
.toast.error { border-left-color: var(--danger); }
.toast.warning { border-left-color: var(--accent); }

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
