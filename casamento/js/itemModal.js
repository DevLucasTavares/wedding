// Estado global das cores do carrossel para permitir o giro infinito
let estadoFotos = ['#D7CCC8', 'var(--primaria)', '#F5F5F5'];

window.abrirModalDetalhes = async (id) => {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-detalhes-item');
    
    const { data: item, error } = await supabase
        .from('itens')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return console.error("Erro ao buscar item:", error);

    let compradorInfo = null;
    if (isAdmin && item.id_usuario) {
        const { data: perfil } = await supabase
            .from('perfis')
            .select('nome, email, telefone')
            .eq('id', item.id_usuario)
            .single();
        compradorInfo = perfil;
    }

    renderizarConteudoModal(item, compradorInfo);
    
    overlay.style.display = 'block';
    modal.style.display = 'block';
};

// Lógica de Giro Infinito: Reorganiza o array de fotos
window.girarCarrossel = (direcao, item, comprador) => {
    if (direcao === 'esq') {
        estadoFotos.unshift(estadoFotos.pop()); // Move o último para o início
    } else {
        estadoFotos.push(estadoFotos.shift()); // Move o primeiro para o fim
    }
    // Re-renderiza o modal para atualizar as posições das cores
    renderizarConteudoModal(item, comprador);
};

function getAreaNome(id) {
    const areas = {
        1: 'Banheiro',
        2: 'Cozinha',
        3: 'Eletrodomésticos',
        4: 'Quarto',
        5: 'Área de Serviço',
        6: 'Outros'
    };
    return areas[id] || '';
}

function renderizarConteudoModal(item, comprador) {
    const modal = document.getElementById('modal-detalhes-item');
    const nomeArea = getAreaNome(item.area);
    
    // Preparar referências seguras para as funções de clique
    const itemRef = JSON.stringify(item).replace(/"/g, '&quot;');
    const compRef = comprador ? JSON.stringify(comprador).replace(/"/g, '&quot;') : 'null';

    const conteudo = `
        <button class="close" onclick="fecharTodosModais()" style="z-index: 100;">
            <i data-lucide="x"></i>
        </button>
        
        <div class="modal-layout">
            <div class="carrossel-container">
                <div class="foto-lateral" style="background: ${estadoFotos[0]}" 
                     onclick="girarCarrossel('esq', ${itemRef}, ${compRef})"></div>
                
                <div class="foto-central" style="background: ${estadoFotos[1]}"></div>
                
                <div class="foto-lateral" style="background: ${estadoFotos[2]}" 
                     onclick="girarCarrossel('dir', ${itemRef}, ${compRef})"></div>
            </div>

            <div class="modal-col-direita">
                <div style="text-align: center;">
                    ${isAdmin 
                        ? `<input type="text" id="edit-nome" class="input-titulo" value="${item.nome}" placeholder="Nome do Item">`
                        : `<h2 class="modal-titulo">${item.nome}</h2>`
                    }
                    
                    <div class="campo-valor-row">
                        <i data-lucide="dollar-sign"></i>
                        ${isAdmin 
                            ? `<input type="number" id="edit-valor" value="${item.valor}">`
                            : `<span>${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>`
                        }
                    </div>
                </div>

                ${comprador ? `
                    <div class="info-comprador">
                        <p><strong>Reservado por:</strong> ${comprador.nome}</p>
                        ${isAdmin ? `<p>${comprador.telefone || comprador.email}</p>` : ''}
                    </div>
                ` : ''}

                ${isAdmin 
                    ? `<div class="campo-admin">
                        <select id="edit-area" class="modal-select">
                            <option value="">Selecione a Área</option>
                            <option value="1" ${item.area == 1 ? 'selected' : ''}>Banheiro</option>
                            <option value="2" ${item.area == 2 ? 'selected' : ''}>Cozinha</option>
                            <option value="3" ${item.area == 3 ? 'selected' : ''}>Eletrodomésticos</option>
                            <option value="4" ${item.area == 4 ? 'selected' : ''}>Quarto</option>
                            <option value="5" ${item.area == 5 ? 'selected' : ''}>Área de Serviço</option>
                            <option value="6" ${item.area == 6 ? 'selected' : ''}>Outros</option>
                        </select>
                        <textarea id="edit-desc" placeholder="Algum detalhe?">${item.descricao || ''}</textarea>
                        <input type="text" id="edit-link" value="${item.link_compra || ''}" placeholder="Link de compra">
                       </div>`
                    : `<p class="modal-descricao" style="text-align:center">${item.descricao || ''}</p>`
                }

                <div class="modal-acoes-row">
                    <a href="${item.link_compra}" target="_blank" class="btn-acao-mini btn-loja">
                        <i data-lucide="shopping-cart"></i> Loja
                    </a>
                    
                    <button class="btn-acao-mini btn-pix-mini" onclick="exibirAviso('PIX 🤍', 'Chave PIX: seu@email.com')">
                        <i data-lucide="qr-code"></i> PIX
                    </button>

                    ${isAdmin ? `
                        <button class="btn-acao-mini btn-save-mini" onclick="salvarEdicao('${item.id}')">
                            <i data-lucide="save"></i> Salvar
                        </button>
                        <button class="btn-acao-mini btn-delete-mini" onclick="removerItem('${item.id}')">
                            <i data-lucide="trash-2"></i> Apagar
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    modal.innerHTML = conteudo;
    if (window.lucide) lucide.createIcons();
}

window.salvarEdicao = async (id) => {
    const nome = document.getElementById('edit-nome').value;
    const valor = document.getElementById('edit-valor').value;
    const areaRaw = document.getElementById('edit-area').value;
    const descricao = document.getElementById('edit-desc').value;
    const link = document.getElementById('edit-link').value;

    if (!nome || !valor) {
        return exibirAviso('Atenção 💗', 'Nome e Valor são obrigatórios.');
    }

    const { error } = await supabase
        .from('itens')
        .update({
            nome,
            valor: parseFloat(valor),
            area: areaRaw ? parseInt(areaRaw) : null,
            descricao,
            link_compra: link
        })
        .eq('id', id);

    if (!error) {
        exibirAviso('Sucesso! ✨', 'Item atualizado com sucesso!');
        fecharTodosModais();
        carregarItens();
    } else {
        exibirAviso('Erro 💔', 'Erro ao atualizar item.');
    }
};