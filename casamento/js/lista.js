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

// VALIDAÇÃO DE ACESSO
window.validarAcessoDetalhes = (id) => {
    // Se for Admin, entra sempre. Se for usuário logado, entra.
    if (isAdmin || usuarioLogado) {
        abrirModalDetalhes(id);
    } else {
        // Se não estiver logado, abre o modal de aviso de login
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
    const nome = document.getElementById('novo-item-nome').value;
    const area = document.getElementById('novo-item-area').value;
    const desc = document.getElementById('novo-item-descricao').value;
    const valor = document.getElementById('novo-item-valor').value;
    const link = document.getElementById('novo-item-link').value;

    if (!nome || !area || !desc || !valor || !link) {
        return exibirAviso('Atenção 💗', 'Preencha todos os campos.');
    }
    
    const { error } = await supabase.from('itens').insert([{ 
        nome, 
        area: parseInt(area),
        descricao: desc, 
        valor: parseFloat(valor), 
        link_compra: link 
    }]);

    if (!error) { 
        fecharTodosModais(); 
        carregarItens(); 
        
        document.getElementById('novo-item-nome').value = '';
        document.getElementById('novo-item-area').value = '';
        document.getElementById('novo-item-descricao').value = '';
        document.getElementById('novo-item-valor').value = '';
        document.getElementById('novo-item-link').value = '';
    } else {
        console.error("Erro Supabase:", error);
        exibirAviso('Erro 💔', 'Não foi possível adicionar o item.');
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