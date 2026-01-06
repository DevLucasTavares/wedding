var supabase = window.supabaseClient;

var usuarioLogado = null;
var isAdmin = false;
var paginaAtual = 'home';

async function init() {
    if (window.location.hash.includes('access_token')) {
        await supabase.auth.getSession();
        window.history.replaceState(null, null, window.location.pathname);
    }

    const { data: { session } } = await supabase.auth.getSession();
    await atualizarEstado(session);
    await carregarPagina();

    supabase.auth.onAuthStateChange(function (event, session) {
        setTimeout(function () {
            atualizarEstado(session).then(function () {
                // carregarPagina();
            });
        });
    });
}

async function atualizarEstado(session) {
    usuarioLogado = session?.user || null;
    isAdmin = false;

    if (usuarioLogado) {
        const { data: perfil } = await supabase
            .from('perfis')
            .select('is_admin')
            .eq('id', usuarioLogado.id)
            .single();
        isAdmin = perfil?.is_admin || false;
    }
}

async function carregarPagina() {
        const resHeader = await fetch('pages/header.html');
        const headerHtml = await resHeader.text();

        const headerApp = document.getElementById('header-app');
        headerApp.innerHTML = headerHtml;

        const nav = headerApp.querySelector('.nav-container');
        if (paginaAtual !== 'home' && nav) {
            nav.classList.add('header-scrolled');
        }

        if (paginaAtual === 'home') {
            document.body.classList.add('bg-home');
            document.body.classList.remove('bg-content');
        } else {
            document.body.classList.remove('bg-home');
            document.body.classList.add('bg-content');
        }

        if (usuarioLogado) {
            const userDisplay = document.getElementById('user-display');
            const userIcon = document.getElementById('user-icon-container'); // ID novo
            const loginTrigger = document.getElementById('login-trigger');

            if (userDisplay) {
                const nomeCompleto = usuarioLogado.user_metadata.full_name || 'Convidado';
                userDisplay.innerText = nomeCompleto.split(' ')[0];
            }

            if (userIcon) {
                const fotoUrl = usuarioLogado.user_metadata.avatar_url;
                if (fotoUrl) {
                    userIcon.innerHTML = `<img src="${fotoUrl}" alt="User" class="user-avatar-img">`;
                } 
                // else {
                //     userIcon.innerHTML = `<i data-lucide="user" class="user-avatar-img"></i>`;
                //     lucide.createIcons(); 
                // }
            }
            
            if (loginTrigger) {
                loginTrigger.onclick = () => navegar('perfil');
            }
        }

        let caminho = 'pages/home.html';
        if (paginaAtual === 'lista') caminho = 'pages/lista.html';
        if (paginaAtual === 'login') caminho = 'pages/login.html';
        if (paginaAtual === 'perfil') caminho = 'pages/perfil.html';
        if (paginaAtual === 'carta') caminho = 'pages/carta.html';
        if (paginaAtual === 'contato') caminho = 'pages/contato.html';

        try {
            const resPagina = await fetch(caminho);
            const htmlPagina = await resPagina.text(); // A variável é criada aqui
            
            const mainApp = document.getElementById('main-app');
            if (mainApp) {
                mainApp.innerHTML = htmlPagina; // Injeta o HTML na tela
            }
        } catch (erro) {
            console.error("Erro ao carregar a página:", erro);
        }

        const resPagina = await fetch(caminho);
        const htmlPagina = await resPagina.text();
        document.getElementById('main-app').innerHTML = htmlPagina;

        if (paginaAtual === 'perfil' && usuarioLogado) {
            const pNome = document.getElementById('perfil-nome');
            const pEmail = document.getElementById('perfil-email');
            const pAvatar = document.getElementById('perfil-avatar-grande');

            if (pNome) pNome.innerText = usuarioLogado.user_metadata.full_name;
            if (pEmail) pEmail.innerText = usuarioLogado.email;
            if (pAvatar && usuarioLogado.user_metadata.avatar_url) {
                pAvatar.innerHTML = `<img src="${usuarioLogado.user_metadata.avatar_url}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else pAvatar.innerHTML = `<i data-lucide="user" style="color:var(--secundaria); width:100%; height:100%; object-fit:cover; border-radius:50%;"></i>`
        }

       if (paginaAtual === 'lista' && typeof carregarItens === 'function') {
        carregarItens(); 
    }

        if (window.lucide) window.lucide.createIcons();
}

async function usuarioJaPresenteou() {
    if (!usuarioLogado) return false;
    if (isAdmin) return true;
    try {
        const { data, error } = await supabase
            .from('itens')
            .select('id')
            .eq('id_usuario', usuarioLogado.id)
            .limit(1)
        if (error) {
            console.error("Erro ao cancelar reserva:", error);
            alert("Erro. Tente novamente.");
            return;
        }
        return data && data.length > 0;
    } catch (e) { return false; }
}

window.navegar = async (pagina) => {
    Modal.fechar();

    if (pagina === 'lista' && !usuarioLogado && !isAdmin) {
        Modal.abrir({
            titulo: "Quase lá...",
            mensagem: "Crie uma conta ou faça login para ver o que preparamos!",
            textoBotao: "Entrar",
            callback: () => realizarNavegacao('login')
        });
        return;
    }

    if (pagina === 'carta') {
        const presenteou = await usuarioJaPresenteou();
        
        if (!presenteou && !isAdmin) {
            Modal.abrir({
                titulo: "Uma mensagem surpresa!",
                mensagem: "Ela será desbloqueada após a compra de um item da nossa lista.",
                textoBotao: usuarioLogado ? "Ir para a Lista" : "Entrar",
                callback: () => realizarNavegacao(usuarioLogado ? 'lista' : 'login')
            });
            return;
        }
    }

    realizarNavegacao(pagina);
};

function realizarNavegacao(pagina) {
    paginaAtual = pagina;
    carregarPagina(); // Sua função que renderiza o conteúdo no main-app
}

//     const overlay = document.getElementById('modal-overlay');
//     const modaisGerais = document.querySelectorAll('.modal, .modal-aviso');
//     modaisGerais.forEach(m => m.style.display = 'none');
//     if(overlay) overlay.style.display = 'none';
//     document.body.classList.remove('modal-open');

//     if (pagina === 'lista' && !usuarioLogado && !isAdmin) {
//         const modal = document.getElementById('modal-bloqueio-lista');
//         if (modal && overlay) {
//             modal.style.display = 'block';
//             overlay.style.display = 'block';
//             document.body.classList.add('modal-open');
//         }
//         return;
//     }

//     if (pagina === 'carta') {
//         const presenteou = await usuarioJaPresenteou();
//         if (!presenteou && !isAdmin) {
//             const modal = document.getElementById('modal-carta-spicy');
//             const msgEl = document.getElementById('carta-spicy-msg');
//             const btnCont = document.getElementById('carta-spicy-btn-container');
//             if (modal && overlay && msgEl && btnCont) {
//                 msgEl.innerText = "Ela será desbloqueada após a compra de um item da nossa lista.";
//                 if (!usuarioLogado) {
//                     btnCont.innerHTML = `<button class="submit" onclick="navegar('login')">Entrar</button>`;
//                 } else {
//                     btnCont.innerHTML = `<button class="submit" onclick="navegar('lista')">Vamos!</button>`;
//                 }
//                 modal.style.display = 'block';
//                 overlay.style.display = 'block';
//                 document.body.classList.add('modal-open');
//             }
//             return;
//         }
//     }
//     paginaAtual = pagina;
//     carregarPagina();
// };

init();