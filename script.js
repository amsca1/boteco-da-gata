const STORE_PRODUTOS = 'produtos';
const STORE_VENDAS = 'vendas';
const STORE_MESAS = 'mesas';

const TAXA_DEBITO = 0.0199;  // 1.99%
const TAXA_CREDITO = 0.0530; // 4.98%

let mesasCadastradas = [];
let mesaAtiva = null;
let vendaAtual = [];
let subtotalBruto = 0.0;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// =========================================================
// 1. FUNÇÕES DO REALTIME DATABASE
// =========================================================
function snapshotToArray(snapshot) {
    const list = [];
    snapshot.forEach((childSnapshot) => {
        list.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    return list;
}

async function inserirDados(collectionName, data) { return db.ref(collectionName).push(data); }
async function atualizarDados(collectionName, id, data) { return db.ref(`${collectionName}/${id}`).set(data); }
async function deletarDados(collectionName, id) { return db.ref(`${collectionName}/${id}`).remove(); }

async function consultarTodos(collectionName) {
    try {
        const snapshot = await db.ref(collectionName).once('value');
        if (snapshot.exists()) return snapshotToArray(snapshot);
        return [];
    } catch (error) {
        console.error(`Erro ao consultar coleção ${collectionName}:`, error);
        return [];
    }
}

// =========================================================
// 2. FUNÇÕES DE PRODUTOS
// =========================================================
async function carregarEAtualizarProdutos() {
    const produtosCadastrados = await consultarTodos(STORE_PRODUTOS);
    renderizarProdutos(produtosCadastrados);
    popularSeletorVendas(produtosCadastrados);
}

function renderizarProdutos(produtos) {
    const listaUl = document.getElementById('lista-produtos');
    listaUl.innerHTML = '';
    if(produtos.length === 0) {
        listaUl.innerHTML = '<li style="color: var(--text-muted)">Nenhum item cadastrado</li>';
        return;
    }
    produtos.forEach(p => {
        listaUl.innerHTML += `
            <li>
                <span><strong>${p.nome}</strong> - R$ ${p.preco.toFixed(2)}</span>
                <button onclick="removerCadastroProduto('${p.id}')" class="btn-remover">Remover</button>
            </li>
        `;
    });
}

async function removerCadastroProduto(id) {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;
    try {
        await deletarDados(STORE_PRODUTOS, id);
        showToast("Produto removido com sucesso!", "success");
        await carregarEAtualizarProdutos();
    } catch (error) {
        showToast("Erro ao remover produto.", "error");
    }
}

async function cadastrarNovoProduto() {
    const nomeInput = document.getElementById('nome-item');
    const precoInput = document.getElementById('preco-item');
    const nome = nomeInput.value.trim();
    const preco = parseFloat(precoInput.value);
    
    if (!nome || isNaN(preco) || preco <= 0) {
        showToast("Preencha o nome e um preço válido.", "warning");
        return;
    }

    try {
        await inserirDados(STORE_PRODUTOS, { nome, preco });
        nomeInput.value = '';
        precoInput.value = '';
        showToast(`Item "${nome}" adicionado com sucesso!`, "success");
        await carregarEAtualizarProdutos(); 
    } catch (error) {
        showToast("Erro ao cadastrar produto.", "error");
    }
}

function popularSeletorVendas(produtos) {
    const select = document.getElementById('select-produto');
    select.innerHTML = '<option value="">-- Selecione um Produto --</option>';
    produtos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nome} (R$ ${p.preco.toFixed(2)})`;
        select.appendChild(option);
    });
}

// =========================================================
// 3. FUNÇÕES DE MESAS (CLICÁVEIS)
// =========================================================
async function carregarEAtualizarMesas() {
    mesasCadastradas = await consultarTodos(STORE_MESAS);
    renderizarMesas();
}

function renderizarMesas() {
    const listaUl = document.getElementById('lista-mesas');
    listaUl.innerHTML = '';
    
    if(mesasCadastradas.length === 0) {
        listaUl.innerHTML = '<li style="color: var(--text-muted)">Nenhuma mesa cadastrada</li>';
        return;
    }

    mesasCadastradas.forEach(m => {
        const status = m.pedido && m.pedido.length > 0 ? '⚠️ ABERTA' : '✅ LIVRE';
        
        listaUl.innerHTML += `
            <li onclick="abrirMesaDireto('${m.id}')" title="Clique para abrir o painel desta mesa">
                <span><strong>${m.nome}</strong> <small style="margin-left: 8px; color: var(--text-muted)">[${status}]</small></span>
                <button onclick="event.stopPropagation(); removerCadastroMesa('${m.id}')" class="btn-remover">Remover</button>
            </li>
        `;
    });
}

async function removerCadastroMesa(id) {
    if (!confirm("Tem certeza que deseja remover esta mesa?")) return;
    try {
        await deletarDados(STORE_MESAS, id);
        showToast("Mesa removida com sucesso!", "success");
        
        if (mesaAtiva && mesaAtiva.id === id) {
            mesaAtiva = null;
            vendaAtual = [];
            document.getElementById('mesa-ativa-status').textContent = `Nenhuma mesa ativa. Clique em uma mesa ao lado para começar.`;
            renderizarVendaAtual();
        }
        await carregarEAtualizarMesas();
    } catch (error) {
        showToast("Erro ao remover a mesa.", "error");
    }
}

async function cadastrarNovaMesa() {
    const mesaInput = document.getElementById('nome-mesa');
    const nome = mesaInput.value.trim();
    if (!nome) {
        showToast("Por favor, preencha o nome da mesa.", "warning");
        return;
    }
    try {
        await inserirDados(STORE_MESAS, { nome, pedido: [], descricao: '' });
        mesaInput.value = '';
        showToast(`Mesa "${nome}" cadastrada com sucesso!`, "success");
        await carregarEAtualizarMesas(); 
    } catch (error) {
        showToast("Erro ao cadastrar mesa.", "error");
    }
}

function abrirMesaDireto(mesaId) {
    const mesaSelecionada = mesasCadastradas.find(m => m.id === mesaId);
    if (!mesaSelecionada) return;

    mesaAtiva = mesaSelecionada;
    vendaAtual = mesaAtiva.pedido || []; 

    const descricaoMesaEl = document.getElementById('descricao-mesa');
    descricaoMesaEl.value = mesaAtiva.descricao || '';
    descricaoMesaEl.disabled = false;

    document.getElementById('mesa-ativa-status').textContent = `📍 Mesa Aberta: ${mesaAtiva.nome}`;
    document.getElementById('select-forma-pagamento').disabled = false;

    renderizarVendaAtual();
    calcularTotalPagamento(); 
    
    showToast(`Painel da ${mesaAtiva.nome} pronto para lançamentos!`, "success");
}

async function salvarDescricaoMesa() {
    if (!mesaAtiva) return;
    const novaDescricao = document.getElementById('descricao-mesa').value;
    mesaAtiva.descricao = novaDescricao;
    try {
        await atualizarDados(STORE_MESAS, mesaAtiva.id, { ...mesaAtiva, descricao: novaDescricao });
    } catch (error) {}
}

// =========================================================
// 4. FUNÇÕES DO PAINEL DE VENDAS E TROCO
// =========================================================
async function adicionarItemVenda() {
    if (!mesaAtiva) {
        showToast("Por favor, clique em uma mesa na lista da esquerda primeiro!", "warning");
        return;
    }
    const produtoId = document.getElementById('select-produto').value;
    const quantidadeInput = document.getElementById('quantidade');
    const quantidade = parseInt(quantidadeInput.value) || 1;

    if (!produtoId || isNaN(quantidade) || quantidade <= 0) {
        showToast("Selecione um produto e uma quantidade válida.", "warning");
        return;
    }

    const produtosCadastrados = await consultarTodos(STORE_PRODUTOS);
    const produtoBase = produtosCadastrados.find(p => p.id === produtoId);

    if (!produtoBase) return;

    const itemExistenteIndex = vendaAtual.findIndex(item => item.id === produtoId);

    if (itemExistenteIndex > -1) {
        const itemExistente = vendaAtual[itemExistenteIndex];
        itemExistente.quantidade += quantidade;
        itemExistente.totalItem = itemExistente.preco * itemExistente.quantidade;
    } else {
        const totalItem = produtoBase.preco * quantidade; 
        vendaAtual.push({ ...produtoBase, quantidade, totalItem });
    }

    await salvarEstadoDaMesa(); 
    renderizarVendaAtual();
    quantidadeInput.value = 1; 
    showToast("Item adicionado ao pedido!", "success");
}

async function removerItemVenda(index) {
    if (index > -1) {
        vendaAtual.splice(index, 1);
        await salvarEstadoDaMesa();
        renderizarVendaAtual();
        showToast("Item removido do pedido.", "info");
    }
}

async function salvarEstadoDaMesa() {
    if (!mesaAtiva) return;
    const descricaoMesa = document.getElementById('descricao-mesa').value;
    const mesaParaAtualizar = { ...mesaAtiva, pedido: vendaAtual, descricao: descricaoMesa };

    try {
        await atualizarDados(STORE_MESAS, mesaAtiva.id, mesaParaAtualizar);
        await carregarEAtualizarMesas(); 
    } catch (error) {}
}

function calcularTotalPagamento() {
    subtotalBruto = vendaAtual.reduce((total, item) => total + item.totalItem, 0) || 0;
    const formaPagamento = document.getElementById('select-forma-pagamento').value;
    let taxaPercentual = 0;

    if (formaPagamento === 'debito') taxaPercentual = TAXA_DEBITO;
    else if (formaPagamento === 'credito') taxaPercentual = TAXA_CREDITO;

    const valorTaxa = subtotalBruto * taxaPercentual;
    const totalFinal = subtotalBruto + valorTaxa;

    document.getElementById('subtotal-bruto').textContent = `R$ ${subtotalBruto.toFixed(2)}`;
    document.getElementById('taxa-aplicada').textContent = `${(taxaPercentual * 100).toFixed(2)}%`;
    document.getElementById('valor-taxa').textContent = `R$ ${valorTaxa.toFixed(2)}`;
    document.getElementById('total-final').textContent = `R$ ${totalFinal.toFixed(2)}`;

    // LÓGICA DO TROCO
    const trocoRow = document.getElementById('troco-row');
    const valorEntregueInput = document.getElementById('valor-entregue');
    const resultadoTroco = document.getElementById('resultado-troco');

    if (formaPagamento === 'dinheiro' && totalFinal > 0) {
        trocoRow.style.display = 'flex';
        const valorEntregue = parseFloat(valorEntregueInput.value) || 0;
        
        if (valorEntregue > totalFinal) {
            const troco = valorEntregue - totalFinal;
            resultadoTroco.innerHTML = `<span style="color: var(--text-muted)">Recebido: R$ ${valorEntregue.toFixed(2)} - Total: R$ ${totalFinal.toFixed(2)} = </span> <br><strong style="color: var(--success); font-size: 1.2rem;">Troco: R$ ${troco.toFixed(2)}</strong>`;
        } else if (valorEntregue > 0 && valorEntregue < totalFinal) {
            resultadoTroco.innerHTML = `<span style="color: var(--danger)">Faltam R$ ${(totalFinal - valorEntregue).toFixed(2)}</span>`;
        } else {
            resultadoTroco.textContent = '';
        }
    } else {
        trocoRow.style.display = 'none';
    }

    return { subtotalBruto, formaPagamento, taxaPercentual, valorTaxa, totalFinal };
}

function renderizarVendaAtual() {
    const tbody = document.getElementById('tabela-venda').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    if(vendaAtual.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum item lançado nesta mesa.</td></tr>';
        calcularTotalPagamento();
        return;
    }

    vendaAtual.forEach((item, i) => { 
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${item.nome}</strong></td>
            <td>${item.quantidade}</td>
            <td>R$ ${item.preco.toFixed(2)}</td>
            <td style="color: var(--gold)">R$ ${item.totalItem.toFixed(2)}</td>
            <td style="text-align: center;"><button onclick="removerItemVenda(${i})" class="btn-remover">Remover</button></td> 
        `;
    });

    calcularTotalPagamento();
}

async function finalizarVenda() {
    if (!mesaAtiva) {
        showToast("Nenhuma mesa está ativa para ser finalizada.", "warning");
        return;
    }
    if (vendaAtual.length === 0) {
        showToast("A venda desta mesa não tem itens para finalizar.", "warning");
        return;
    }
    const { subtotalBruto, formaPagamento, taxaPercentual, valorTaxa, totalFinal } = calcularTotalPagamento();

    const novaVenda = {
        data: new Date().toLocaleString('pt-BR'),
        mesa: mesaAtiva.nome,
        descricao: mesaAtiva.descricao || '', 
        itens: vendaAtual,
        subtotalBruto: subtotalBruto,
        formaPagamento: formaPagamento,
        taxaAplicada: taxaPercentual,
        valorTaxa: valorTaxa,
        totalFinal: totalFinal,
    };

    try {
        await inserirDados(STORE_VENDAS, novaVenda);
        
        const mesaFechada = { ...mesaAtiva, pedido: [], descricao: '' };
        await atualizarDados(STORE_MESAS, mesaAtiva.id, mesaFechada);
        
        vendaAtual = [];
        mesaAtiva = null;
        
        document.getElementById('mesa-ativa-status').textContent = `Nenhuma mesa ativa. Clique em uma mesa ao lado para começar.`;
        document.getElementById('descricao-mesa').value = '';
        document.getElementById('descricao-mesa').disabled = true;
        document.getElementById('select-forma-pagamento').disabled = true;
        
        // Limpa o campo do troco
        document.getElementById('valor-entregue').value = '';
        document.getElementById('troco-row').style.display = 'none';
        
        renderizarVendaAtual(); 
        await carregarEAtualizarHistorico();
        await carregarEAtualizarMesas(); 
        
        showToast(`Venda finalizada com sucesso! Total: R$ ${totalFinal.toFixed(2)}`, "success");

    } catch (error) {
        showToast("Erro ao fechar a venda.", "error");
    }
}

// =========================================================
// 5. HISTÓRICO E INICIALIZAÇÃO
// =========================================================
async function carregarEAtualizarHistorico() {
    const historicoVendas = await consultarTodos(STORE_VENDAS);
    const listaUl = document.getElementById('lista-historico');
    listaUl.innerHTML = '';
    
    if(historicoVendas.length === 0) {
        listaUl.innerHTML = '<li style="color: var(--text-muted)">Nenhuma venda registrada no histórico.</li>';
        return;
    }

    historicoVendas.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(venda => { 
        const idCurto = venda.id.substring(venda.id.length - 4).toUpperCase();
        const descricaoTexto = venda.descricao ? `<br><small style="color: var(--accent)">📝 Obs: ${venda.descricao}</small>` : '';
        const taxaDetalhe = venda.valorTaxa > 0 ? ` + Taxa (${(venda.taxaAplicada * 100).toFixed(2)}%): R$ ${venda.valorTaxa.toFixed(2)}` : '';
        
        listaUl.innerHTML += `
            <li>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; margin-bottom: 5px;">
                    <span style="color: var(--gold)">📌 ID: ${idCurto} | Mesa: ${venda.mesa}</span>
                    <span style="color: var(--text-muted)">⏰ ${venda.data}</span>
                </div>
                <span>Bruto: R$ ${venda.subtotalBruto.toFixed(2)}${taxaDetalhe}</span><br>
                <span>Pagamento: <strong>${venda.formaPagamento.toUpperCase()}</strong> | <strong style="color: var(--success)">Líquido: R$ ${venda.totalFinal.toFixed(2)}</strong></span>
                ${descricaoTexto}
            </li>
        `;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await carregarEAtualizarProdutos();
        await carregarEAtualizarMesas();
        await carregarEAtualizarHistorico();
    } catch (error) {}
    
    document.getElementById('select-forma-pagamento').addEventListener('change', calcularTotalPagamento);
    document.getElementById('descricao-mesa').addEventListener('change', salvarDescricaoMesa);
    document.getElementById('valor-entregue').addEventListener('input', calcularTotalPagamento);

    document.getElementById('descricao-mesa').disabled = true;
    document.getElementById('select-forma-pagamento').disabled = true;

    document.getElementById('btn-cadastrar').addEventListener('click', cadastrarNovoProduto);
    document.getElementById('btn-cadastrar-mesa').addEventListener('click', cadastrarNovaMesa); 
    document.getElementById('btn-adicionar').addEventListener('click', adicionarItemVenda);
    document.getElementById('btn-finalizar').addEventListener('click', finalizarVenda);

    calcularTotalPagamento();
});