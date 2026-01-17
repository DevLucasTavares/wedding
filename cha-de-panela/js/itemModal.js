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
    const isEscolhido = !!item.id_usuario && item.id_usuario == usuarioLogado.id;
    if (item.id_usuario && (isAdmin || isEscolhido)) {
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

    if (isAdmin)
    {
        modal.classList.add('isAdmin');
    }

    let fotoCentro = estadoFotos[0] || null;
    let fotoDir = estadoFotos[1] || null;
    let fotoEsq = estadoFotos[2] || null;

    const estaRiscado = itemAtual.id_usuario_pendente === null;

    modal.innerHTML = `
        <button class="mdi-close" onclick="Modal.fechar()" ${estaProcessando ? 'disabled' : ''}>
            <i data-lucide="x"></i>
        </button>

        <input type="file" id="input-foto-modal" style="display:none" accept="image/*" multiple 
        onchange="adicionarFotoNoModal(this)">
        
        <div class="mdi-layout ${estaProcessando ? 'processando' : ''}">

            <div class="mdi-carrosel-container">
                <div class="mdi-carrossel-wrapper">

                    ${(fotoEsq || isAdmin) ? `
                        <div class="mdi-foto-esq" 
                            ${fotoEsq && fotoEsq.url ? `style="background-image: url('${fotoEsq.url}')"` : ''} 
                            onclick="girarCarrossel('esq')">
                            ${(!fotoEsq || !fotoEsq.url) ? '<i data-lucide="gift" class="mdi-foto-mock"></i>' : ''}
                        </div>` : ''}
                        
                    <div class="mdi-foto-meio" 
                        ${fotoCentro && fotoCentro.url ? `style="background-image: url('${fotoCentro.url}')"` : ''}
                        onclick="acaoFotoCentral()">
                        ${(!fotoCentro || !fotoCentro.url) ? '<i data-lucide="gift" class="mdi-foto-mock"></i>' : ''}
                        ${isAdmin ? `
                            <div class="mdi-foto-overlay">
                                <i data-lucide="${(fotoCentro && !fotoCentro.isMock) ? 'trash-2' : 'plus'}"></i>
                            </div>` : ''}
                    </div>

                    ${(fotoDir || isAdmin) ? `
                        <div class="mdi-foto-dir" 
                            ${fotoDir && fotoDir.url ? `style="background-image: url('${fotoDir.url}')"` : ''} 
                            onclick="girarCarrossel('dir')">
                            ${(!fotoDir || !fotoDir.url) ? '<i data-lucide="gift" class="mdi-foto-mock"></i>' : ''}
                        </div>` : ''}

                </div>
            </div>

            <div class="mdi-coluna">
                <div style="text-align: center;">
                    ${isAdmin ? 
                        `<div>
                            <b>Nome:</b>
                            <input class="mdi-input-texto" type="text" id="edit-nome" value="${item.nome}">
                        </div>`
                        : 
                        `<h2 class="mdi-display-texto">${item.nome}</h2>`
                    }

                    <div class="campo-valor-row">
                        ${isAdmin ? 
                            `<b>Valor:</b>
                            <input type="number" id="edit-valor" class="mdi-input-texto" value="${item.valor}">`
                            : 
                            `<span>R$${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>`
                        }
                    </div>

                    ${isAdmin ?
                        `<div>
                            <b>Ranking:</b>
                            <input type="text" id="edit-ranking" class="mdi-input-texto" value="${item.ranking}">
                        </div>`
                        : ''
                    }
                </div>

                <div class="mdi-campos-detalhes">
                    ${isAdmin ? 
                        `<div>
                            <b>Área:</b>
                            <select id="edit-area" class="">
                                <option value="1" ${item.area == 1 ? 'selected' : ''}>Banheiro</option>
                                <option value="2" ${item.area == 2 ? 'selected' : ''}>Cozinha</option>
                                <option value="3" ${item.area == 3 ? 'selected' : ''}>Eletrodomésticos</option>
                                <option value="4" ${item.area == 4 ? 'selected' : ''}>Quarto</option>
                                <option value="5" ${item.area == 5 ? 'selected' : ''}>Área de Serviço</option>
                                <option value="6" ${item.area == 6 ? 'selected' : ''}>Outros</option>
                            </select>
                        </div>
                        <div>
                            <b>Descrição:</b>
                            <textarea id="edit-desc" class="mdi-input-texto">${item.descricao || ''}</textarea>
                        </div>
                        <div>
                            <b>Link:</b>
                            <input type="text" id="edit-link" class="mdi-input-texto" value="${item.link_compra || ''}" placeholder="Link de compra">
                        </div>`
                    : `<p class="mdi-display-descricao">${item.descricao || ''}</p>`}
                </div>

                ${item.id_usuario && (isAdmin || comprador) ? 
                        `<div class="mdi-container-reserva" id="container-reserva">
                            <div id="dados-reservista" class="${estaRiscado ? 'texto-riscado' : ''}">
                                <p><strong>
                                ${item.comprado_em != null ?
                                    `Comprado por:`
                                    :
                                    `Reservado por:`
                                }
                                </strong></p> 
                                <div>
                                    <p>${comprador.nome}</p>
                                    ${isAdmin?
                                    `<p>${comprador.telefone || comprador.email}</p>`
                                    : ''
                                    }
                                </div>
                            </div>
                        </div>` 
                        : ''
                    }

                <div class="mdi-acoes-usuario">
                    ${isAdmin ?
                    `<div class="salvar">
                        <button class="mdi-botao-acao" onclick="salvarEdicao('${item.id}')" id="btn-salvar-modal">
                            <i data-lucide="save"></i>
                        </button>
                    </div>
                    <div class="excluir">
                        <button class="mdi-botao-acao" onclick="apagarItem('${item.id}')" id="btn-excluir-modal">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>`
                    : (item.id_usuario === null ? 
                        `<div class="reservar">
                            <button class="mdi-botao-acao" 
                            onclick="iniciarFluxoReserva('${item.id}')">
                                Reservar
                            </button>
                        </div>` 
                        : 
                        `${item.ranking !== 9999 && !item.comprado_em ? 
                            `<div class="loja">
                                <a href="${item.link_compra}" target="_blank" class="mdi-botao-acao" onclick="iniciarFluxoConfirmacao('${item.id}', '${item.valor}')">
                                    <i data-lucide="shopping-cart"></i>    
                                </a>
                            </div>` : ''
                        }
                        ${!item.comprado_em ?
                        `<div class="pix">
                            <button class="mdi-botao-acao" onclick="renderizarEtapaPix('${item.id}', '${item.valor}')">
                                PIX
                            </button>
                        </div>`
                        : ''
                        }
                        <div class="reservar">
                            <button class="mdi-botao-acao" onclick="navegar('contato')">
                                Endereço
                            </button>
                        </div>`
                    )
                }
                ${item.id_usuario && (isAdmin || (!item.comprado_em && (item.id_usuario == usuarioLogado.id))) ?
                    `<button type="button" 
                        class="mdi-botao-acao ${estaRiscado ? 'status-reverter' : 'status-remover'}" 
                        id="btn-toggle-reserva" 
                        onclick="alternarStatusReserva()">
                            <i data-lucide="${estaRiscado ? 'rotate-ccw' : 'ban'}"></i>
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
    const isEscolhido = !!itemAtual.id_usuario && itemAtual.id_usuario == usuarioLogado.id;
    const isRiscado = itemAtual.hasOwnProperty('id_usuario_pendente') && itemAtual.id_usuario_pendente === null;
    if (!isAdmin && isEscolhido && !isRiscado) {
        iniciarFluxoCancelamento(itemAtual.id)
        return;
    }

    if (!isRiscado) {
        itemAtual.id_usuario_pendente = null;
    } else {
        itemAtual.id_usuario_pendente = itemAtual.id_usuario;
    }
    renderizarConteudoModal();
};

window.apagarItem = async (id) => {
    if (estaProcessando) return;
    estaProcessando = true;

    const btnExcluir = document.getElementById('btn-excluir-modal');
    if (btnExcluir) btnExcluir.innerHTML = "Processando..."

    try {
        await supabase
            .from('itens')
            .delete()
            .eq('id', id);

        Modal.fechar();
        carregarItens();

        } catch (err) {
            console.error(err);

        } finally {
            estaProcessando = false;

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
                    itemAtual.id_usuario_pendente : itemAtual.id_usuario,
                comprado_em: itemAtual.hasOwnProperty('id_usuario_pendente') ?
                    null : itemAtual.comprado_em
            })
            .eq('id', id);

        if (error) throw error;
        Modal.fechar();
        carregarItens();

    } catch (err) {
        console.error(err);

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

// Inicia o fluxo de reserva
function iniciarFluxoReserva(idItem) {
    const modal = document.getElementById('modal-detalhes-item');

    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Esse item ficará reservado exclusivamente para você!</h3>
            <p>Estamos muito felizes por pensar na gente com tanto carinho.</p>
            <p>A partir de agora, ao clicar no próprio item irá aparecer o link do site para compra.</p>
            <p>Pode ficar tranquilo, se mudar de ideia é só acessar o item novamente e cancelar a reserva.</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="confirmarReservaSucesso('${idItem}')">Acessar o item</button>
                <button class="btn-cancelar" onclick="Modal.fechar()">Mudei de ideia</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

function renderizarEtapaConfirmacaoReserva(idItem) {
    const modal = document.getElementById('modal-detalhes-item');

    // ToDo: Add mensagem que pode ver os itens reservados no Perfil
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Esse item ficará reservado exclusivamente para você!</h3>
            <p>A partir de agora, ao clicar no próprio item irá aparecer o link do site para compra.</p>
            <p>Pode ficar tranquilo, se mudar de ideia é só acessar o item novamente e cancelar a reserva.</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="confirmarReservaSucesso('${idItem}')">Acessar o item</button>
                <button class="btn-cancelar" onclick="Modal.fechar()">Mudei de ideia</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

// Inicia o fluxo de confirmação de compra
window.iniciarFluxoConfirmacao = (idItem, valor) => {
    setTimeout(() => {
        renderizarEtapaConfirmacao(idItem, valor);
    }, 500); // Delay p garantir q a aba ext abra antes
};

function renderizarEtapaConfirmacao(idItem, valor) {
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Deu tudo certo com a compra?</h3>
            <p>Sua confirmação ajuda a manter nossa lista atualizada!</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="confirmarCompraSucesso('${idItem}')">Sim, comprei!</button>
                <button class="btn-cancelar" onclick="renderizarEtapaNegada('${idItem}', '${valor}')">Não...</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.renderizarEtapaNegada = (idItem, valor) => {
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Ocorreu algum problema?</h3>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="Modal.fechar()">Não comprei</button>
                <button class="btn-cancelar" onclick="tratarLinkInvalido('${idItem}', '${valor}')">Link inválido</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.renderizarEtapaMotivoFalha = (idItem, valor) => {
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Mas por que não deu certo?</h3>
            <div class="modal-acoes-fluxo">
                <button class="btn-falha" onclick="tratarLinkInvalido('${idItem}', '${valor}')">Link inválido</button>
                <button class="btn-falha" onclick="renderizarEtapaPix('${idItem}', '${valor}')">Desisti</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.renderizarEtapaPix = (idItem, valor) => {
    
    const valorFormatado = Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Quer enviar um PIX com esse valor para o casal?</h3>
            <p>Chave Pix do casal:</p>
            <b><p>165.667.417-39</p></b>
            <p>O valor do item reservado é de</p>
            <p>R$ ${valorFormatado}</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="confirmarCompraSucesso('${idItem}')">Fiz o PIX!</button>
                <button class="btn-cancelar" onclick="Modal.fechar()">Não</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.confirmarReservaSucesso = async (idItem) => {
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
            alert("Erro ao reservar. Tente novamente.");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return;
        }
        
        if (typeof carregarItens === 'function') carregarItens();
        abrirModalDetalhes(idItem)
        // direcionarParaItem(idItem);
        // Modal.fechar(); 
        
    } else {
        navegar('login');
    }
};

window.direcionarParaItem = (idItem) => {
    const modal = document.getElementById('modal-detalhes-item');
    
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Tudo certo!</h3>
            <p>Item reservado e já disponível para presentear, basta acessar ele novamente.</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="abrirModalDetalhes('${idItem}')">Acessar</button>
                <button class="btn-cancelar" onclick="Modal.fechar()">Voltar</button>
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
            .update({ comprado_em: new Date().toISOString() })
            .eq('id', idItem)
            .eq('id_usuario', usuarioLogado.id) // Segurança: garante que quem reservou é quem está pagando
        
        if (error) {
            console.error("Erro ao vincular compra:", error);
            alert("Erro ao confirmar compra. Tente novamente.");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return;
        }
        
        Modal.fechar(); 
        if (typeof carregarItens === 'function') carregarItens();
        abrirModalDetalhes(idItem)
    } else {
        navegar('login');
    }
}

window.tratarLinkInvalido = async (idItem, valor) => {
    const { error } = await supabase
        .from('itens')
        .update({ 
            ranking: 9999
        })
        .eq('id', idItem);

    if (error) console.error("Erro ao atualizar link inválido:", error);
    
    renderizarEtapaPix(idItem, valor);
};

// Inicia o fluxo de cancelamento da reserva
function iniciarFluxoCancelamento(idItem) {
    const modal = document.getElementById('modal-detalhes-item');

    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Tem certeza que quer cancelar a reserva?</h3>
            <p>Sabemos que imprevistos acontecem e está tudo bem.</p>
            <p>Mas caso tenha clicado por engano, tem como voltar!</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="cancelaReserva('${idItem}')">Cancelar reserva</button>
                <button class="btn-cancelar" onclick="Modal.fechar()">Voltar</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

window.cancelaReserva = async (idItem) => {
    const btn = event.target;
    const textoOriginal = btn.innerText;
    btn.innerText = "Processando...";
    btn.disabled = true;

    if (usuarioLogado) {
        const { error } = await supabase
            .from('itens')
            .update({ id_usuario: null })
            .eq('id', idItem);

        if (error) {
            console.error("Erro ao cancelar reserva:", error);
            alert("Erro. Tente novamente.");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return;
        }
        
        Modal.fechar(); 
        if (typeof carregarItens === 'function') carregarItens();
        
        direcionarParaItem(idItem);
    } else {
        navegar('login');
    }
};

// Inicia o fluxo de compra por pix
function iniciarFluxoCompraPix(idItem, valor) {
    const valorFormatado = Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const modal = document.getElementById('modal-detalhes-item');
    modal.innerHTML = `
        <div class="modal-fluxo-confirmacao">
            <h3>Chave Pix do casal</h3>
            <b><p>165.667.417-39</p></b>
            <p>O valor do item reservado</p> 
            <p>é de R$ ${valorFormatado}</p>
            <div class="modal-acoes-fluxo">
                <button class="btn-confirmar" onclick="confirmarCompraSucesso('${idItem}')">Fiz o PIX!</button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}