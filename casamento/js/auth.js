// ALTERNAR ENTRE LOGIN E REGISTRO
window.alternarAba = (aba) => {
    const loginForm = document.getElementById('form-login');
    const registroForm = document.getElementById('form-registro');
    const tabLogin = document.getElementById('tab-login');
    const tabRegistro = document.getElementById('tab-registro');

    if (aba === 'login') {
        loginForm.style.display = 'block';
        registroForm.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegistro.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registroForm.style.display = 'block';
        tabLogin.classList.remove('active');
        tabRegistro.classList.add('active');
    }
};

// LOGIN COM GOOGLE (NOME DA FUNÇÃO IGUAL AO HTML)
window.loginGoogle = async () => {
    console.log("Iniciando Google Login...");
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) alert("Erro Google: " + error.message);
};

// LOGIN MANUAL (IDs: login-email, login-senha)
window.loginManual = async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) {
        alert("Preencha e-mail e senha!");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        alert("Erro no login: " + error.message);
    } else {
        console.log("Login realizado!");
        if (window.navegar) window.navegar('lista');
    }
};

// REGISTRO MANUAL (IDs: reg-nome, reg-email, reg-telefone, reg-senha)
window.registrarManual = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const telefone = document.getElementById('reg-telefone').value;
    const senha = document.getElementById('reg-senha').value;

    if (!nome || !email || !senha) {
        alert("Nome, E-mail e Senha são obrigatórios!");
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: senha,
        options: {
            data: {
                full_name: nome,
                phone: telefone
            }
        }
    });

    if (error) {
        alert("Erro ao registrar: " + error.message);
    } else {
        alert("Cadastro realizado! Verifique seu e-mail.");
        alternarAba('login');
    }
};

// FUNÇÃO DESLOGAR (PARA O PERFIL)
window.deslogar = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        if (window.navegar) window.navegar('login');
    } else {
        alert("Erro ao deslogar: " + error.message);
    }
};