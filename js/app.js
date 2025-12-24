var supabase = window.supabaseClient;

let usuarioLogado = null;
let isAdmin = false;
let paginaAtual = 'lista';

async function init() {
    if (window.location.hash.includes('access_token')) {
        await supabase.auth.getSession();
        window.history.replaceState(null, null, window.location.pathname);
    }

    const { data: { session } } = await supabase.auth.getSession();
    await atualizarEstado(session);
    await carregarPagina();

    supabase.auth.onAuthStateChange(async (event, session) => {
        await atualizarEstado(session);
        await carregarPagina();
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
    document.getElementById('header-app').innerHTML = headerHtml;

    if (usuarioLogado) {
        const userDisplay = document.getElementById('user-display');
        const userAvatar = document.querySelector('.user-avatar');
        const loginTrigger = document.getElementById('login-trigger');

        if (userDisplay) {
            const nomeCompleto = usuarioLogado.user_metadata.full_name || 'Convidado';
            userDisplay.innerText = nomeCompleto.split(' ')[0];
        }

        if (userAvatar) {
            const fotoUrl = usuarioLogado.user_metadata.avatar_url;
            if (fotoUrl) {
                userAvatar.innerHTML = `<img src="${fotoUrl}" alt="User" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        }

        if (loginTrigger) {
            loginTrigger.onclick = () => navegar('perfil');
        }
    }

    let caminho = 'pages/lista.html';
    if (paginaAtual === 'login') caminho = 'pages/login.html';
    if (paginaAtual === 'perfil') caminho = 'pages/perfil.html';

    const resPagina = await fetch(caminho);
    document.getElementById('main-app').innerHTML = await resPagina.text();

    if (paginaAtual === 'perfil' && usuarioLogado) {
        const pNome = document.getElementById('perfil-nome');
        const pEmail = document.getElementById('perfil-email');
        const pAvatar = document.getElementById('perfil-avatar-grande');

        if (pNome) pNome.innerText = usuarioLogado.user_metadata.full_name;
        if (pEmail) pEmail.innerText = usuarioLogado.email;
        if (pAvatar && usuarioLogado.user_metadata.avatar_url) {
            pAvatar.innerHTML = `<img src="${usuarioLogado.user_metadata.avatar_url}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
    }

    if (paginaAtual === 'lista' && typeof carregarItens === 'function') {
        carregarItens(); 
    }

    if (window.lucide) window.lucide.createIcons();
}

window.deslogar = async () => {
    try {
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        
        usuarioLogado = null;
        isAdmin = false;
        paginaAtual = 'lista';
        
        window.location.reload(); 
    } catch (error) {
        console.error("Erro ao deslogar:", error);
        window.location.reload();
    }
};

window.navegar = (pagina) => {
    paginaAtual = pagina;
    carregarPagina();
};

init();