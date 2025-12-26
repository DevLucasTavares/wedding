let estadoFotos = []; 
let fotosParaDeletar = []; 
let estaProcessando = false;
let itemAtual = null;
let compradorAtual = null;

window.abrirModalDetalhes = async (id) => {
    if (estaProcessando) return;
    
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-detalhes-item');
    
    estadoFotos = [];
    fotosParaDeletar = [];
    
    const { data: item, error } = await supabase
        .from('itens')
        .select('*, fotos_itens(id, url)')
        .eq('id', id)
        .single();
    
    if (error) return console.error("Erro ao buscar item:", error);
    itemAtual = item;
    
    if (item.fotos_itens && item.fotos_itens.length > 0) {
        estadoFotos = item.fotos_itens.map(f => ({ id: f.id, url: f.url, isLocal: false, isMock: false }));
    }

    if (isAdmin) {
        while (estadoFotos.length < 3) {
            estadoFotos.push({ url: null, isLocal: false, isMock: true });
        }
    }
    
    compradorAtual = null;
    if (isAdmin && item.id_usuario) {
        const { data: perfil } = await supabase
            .from('perfis')
            .select('nome, email, telefone')
            .eq('id', item.id_usuario)
            .single();
        compradorAtual = perfil;
    }

    renderizarConteudoModal();
    overlay.style.display = 'block';
    modal.style.display = 'block';
};

window.girarCarrossel = (direcao) => {
    if (estadoFotos.length < 2) return;

    if (direcao === 'dir') {
        estadoFotos.push(estadoFotos.shift());
    } else {
        estadoFotos.unshift(estadoFotos.pop());
    }
    renderizarConteudoModal();
};

window.acaoFotoCentral = () => {
    if (!isAdmin) return;

    const fotoNoCentro = estadoFotos[0];
    if (!fotoNoCentro || fotoNoCentro.isMock) {
        document.getElementById('input-foto-modal').click();

    } else {
        const fotoRemovida = estadoFotos.splice(0, 1)[0];

        if (!fotoRemovida.isLocal) {
            fotosParaDeletar.push(fotoRemovida);
        }

        estadoFotos.unshift({ url: null, isLocal: false, isMock: true });
        renderizarConteudoModal();
    }
};

window.adicionarFotoNoModal = async (input) => {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    const processarArquivo = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => resolve({
                url: e.target.result,
                isLocal: true,
                isMock: false,
                file: file
            });
            reader.readAsDataURL(file);
        });
    };

    const novasFotosData = await Promise.all(files.slice(0, 3).map(processarArquivo));

    novasFotosData.forEach((novaFoto, i) => {
        let idxDestino;

        if (i === 0) {
            idxDestino = 0; 
        } else {
            idxDestino = estadoFotos.findIndex(f => f.isMock);
        }

        if (idxDestino !== -1) {
            estadoFotos[idxDestino] = novaFoto;
        } else if (estadoFotos.length < 3) {
            estadoFotos.push(novaFoto);
        }
    });

    renderizarConteudoModal();
    input.value = ""; 
};

function renderizarConteudoModal() {
    const modal = document.getElementById('modal-detalhes-item');
    const item = itemAtual;
    const comprador = compradorAtual;

    let fotoCentro = estadoFotos[0] || null;
    let fotoDir = estadoFotos[1] || null;
    let fotoEsq = estadoFotos[2] || null;

    modal.innerHTML = `

        <button class="close" onclick="fecharTodosModais()" ${estaProcessando ? 'disabled' : ''}>
            <i data-lucide="x"></i>
        </button>

        <input type="file" id="input-foto-modal" style="display:none" accept="image/*" multiple 
        onchange="adicionarFotoNoModal(this)">
        
        <div class="modal-layout ${estaProcessando ? 'processando' : ''}">

            <div class="carrossel-container">
                <div class="carrossel-wrapper">

                    ${(fotoEsq || isAdmin) ? `
                        <div class="foto-lateral esq" 
                            ${fotoEsq && fotoEsq.url ? `style="background-image: url('${fotoEsq.url}')"` : ''} 
                            onclick="girarCarrossel('esq')">
                            ${(!fotoEsq || !fotoEsq.url) ? '<i data-lucide="gift" class="mock-icon"></i>' : ''}
                        </div>` : ''}
                        
                    <div class="foto-central ${isAdmin ? 'admin-edit' : ''}" 
                        ${fotoCentro && fotoCentro.url ? `style="background-image: url('${fotoCentro.url}')"` : ''}
                        onclick="acaoFotoCentral()">
                        ${(!fotoCentro || !fotoCentro.url) ? '<i data-lucide="gift" class="mock-icon"></i>' : ''}
                        ${isAdmin ? `
                            <div class="overlay-foto">
                                <i data-lucide="${(fotoCentro && !fotoCentro.isMock) ? 'trash-2' : 'plus'}"></i>
                            </div>` : ''}
                    </div>

                    ${(fotoDir || isAdmin) ? `
                        <div class="foto-lateral dir" 
                            ${fotoDir && fotoDir.url ? `style="background-image: url('${fotoDir.url}')"` : ''} 
                            onclick="girarCarrossel('dir')">
                            ${(!fotoDir || !fotoDir.url) ? '<i data-lucide="gift" class="mock-icon"></i>' : ''}
                        </div>` : ''}

                </div>
            </div>

            <div class="modal-col-direita">
                <div style="text-align: center;">
                    ${isAdmin ? 
                        `<b>Nome:</b>
                        <input type="text" id="edit-nome" class="input-titulo" value="${item.nome}">`
                        : 
                        `<h2 class="modal-titulo">${item.nome}</h2>`
                    }

                    <div class="campo-valor-row">
                        <i data-lucide="dollar-sign"></i>
                        ${isAdmin ? 
                            `<b>Valor:</b>
                            <input type="number" id="edit-valor" value="${item.valor}">`
                            : 
                            `<span>${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>`
                        }
                    </div>

                    ${isAdmin?
                        `<b>Ranking:</b>
                        <input type="text" id="edit-ranking" class="" value="${item.ranking}">`
                        : ''
                    }

                </div>

                ${isAdmin && comprador ? 
                    `<div class="info-comprador" id="container-reserva">
                        <div id="dados-reservista">
                            <p><strong>Reservado por:</strong> ${comprador.nome}</p>
                            <p>${comprador.telefone || comprador.email}</p>
                        </div>
                        <button type="button" id="btn-toggle-reserva" onclick="alternarStatusReserva()">
                            Remover reserva
                        </button>
                    </div>` 
                    : ''
                }

                ${isAdmin 
                    ? `<div class="campo-admin">
                            <b>Area:</b>
                            <select id="edit-area" class="modal-select">
                                <option value="1" ${item.area == 1 ? 'selected' : ''}>Banheiro</option>
                                <option value="2" ${item.area == 2 ? 'selected' : ''}>Cozinha</option>
                                <option value="3" ${item.area == 3 ? 'selected' : ''}>Eletrodomésticos</option>
                                <option value="4" ${item.area == 4 ? 'selected' : ''}>Quarto</option>
                                <option value="5" ${item.area == 5 ? 'selected' : ''}>Área de Serviço</option>
                                <option value="6" ${item.area == 6 ? 'selected' : ''}>Outros</option>
                            </select>
                            <b>Descrição:</b>
                            <textarea id="edit-desc">${item.descricao || ''}</textarea>
                            <b>Link:</b>
                            <input type="text" id="edit-link" value="${item.link_compra || ''}" placeholder="Link de compra">
                        </div>`
                    : `<p class="modal-descricao">${item.descricao || ''}</p>`}

                <div class="modal-acoes-row">

                    ${item.link_compra !== 'https://lucascarrarini.com/casamento/' ? 
                        `<a href="${item.link_compra}" 
                        target="_blank" 
                        class="btn-acao-mini btn-loja" 
                        onclick="iniciarFluxoConfirmacao('${item.id}')">
                            <i data-lucide="shopping-cart"></i> Loja    
                        </a>` 
                        : ''
                    }

                    <button class="btn-acao-mini btn-pix-mini" onclick="exibirAviso('PIX 🤍', 'Chave PIX: seu@email.com')">
                        <i data-lucide="qr-code"></i> PIX
                    </button>

                    ${isAdmin ? `
                        <button class="btn-acao-mini btn-save-mini" onclick="salvarEdicao('${item.id}')" id="btn-salvar-modal">
                            <i data-lucide="save"></i> Salvar
                        </button>
                        <button class="btn-acao-mini btn-delete-mini" onclick="removerItem('${item.id}')">
                            <i data-lucide="trash-2"></i> Apagar
                        </button>` 
                        : ''
                    }
                </div>

            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

window.alternarStatusReserva = () => {
    const container = document.getElementById('dados-reservista');
    const btn = document.getElementById('btn-toggle-reserva');
    
    if (!container.classList.contains('texto-riscado')) {
        container.style.textDecoration = 'line-through';
        container.style.opacity = '0.5';
        container.classList.add('texto-riscado');
        btn.innerText = 'Reverter reserva';
        itemAtual.id_usuario_pendente = null;
    } else {
        container.style.textDecoration = 'none';
        container.style.opacity = '1';
        container.classList.remove('texto-riscado');
        btn.innerText = 'Remover reserva';
        itemAtual.id_usuario_pendente = itemAtual.id_usuario;
    }
};

window.salvarEdicao = async (id) => {
    if (estaProcessando) return;

    estaProcessando = true;
    const btnSalvar = document.getElementById('btn-salvar-modal');

    if(btnSalvar) btnSalvar.innerHTML = "Processando...";
    
    try {
        const nome = document.getElementById('edit-nome').value;
        const valor = document.getElementById('edit-valor').value;
        const areaRaw = document.getElementById('edit-area').value;
        const descricao = document.getElementById('edit-desc').value;
        const link = document.getElementById('edit-link').value;
        const ranking = document.getElementById('edit-ranking').value;

        for (const foto of fotosParaDeletar) {

            const path = foto.url.split('/public/fotos_itens/')[1];

            await supabase.storage
                .from('fotos_itens')
                .remove([path]);

            await supabase
                .from('fotos_itens')
                .delete()
                .eq('id', foto.id);
        }

        const novasFotos = estadoFotos.filter(f => f.isLocal && !f.isMock);

        for (const [index, foto] of novasFotos.entries()) {
            const ext = foto.file.name.split('.').pop();
            const nomeArq = `${id}/${Date.now()}_${index}.${ext}`;

            const { data: upData, error: upErr } = await supabase.storage
                .from('fotos_itens')
                .upload(nomeArq, foto.file);
            
            if (!upErr) {

                const { data: pub } = supabase.storage
                    .from('fotos_itens')
                    .getPublicUrl(nomeArq);

                await supabase
                    .from('fotos_itens')
                    .insert([{ item_id: id, url: pub.publicUrl }]);

            }
        }

        const { error } = await supabase
            .from('itens')
            .update({
                nome,
                valor: parseFloat(valor),
                area: areaRaw ? parseInt(areaRaw) : null,
                descricao,
                link_compra: link,
                ranking: parseFloat(ranking),
                id_usuario: itemAtual.hasOwnProperty('id_usuario_pendente') ? 
                    itemAtual.id_usuario_pendente : itemAtual.id_usuario
            })
            .eq('id', id);

        if (error) throw error;
        exibirAviso('Sucesso! ✨', 'Item atualizado com sucesso!');
        fecharTodosModais();
        carregarItens();

    } catch (err) {
        console.error(err);
        exibirAviso('Erro 💔', 'Erro ao salvar as alterações.');

    } finally {
        estaProcessando = false;

    }
};

function getAreaNome(id) {
    const areas = { 
        1: 'Banheiro', 
        2: 'Cozinha', 
        3: 'Eletrodomésticos', 
        4: 'Quarto', 
        5: 'Área de Serviço', 
        6: 'Outros' };

    return areas[id] || '';
}

// Inicia o fluxo
window.iniciarFluxoConfirmacao = (idItem) => {
    setTimeout(() => {
        renderizarEtapaConfirmacao(idItem);
    }, 500); // Delay p garantir q a aba ext abra antes
};

function renderizarEtapaConfirmacao(idItem) {
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Deu tudo certo com a compra?</h3>
            <p>Sua confirmação ajuda a manter nossa lista atualizada!</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="confirmarCompraSucesso('${idItem}')">Sim, comprei!</button>
                <button class="btn-cancelar" onclick="renderizarEtapaMotivoFalha('${idItem}')">Não deu certo</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.renderizarEtapaMotivoFalha = (idItem) => {
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Mas por que não deu certo? 😕</h3>
            <div class="modal-acoes-fluxo">
                <button class="btn-falha" onclick="tratarLinkInvalido('${idItem}')">Link inválido</button>
                <button class="btn-falha" onclick="renderizarEtapaPix()">Desisti</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.renderizarEtapaPix = () => {
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Que pena... quer enviar um PIX com esse valor para o casal? 🤍</h3>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="navegar('contato')">Sim</button>
                <button class="btn-cancelar" onclick="fecharTodosModais()">Não</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.confirmarCompraSucesso = async (idItem) => {
    const btn = event.target;
    const textoOriginal = btn.innerText;
    btn.innerText = "Processando...";
    btn.disabled = true;

    if (usuarioLogado) {
        const { error } = await supabase
            .from('itens')
            .update({ id_usuario: usuarioLogado.id })
            .eq('id', idItem);

        if (error) {
            console.error("Erro ao vincular compra:", error);
            alert("Erro ao confirmar compra. Tente novamente.");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return;
        }
        
        fecharTodosModais(); 
        if (typeof carregarItens === 'function') carregarItens();
        
        if (window.exibirAviso) exibirAviso('Obrigado! ❤️', 'Sua contribuição foi registrada.');
    } else {
        navegar('login');
    }
};


window.tratarLinkInvalido = async (idItem) => {
    const { error } = await supabase
        .from('itens')
        .update({ 
            ranking: 9999, 
            link_compra: 'https://lucascarrarini.com/casamento/' 
        })
        .eq('id', idItem);

    if (error) console.error("Erro ao atualizar link inválido:", error);
    
    renderizarEtapaPix();
};