const Modal = {
    abrir(config) {
        // Remove modal anterior se existir
        const modal = document.getElementById('modal-container');
        if (modal) modal.remove();

        const overlay = document.getElementById('modal-overlay');
        overlay.style.display = 'block';

        const html = `
            <div id="modal-container">
                <div class="modal-aviso">
                    <h3>${config.titulo || 'Aviso'}</h3>
                    <p>${config.mensagem || ''}</p>
                    <button class="submit" id="modal-confirm-btn">${config.textoBotao || 'Ok'}</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) lucide.createIcons();

        // Configura a ação do botão principal
        document.getElementById('modal-confirm-btn').onclick = () => {
            if (config.callback) config.callback();
            this.fechar();
        };
    },
    fechar() {
        var modalAviso = document.getElementById('modal-container');
        if (modalAviso) modalAviso.remove();

        var modalDetalhes = document.getElementById('modal-detalhes-item');
        if (modalDetalhes) modalDetalhes.style.display = 'none';

        var overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.style.display = 'none';

        document.body.style.overflow = '';
    }
};