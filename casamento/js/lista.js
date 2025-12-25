let arquivosSelecionados = [];

async function carregarItens() {
    const { data: itens, error } = await supabase
        .from('itens')
        .select('*, fotos_itens(url)')
        .order('area', { ascending: true });

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

    container.innerHTML = itens.map(item => {
        const fotoPrincipal = item.fotos_itens && item.fotos_itens.length > 0 
            ? item.fotos_itens[0].url 
            : null;

        const isReservado = !!item.id_usuario;
        const reservadoClass = isReservado ? 'card-reservado' : '';
        const cursorStyle = (isAdmin || !isReservado) ? 'style="cursor: pointer;"' : 'style="cursor: default;"';

        return `
            <div class="card ${reservadoClass}" ${cursorStyle} onclick="validarAcessoDetalhes('${item.id}', ${isReservado})">
                <div class="image-container">
                    ${fotoPrincipal 
                        ? `<img src="${fotoPrincipal}" class="card-image" alt="${item.nome}">`
                        : `<div class="image-mock"><i data-lucide="gift"></i></div>`
                    }
                    ${isReservado ? `<div class="badge-reservado">Reservado 🤍</div>` : ''}
                </div>
                <div class="card-content">
                    <div class="card-header-info">
                        <h2 class="nome">${item.nome}</h2>
                        <p class="descricao">${item.descricao}</p>
                    </div>
                    <div class="card-price-info">
                        <span class="valor">R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
}

window.validarAcessoDetalhes = (id, isReservado) => {
    if (isAdmin) {
        if (typeof abrirModalDetalhes === 'function') abrirModalDetalhes(id);
        return;
    }

    if (isReservado) return;

    if (usuarioLogado) {
        if (typeof abrirModalDetalhes === 'function') abrirModalDetalhes(id);
    } else {
        document.getElementById('modal-aviso-login').style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        document.body.classList.add('modal-open');
    }
};

window.abrirModal = () => {
    document.getElementById('modal-novo-presente').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    document.body.classList.add('modal-open');
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
        document.getElementById('modal-overlay').style.display = 'none';
        document.body.classList.remove('modal-open');
    }
};

window.fecharTodosModais = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('modal-open');
    const container = document.getElementById('preview-fotos-container');
    const label = document.getElementById('label-fotos');
    const input = document.getElementById('input-fotos-novo');
    if (container) container.innerHTML = '';
    if (label) label.style.display = 'block';
    if (input) input.value = '';
    arquivosSelecionados = [];
};

window.onclick = (e) => { 
    if (e.target.id === 'modal-overlay') fecharTodosModais();
};

window.gerarPreviewFotos = (input) => {
    const container = document.getElementById('preview-fotos-container');
    const label = document.getElementById('label-fotos');
    const files = Array.from(input.files).slice(0, 3);
    arquivosSelecionados = files; 
    if (container) container.innerHTML = '';
    if (files.length > 0) {
        if (label) label.style.display = 'none';
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-item';
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    } else {
        if (label) label.style.display = 'block';
    }
};

async function fazerUploadFotos(itemId) {
    const urlsSalvas = [];
    for (const [index, file] of arquivosSelecionados.entries()) {
        const extensao = file.name.split('.').pop();
        const nomeArquivo = `${itemId}/${Date.now()}_${index}.${extensao}`;
        const { data, error } = await supabase.storage
            .from('fotos_itens')
            .upload(nomeArquivo, file);
        if (error) continue;
        const { data: publicUrlData } = supabase.storage
            .from('fotos_itens')
            .getPublicUrl(nomeArquivo);
        urlsSalvas.push(publicUrlData.publicUrl);
    }
    return urlsSalvas;
}

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
    if (isNaN(valorFinal) || isNaN(areaFinal)) {
        return exibirAviso('Erro 💔', 'Verifique o valor e a área selecionada.');
    }
    try {
        if (!supabase) throw new Error("Cliente Supabase não encontrado!");
        const { data: itemCriado, error: erroItem } = await supabase
            .from('itens')
            .insert([{ nome, area: areaFinal, descricao: desc, valor: valorFinal, link_compra: link }])
            .select().single();
        if (erroItem) throw erroItem;
        if (arquivosSelecionados.length > 0) {
            const urls = await fazerUploadFotos(itemCriado.id);
            if (urls.length > 0) {
                const rowsFotos = urls.map(u => ({ item_id: itemCriado.id, url: u }));
                await supabase.from('fotos_itens').insert(rowsFotos);
            }
        }
        fecharTodosModais(); 
        carregarItens();
        [elNome, elArea, elDesc, elValor, elLink].forEach(el => el.value = '');
    } catch (err) {
        exibirAviso('Erro 💔', 'Não foi possível salvar o presente.');
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
        document.body.classList.add('modal-open');
        return;
    }
    exibirAviso('Reservar? 🎁', `Deseja escolher "${nome}"?`, true, async () => {
        const { error } = await supabase.from('itens').update({ id_usuario: usuarioLogado.id }).eq('id', id);
        if (!error) {
            fecharTodosModais();
            exibirAviso('Sucesso! 🤍', 'Item reservado com sucesso!');
            carregarItens();
        }
    });
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
    document.body.classList.add('modal-open');
};