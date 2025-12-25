async function carregarItens() {
    const { data: itens, error } = await supabase
        .from('itens')
        .select('*')
        .order('nome', { ascending: true });

    if (error) return console.error(error);
    renderizarCards(itens);
}

function renderizarCards(itens) {
    const container = document.getElementById('lista-itens');
    const adminActions = document.getElementById('admin-actions');
    if (!container) return;

    if (adminActions) adminActions.innerHTML = '';

    if (isAdmin && adminActions) {
        adminActions.innerHTML = `<button class="add-button" onclick="abrirModal()">+</button>`;
    }

    container.innerHTML = itens.map(item => `
        <div class="card" onclick="validarAcessoDetalhes('${item.id}')" style="cursor: pointer;">
            <div class="image-mock"></div>
            <div class="card-content">
                <h2 class="nome">${item.nome}</h2>
                <p class="descricao">${item.descricao}</p>
                <span class="valor">R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <div class="card-interactions">
                    ${!item.id_usuario 
                        ? `<button class="btn-escolher">Escolher Item</button>`
                        : `<button class="btn-escolher" style="background: var(--secundaria); cursor: not-allowed; border: none; opacity: 0.7;" disabled>Já Reservado 🤍</button>`}
                </div>
            </div>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

window.validarAcessoDetalhes = (id) => {
    if (isAdmin || usuarioLogado) {
        abrirModalDetalhes(id);
    } else {
        document.getElementById('modal-aviso-login').style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
    }
};

window.fecharModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
    
    const modais = document.querySelectorAll('.modal');
    let algumAberto = false;
    modais.forEach(m => {
        if (m.style.display === 'block') algumAberto = true;
    });

    if (!algumAberto) {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.style.display = 'none';
    }
};

window.fecharTodosModais = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
};

window.abrirModal = () => {
    document.getElementById('modal-novo-presente').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
};

window.exibirAviso = (titulo, msg, temConfirm = false, callback = null) => {
    const modalAviso = document.getElementById('modal-confirmacao');
    document.getElementById('confirma-titulo').innerText = titulo;
    document.getElementById('confirma-mensagem').innerText = msg;
    
    const btnOk = document.getElementById('confirma-btn-ok');
    btnOk.innerText = temConfirm ? "Confirmar" : "Entendi";
    
    btnOk.onclick = () => { 
        if (callback) callback(); 
        fecharModal('modal-confirmacao'); 
    };

    modalAviso.style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
};

window.onclick = (e) => { 
    if (e.target.id === 'modal-overlay') {
        fecharTodosModais();
    }
};

window.adicionarItem = async () => {
    const elNome = document.getElementById('novo-item-nome');
    const elArea = document.getElementById('novo-item-area');
    const elDesc = document.getElementById('novo-item-descricao');
    const elValor = document.getElementById('novo-item-valor');
    const elLink = document.getElementById('novo-item-link');

    const nome = elNome.value.trim();
    const areaRaw = elArea.value;
    const desc = elDesc.value.trim();
    const valorRaw = elValor.value.trim();
    const link = elLink.value.trim();

    if (!nome || !areaRaw || !desc || !valorRaw || !link) {
        return exibirAviso('Atenção 💗', 'Preencha todos os campos corretamente.');
    }

    const valorLimpo = valorRaw.replace(',', '.').replace(/[^\d.]/g, '');
    const valorFinal = parseFloat(valorLimpo);

    const areaFinal = parseInt(areaRaw);

    if (isNaN(valorFinal)) {
        return exibirAviso('Erro no Valor 💔', 'O preço informado é inválido.');
    }
    
    if (isNaN(areaFinal)) {
        return exibirAviso('Erro na Área 💔', 'Selecione uma categoria válida.');
    }

    console.log("Tentando inserir:", { nome, area: areaFinal, valor: valorFinal });

    const { error } = await supabase.from('itens').insert([{ 
        nome: nome, 
        area: areaFinal,
        descricao: desc, 
        valor: valorFinal, 
        link_compra: link 
    }]);

    if (!error) { 
        fecharTodosModais(); 
        if (typeof carregarItens === 'function') carregarItens(); 
        
        [elNome, elArea, elDesc, elValor, elLink].forEach(el => el.value = '');
        
        elDesc.style.height = 'auto';
    } else {
        console.error("ERRO DETALHADO DO SUPABASE:", error);
        exibirAviso('Erro 💔', `Motivo: ${error.message}`);
    }
};

window.removerItem = (id) => {
    exibirAviso('Remover item? 💔', 'Esta ação não pode ser desfeita.', true, async () => {
        const { error } = await supabase.from('itens').delete().eq('id', id);
        if (!error) {
            fecharTodosModais();
            carregarItens();
        }
    });
};

window.tentarEscolher = (id, nome) => {
    if (!usuarioLogado) {
        fecharTodosModais();
        document.getElementById('modal-aviso-login').style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        return;
    }
    
    exibirAviso('Reservar? 🎁', `Deseja escolher "${nome}"?`, true, async () => {
        const { error } = await supabase.from('itens').update({ id_usuario: usuarioLogado.id }).eq('id', id);
        if (!error) {
            fecharTodosModais();
            exibirAviso('Sucesso! 🤍', 'Item reservado com sucesso!');
            carregarItens();
        } else {
            exibirAviso('Erro 💔', 'Não foi possível reservar o item.');
        }
    });
};