const STORE_PRODUTOS = 'produtos';
const STORE_VENDAS = 'vendas';
const STORE_MESAS = 'mesas';
const STORE_ESTOQUE = 'estoque';

const TAXA_DEBITO = 0.0199;  // 1.99%
const TAXA_CREDITO = 0.0530; // 4.98%

// Unidades por caixa sugeridas por tamanho (padrão de mercado).
// O usuário pode ajustar esse valor manualmente no cadastro do produto.
const UNIDADES_PADRAO_POR_TAMANHO = {
    'Lata': 24,
    'Latinha': 12,
    'Latão': 12,
    '250ml': 12,
    '600ml': 24,
    '1L': 12,
    '2L': 6,
    '2,5L': 6
};

let mesasCadastradas = [];
let produtosCadastrados = [];
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
// 2. MENU LATERAL (HAMBÚRGUER) E NAVEGAÇÃO ENTRE VIEWS
// =========================================================
function abrirMenu() {
    document.getElementById('drawer-menu').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
}

function fecharMenu() {
    document.getElementById('drawer-menu').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
}

async function mudarView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    document.querySelectorAll('.drawer-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === viewName);
    });
    fecharMenu();

    if (viewName === 'estoque') {
        await carregarEAtualizarEstoque();
    } else if (viewName === 'relatorio') {
        await carregarEAtualizarRelatorio();
    }
}

// =========================================================
// 3. FUNÇÕES DE PRODUTOS (CADASTRO)
// =========================================================
async function carregarEAtualizarProdutos() {
    produtosCadastrados = await consultarTodos(STORE_PRODUTOS);
    renderizarProdutos(produtosCadastrados);
    popularSeletorVendas(produtosCadastrados);
    popularSeletorEstoque(produtosCadastrados);
}

function renderizarProdutos(produtos) {
    const listaUl = document.getElementById('lista-produtos');
    listaUl.innerHTML = '';
    if (produtos.length === 0) {
        listaUl.innerHTML = '<li style="color: var(--text-muted)">Nenhum item cadastrado</li>';
        return;
    }
    produtos.forEach(p => {
        const tamanho = p.tamanho || '—';
        const unid = p.unidadesPorCaixa ? ` • CX c/ ${p.unidadesPorCaixa} un.` : '';
        listaUl.innerHTML += `
            <li>
                <span><strong>${p.nome}</strong> <small style="color: var(--text-muted)">(${tamanho}${unid})</small><br>R$ ${p.preco.toFixed(2)} / unidade</span>
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

function aplicarUnidadesPadrao() {
    const tamanho = document.getElementById('cad-tamanho').value;
    const unidInput = document.getElementById('cad-unid-caixa');
    if (tamanho && UNIDADES_PADRAO_POR_TAMANHO[tamanho]) {
        unidInput.value = UNIDADES_PADRAO_POR_TAMANHO[tamanho];
    }
}

async function cadastrarNovoProduto() {
    const nomeInput = document.getElementById('cad-nome');
    const tamanhoInput = document.getElementById('cad-tamanho');
    const unidCaixaInput = document.getElementById('cad-unid-caixa');
    const precoInput = document.getElementById('cad-valor-venda');

    const nome = nomeInput.value.trim();
    const tamanho = tamanhoInput.value;
    const unidadesPorCaixa = parseInt(unidCaixaInput.value);
    const preco = parseFloat(precoInput.value);

    if (!nome || !tamanho || isNaN(unidadesPorCaixa) || unidadesPorCaixa <= 0 || isNaN(preco) || preco <= 0) {
        showToast("Preencha nome, tamanho, unidades por caixa e o valor de venda.", "warning");
        return;
    }

    try {
        await inserirDados(STORE_PRODUTOS, { nome, tamanho, unidadesPorCaixa, preco });
        nomeInput.value = '';
        tamanhoInput.value = '';
        unidCaixaInput.value = '';
        precoInput.value = '';
        showToast(`Produto "${nome}" cadastrado com sucesso!`, "success");
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
        const tamanho = p.tamanho ? ` - ${p.tamanho}` : '';
        option.textContent = `${p.nome}${tamanho} (R$ ${p.preco.toFixed(2)})`;
        select.appendChild(option);
    });
}

function popularSeletorEstoque(produtos) {
    const select = document.getElementById('est-produto');
    if (!select) return;
    const valorAtual = select.value;
    select.innerHTML = '<option value="">-- Selecione um Produto --</option>';
    produtos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nome} (${p.tamanho || '—'})`;
        select.appendChild(option);
    });
    if (valorAtual) select.value = valorAtual;
}

// =========================================================
// 4. FUNÇÕES DE MESAS (CLICÁVEIS)
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
// 5. FUNÇÕES DO PAINEL DE VENDAS E TROCO
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

    const produtosAtuais = await consultarTodos(STORE_PRODUTOS);
    const produtoBase = produtosAtuais.find(p => p.id === produtoId);

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
// 6. FUNÇÕES DE ESTOQUE (COMPRAS E CONTROLE)
// =========================================================
function atualizarPreviewEstoque() {
    const produtoId = document.getElementById('est-produto').value;
    const qtdCaixas = parseFloat(document.getElementById('est-qtd-caixas').value) || 0;
    const valorCaixa = parseFloat(document.getElementById('est-valor-caixa').value) || 0;
    const valorVenda = parseFloat(document.getElementById('est-valor-venda').value) || 0;
    const previewEl = document.getElementById('est-preview');

    const produto = produtosCadastrados.find(p => p.id === produtoId);

    if (!produto || qtdCaixas <= 0 || valorCaixa <= 0 || valorVenda <= 0) {
        previewEl.innerHTML = '<p style="color: var(--text-muted)">Selecione um produto e informe os valores para ver a estimativa de lucro.</p>';
        return;
    }

    const unidadesPorCaixa = produto.unidadesPorCaixa || 1;
    const totalUnidades = qtdCaixas * unidadesPorCaixa;
    const custoUnidade = valorCaixa / unidadesPorCaixa;
    const lucroUnidade = valorVenda - custoUnidade;
    const lucroCaixa = lucroUnidade * unidadesPorCaixa;
    const lucroLoteTotal = lucroUnidade * totalUnidades;
    const margem = valorVenda > 0 ? (lucroUnidade / valorVenda) * 100 : 0;
    const corLucro = lucroUnidade >= 0 ? 'var(--success)' : 'var(--danger)';

    previewEl.innerHTML = `
        <div class="preview-grid">
            <div><span>Custo por Unidade</span><strong>R$ ${custoUnidade.toFixed(2)}</strong></div>
            <div><span>Lucro por Unidade</span><strong style="color: ${corLucro}">R$ ${lucroUnidade.toFixed(2)}</strong></div>
            <div><span>Lucro por Caixa</span><strong style="color: ${corLucro}">R$ ${lucroCaixa.toFixed(2)}</strong></div>
            <div><span>Lucro do Lote (${qtdCaixas} CX)</span><strong style="color: ${corLucro}">R$ ${lucroLoteTotal.toFixed(2)}</strong></div>
            <div><span>Margem sobre a venda</span><strong style="color: ${corLucro}">${margem.toFixed(1)}%</strong></div>
            <div><span>Total de Unidades</span><strong>${totalUnidades} un.</strong></div>
        </div>
    `;
}

async function registrarEntradaEstoque() {
    const produtoId = document.getElementById('est-produto').value;
    const qtdCaixasInput = document.getElementById('est-qtd-caixas');
    const valorCaixaInput = document.getElementById('est-valor-caixa');
    const valorVendaInput = document.getElementById('est-valor-venda');

    const qtdCaixas = parseFloat(qtdCaixasInput.value);
    const valorCaixa = parseFloat(valorCaixaInput.value);
    const valorVenda = parseFloat(valorVendaInput.value);

    const produto = produtosCadastrados.find(p => p.id === produtoId);

    if (!produto) {
        showToast("Selecione um produto cadastrado.", "warning");
        return;
    }
    if (isNaN(qtdCaixas) || qtdCaixas <= 0 || isNaN(valorCaixa) || valorCaixa <= 0 || isNaN(valorVenda) || valorVenda <= 0) {
        showToast("Preencha a quantidade de caixas, o valor pago e o valor de venda.", "warning");
        return;
    }

    const unidadesPorCaixa = produto.unidadesPorCaixa || 1;
    const totalUnidades = qtdCaixas * unidadesPorCaixa;
    const custoUnidade = valorCaixa / unidadesPorCaixa;
    const lucroUnidade = valorVenda - custoUnidade;
    const lucroCaixa = lucroUnidade * unidadesPorCaixa;
    const lucroLoteTotal = lucroUnidade * totalUnidades;
    const valorTotalPago = valorCaixa * qtdCaixas;

    const novaEntrada = {
        data: new Date().toLocaleString('pt-BR'),
        produtoId: produto.id,
        produtoNome: produto.nome,
        tamanho: produto.tamanho || '—',
        unidadesPorCaixa,
        quantidadeCaixas: qtdCaixas,
        totalUnidades,
        valorCaixa,
        valorTotalPago,
        valorVendaUnidade: valorVenda,
        custoUnidade,
        lucroUnidade,
        lucroCaixa,
        lucroLoteTotal
    };

    try {
        await inserirDados(STORE_ESTOQUE, novaEntrada);

        // Atualiza o preço de venda atual do produto, caso tenha sido alterado aqui
        if (valorVenda !== produto.preco) {
            await atualizarDados(STORE_PRODUTOS, produto.id, { ...produto, preco: valorVenda });
        }

        qtdCaixasInput.value = 1;
        valorCaixaInput.value = '';
        showToast(`Entrada registrada! Lucro estimado do lote: R$ ${lucroLoteTotal.toFixed(2)}`, "success");

        await carregarEAtualizarProdutos();
        await carregarEAtualizarEstoque();
        atualizarPreviewEstoque();
    } catch (error) {
        showToast("Erro ao registrar entrada de estoque.", "error");
    }
}

async function removerCompraEstoque(id) {
    if (!confirm("Tem certeza que deseja remover esta entrada de estoque?")) return;
    try {
        await deletarDados(STORE_ESTOQUE, id);
        showToast("Entrada removida do estoque.", "success");
        await carregarEAtualizarEstoque();
    } catch (error) {
        showToast("Erro ao remover entrada.", "error");
    }
}

function calcularUnidadesVendidasPorProduto(vendas, produtoId) {
    let total = 0;
    vendas.forEach(v => {
        (v.itens || []).forEach(item => {
            if (item.id === produtoId) total += item.quantidade;
        });
    });
    return total;
}

async function carregarEAtualizarEstoque() {
    const [compras, vendas] = await Promise.all([
        consultarTodos(STORE_ESTOQUE),
        consultarTodos(STORE_VENDAS)
    ]);
    renderizarEstoqueAtual(produtosCadastrados, compras, vendas);
    renderizarHistoricoCompras(compras);
}

function renderizarEstoqueAtual(produtos, compras, vendas) {
    const tbody = document.querySelector('#tabela-estoque tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted)">Nenhum produto cadastrado ainda.</td></tr>';
        return;
    }

    produtos.forEach(p => {
        const comprasProduto = compras.filter(c => c.produtoId === p.id);
        const unidadesCompradas = comprasProduto.reduce((t, c) => t + (c.totalUnidades || 0), 0);
        const unidadesVendidas = calcularUnidadesVendidasPorProduto(vendas, p.id);
        const estoqueAtual = unidadesCompradas - unidadesVendidas;
        const unidadesPorCaixa = p.unidadesPorCaixa || 1;
        const estoqueCaixas = (estoqueAtual / unidadesPorCaixa).toFixed(1);
        const valorPotencial = estoqueAtual * (p.preco || 0);
        const corEstoque = estoqueAtual <= 0
            ? 'var(--danger)'
            : (estoqueAtual <= unidadesPorCaixa ? 'var(--accent)' : 'var(--success)');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${p.nome}</strong></td>
            <td>${p.tamanho || '—'}</td>
            <td>${unidadesPorCaixa}</td>
            <td style="color: ${corEstoque}; font-weight: 600;">${estoqueAtual} un.</td>
            <td>${estoqueCaixas} CX</td>
            <td>R$ ${(p.preco || 0).toFixed(2)}</td>
            <td style="color: var(--gold)">R$ ${valorPotencial.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderizarHistoricoCompras(compras) {
    const listaUl = document.getElementById('lista-historico-compras');
    if (!listaUl) return;
    listaUl.innerHTML = '';

    if (compras.length === 0) {
        listaUl.innerHTML = '<li style="color: var(--text-muted)">Nenhuma compra registrada ainda.</li>';
        return;
    }

    compras.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(c => {
        listaUl.innerHTML += `
            <li>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; margin-bottom: 5px;">
                    <span style="color: var(--gold)">📦 ${c.produtoNome} (${c.tamanho})</span>
                    <span style="color: var(--text-muted)">⏰ ${c.data}</span>
                </div>
                <span>${c.quantidadeCaixas} CX × ${c.unidadesPorCaixa} un. = ${c.totalUnidades} un. | Pago: R$ ${c.valorTotalPago.toFixed(2)}</span><br>
                <span>Venda: R$ ${c.valorVendaUnidade.toFixed(2)}/un | <strong style="color: var(--success)">Lucro estimado do lote: R$ ${c.lucroLoteTotal.toFixed(2)}</strong></span>
                <div style="margin-top: 8px; text-align: right;">
                    <button onclick="removerCompraEstoque('${c.id}')" class="btn-remover">Remover</button>
                </div>
            </li>
        `;
    });
}

// =========================================================
// 7. RELATÓRIO GERAL
// =========================================================
async function carregarEAtualizarRelatorio() {
    const [produtos, compras, vendas] = await Promise.all([
        consultarTodos(STORE_PRODUTOS),
        consultarTodos(STORE_ESTOQUE),
        consultarTodos(STORE_VENDAS)
    ]);
    renderizarResumoRelatorio(compras, vendas);
    renderizarDesempenhoPorProduto(produtos, compras, vendas);
}

function renderizarResumoRelatorio(compras, vendas) {
    const totalVendasCount = vendas.length;
    const totalBruto = vendas.reduce((t, v) => t + (v.subtotalBruto || 0), 0);
    const totalLiquido = vendas.reduce((t, v) => t + (v.totalFinal || 0), 0);
    const totalInvestido = compras.reduce((t, c) => t + (c.valorTotalPago || 0), 0);
    const totalCaixasCompradas = compras.reduce((t, c) => t + (c.quantidadeCaixas || 0), 0);
    const lucroEstimado = totalLiquido - totalInvestido;
    const ticketMedio = totalVendasCount > 0 ? totalLiquido / totalVendasCount : 0;
    const corLucro = lucroEstimado >= 0 ? 'var(--success)' : 'var(--danger)';

    const container = document.getElementById('resumo-relatorio');
    if (!container) return;
    container.innerHTML = `
        <div class="resumo-card">
            <span>Total Vendido (Líquido)</span>
            <strong style="color: var(--gold)">R$ ${totalLiquido.toFixed(2)}</strong>
            <small>${totalVendasCount} venda(s) • Bruto R$ ${totalBruto.toFixed(2)}</small>
        </div>
        <div class="resumo-card">
            <span>Total Investido em Compras</span>
            <strong>R$ ${totalInvestido.toFixed(2)}</strong>
            <small>${totalCaixasCompradas} caixa(s) compradas</small>
        </div>
        <div class="resumo-card">
            <span>Lucro Estimado</span>
            <strong style="color: ${corLucro}">R$ ${lucroEstimado.toFixed(2)}</strong>
            <small>Vendido − Investido</small>
        </div>
        <div class="resumo-card">
            <span>Ticket Médio</span>
            <strong>R$ ${ticketMedio.toFixed(2)}</strong>
            <small>por venda finalizada</small>
        </div>
    `;
}

function renderizarDesempenhoPorProduto(produtos, compras, vendas) {
    const tbody = document.querySelector('#tabela-relatorio-produtos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted)">Nenhum produto cadastrado ainda.</td></tr>';
        return;
    }

    produtos.forEach(p => {
        const unidVendidas = calcularUnidadesVendidasPorProduto(vendas, p.id);
        const receitaVendida = vendas.reduce((t, v) => {
            const itensDoProduto = (v.itens || []).filter(i => i.id === p.id);
            return t + itensDoProduto.reduce((s, i) => s + i.totalItem, 0);
        }, 0);

        const comprasProduto = compras.filter(c => c.produtoId === p.id);
        const unidComprasTotal = comprasProduto.reduce((t, c) => t + (c.totalUnidades || 0), 0);
        const valorInvestidoProduto = comprasProduto.reduce((t, c) => t + (c.valorTotalPago || 0), 0);

        const custoMedioUnidade = unidComprasTotal > 0 ? valorInvestidoProduto / unidComprasTotal : null;
        const lucroEstimadoProduto = custoMedioUnidade !== null ? receitaVendida - (unidVendidas * custoMedioUnidade) : null;
        const lucroTexto = lucroEstimadoProduto !== null ? `R$ ${lucroEstimadoProduto.toFixed(2)}` : '—';
        const corLucro = (lucroEstimadoProduto !== null && lucroEstimadoProduto < 0) ? 'var(--danger)' : 'var(--success)';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${p.nome}</strong> <small style="color: var(--text-muted)">(${p.tamanho || '—'})</small></td>
            <td>${unidVendidas} un.</td>
            <td style="color: var(--gold)">R$ ${receitaVendida.toFixed(2)}</td>
            <td>${unidComprasTotal} un.</td>
            <td>R$ ${valorInvestidoProduto.toFixed(2)}</td>
            <td style="color: ${corLucro}">${lucroTexto}</td>
        `;
        tbody.appendChild(row);
    });
}

// =========================================================
// 8. HISTÓRICO DE VENDAS E INICIALIZAÇÃO
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

    // Menu lateral (hambúrguer)
    document.getElementById('btn-menu-toggle').addEventListener('click', abrirMenu);
    document.getElementById('drawer-overlay').addEventListener('click', fecharMenu);
    document.querySelectorAll('.drawer-link').forEach(link => {
        link.addEventListener('click', () => mudarView(link.dataset.view));
    });

    // Cadastro de Produtos
    document.getElementById('cad-tamanho').addEventListener('change', aplicarUnidadesPadrao);

    // Estoque
    document.getElementById('est-produto').addEventListener('change', () => {
        const produtoId = document.getElementById('est-produto').value;
        const produto = produtosCadastrados.find(p => p.id === produtoId);
        if (produto) document.getElementById('est-valor-venda').value = produto.preco;
        atualizarPreviewEstoque();
    });
    document.getElementById('est-qtd-caixas').addEventListener('input', atualizarPreviewEstoque);
    document.getElementById('est-valor-caixa').addEventListener('input', atualizarPreviewEstoque);
    document.getElementById('est-valor-venda').addEventListener('input', atualizarPreviewEstoque);
    document.getElementById('btn-registrar-estoque').addEventListener('click', registrarEntradaEstoque);

    calcularTotalPagamento();
});
