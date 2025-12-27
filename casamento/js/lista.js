let arquivosSelecionados = [];
let itensLocais = [];

async function carregarItens() {
    const { data: itens, error } = await supabase
        .from('itens')
        .select('*, fotos_itens(url)')
        .order('area', { ascending: true });

    if (error) return console.error(error);

    itensLocais = itens;
    window.ordenarItens();
}

function renderizarCards(itens) {
    const container = document.getElementById('lista-itens');
    const cabecalhoLista = document.getElementById('cabecalho-lista');
    if (!container) return;

    if (cabecalhoLista && !document.getElementById('filtro-ordenacao')) {
        let htmlCabecalho = `
            <div id="filtro-ordenacao-container">
                <select id="filtro-ordenacao" onchange="window.mudarCriterio(this.value)">
                    <option value="preferencia">Preferência dos Noivos</option>
                    <option value="valor">Valor</option>
                    <option value="area">Área</option>
                </select>
                
                <div id="controles-extras" style="display: flex; align-items: center;">
                    <select id="filtro-area-categoria" style="display: none;" onchange="window.ordenarItens()">
                        <option value="todas">Todas as Áreas</option>
                        <option value="1">Banheiro</option>
                        <option value="2">Cozinha</option>
                        <option value="3">Eletrodomésticos</option>
                        <option value="4">Quarto</option>
                        <option value="5">Área de Serviço</option>
                        <option value="6">Outros</option>
                    </select>
                    
                    <button id="btn-ordem-valor" class="ordem-button" style="display: none;" onclick="window.alternarDirecaoValor()">
                        <i data-lucide="arrow-up"></i>
                    </button>
                </div>
            </div>
        `;

        if (isAdmin) {
            htmlCabecalho += `<button class="add-button" onclick="abrirModal()">+</button>`;
        }
        cabecalhoLista.innerHTML = htmlCabecalho;
    }

    container.innerHTML = itens.map(item => {
        const fotoPrincipal = item.fotos_itens && item.fotos_itens.length > 0
            ? item.fotos_itens[0].url
            : null;

        const isReservado = !!item.id_usuario;
        const isEscolhido = !!item.id_usuario && item.id_usuario == usuarioLogado.id;
        const isComprado = !!item.comprado_em;

        const podeAcessar = !isReservado || isEscolhido || isAdmin;

        const reservadoClass = isReservado ? 'card-reservado' : '';
        const cursorStyle = (isAdmin || !isReservado) ? 'style="cursor: pointer;"' : 'style="cursor: default;"';

        return `
            <div class="card ${reservadoClass}" ${cursorStyle} onclick="validarAcessoDetalhes('${item.id}', ${podeAcessar})">
                <div class="image-container">
                    ${fotoPrincipal ? 
                        `<img src="${fotoPrincipal}" class="card-image" alt="${item.nome}">`
                        : 
                        `<div class="image-mock"><i data-lucide="gift"></i></div>`
                    }

                    ${isComprado ?
                        `<div class="badge-reservado">Comprado!</div>`
                        :
                        (isEscolhido ? 
                            `<div class="badge-reservado">Você reservou</div>`
                            :
                            (isReservado ? 
                                `<div class="badge-reservado">Reservado</div>`
                                : ''
                            )
                        )
                    }

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

window.validarAcessoDetalhes = (id, podeAcessar) => {
    if (!usuarioLogado) {
        document.getElementById('modal-aviso-login').style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        document.body.classList.add('modal-open');
    }

    if (podeAcessar) {
        if (typeof abrirModalDetalhes === 'function') abrirModalDetalhes(id);
        return;
    }

    if (!podeAcessar) return;
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

                await supabase

                    .from('fotos_itens')

                    .insert(rowsFotos);

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
    console.log("Chegou em removerItem")
    exibirAviso('Remover item? 💔', 'Esta ação não pode ser desfeita.', true, async () => {
        const { error } = await supabase
            .from('itens')
            .delete()
            .eq('id', id);

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



        const { error } = await supabase

            .from('itens')

            .update({ id_usuario: usuarioLogado.id })

            .eq('id', id);

       

        if (!error) {

            fecharTodosModais();

            exibirAviso('Sucesso! 🤍', 'Item reservado com sucesso!');

            carregarItens();

        }

    });

};



window.exibirAviso = (titulo, msg, temConfirm = false, callback = null) => {
    console.log("Entrou em exibirAviso")

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

let direcaoValor = 'desc';

window.mudarCriterio = (criterio) => {
    const filtroArea = document.getElementById('filtro-area-categoria');
    const btnValor = document.getElementById('btn-ordem-valor');
    
    filtroArea.style.display = (criterio === 'area') ? 'block' : 'none';
    btnValor.style.display = (criterio === 'valor') ? 'block' : 'none';
    
    window.ordenarItens();
};

window.alternarDirecaoValor = () => {
    direcaoValor = direcaoValor === 'asc' ? 'dsc' : 'asc';
    const icone = document.getElementById('btn-ordem-valor');
    if (icone) {
        icone.setAttribute('data-lucide', direcaoValor === 'asc' ? 'arrow-down' : 'arrow-up');
    }
    if (window.lucide) lucide.createIcons();
    window.ordenarItens();
};

window.ordenarItens = () => {
    const elementoCriterio = document.getElementById('filtro-ordenacao');
    const elementoCategoria = document.getElementById('filtro-area-categoria');
    
    const criterio = (elementoCriterio && elementoCriterio.value) || 'preferencia';
    const categoriaSelecionada = (elementoCategoria && elementoCategoria.value) || 'todas';

    let itensFiltrados = [...itensLocais];

    if (criterio === 'area' && categoriaSelecionada !== 'todas') {
        itensFiltrados = itensFiltrados.filter(item => item.area == categoriaSelecionada);
    }

    itensFiltrados.sort((a, b) => {

        const aTemUsuario = a.id_usuario !== null && a.id_usuario !== undefined;
        const bTemUsuario = b.id_usuario !== null && b.id_usuario !== undefined;
        if (aTemUsuario && !bTemUsuario) return 1;
        if (!aTemUsuario && bTemUsuario) return -1;

        if (criterio === 'valor') {
            return direcaoValor === 'asc' ? a.valor - b.valor : b.valor - a.valor;
        } 
        else if (criterio === 'area') {
            if (a.area !== b.area) return a.area - b.area;
        } 
        else if (criterio === 'preferencia') {
            if (a.ranking !== b.ranking) {
                if (a.ranking === null || a.ranking === undefined) return 1;
                if (b.ranking === null || b.ranking === undefined) return -1;
                
                return a.ranking - b.ranking;
            }
        }
        const rankA = a.ranking ?? Infinity;
        const rankB = b.ranking ?? Infinity;
        if (rankA !== rankB) {
            return rankA - rankB;
        }

        return a.nome.localeCompare(b.nome);
    });

    renderizarCards(itensFiltrados);
};