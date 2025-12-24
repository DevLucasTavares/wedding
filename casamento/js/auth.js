const REDIRECT_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? window.location.origin
    : 'https://lucascarrarini.com/casamento/';

window.alternarAba = (aba) => {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const tabLogin = document.getElementById('tab-login');
    const tabRegistro = document.getElementById('tab-registro');

    if (aba === 'login') {
        formLogin.style.display = 'block';
        formRegistro.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegistro.classList.remove('active');
    } else {
        formLogin.style.display = 'none';
        formRegistro.style.display = 'block';
        tabLogin.classList.remove('active');
        tabRegistro.classList.add('active');
    }
};

window.registrarManual = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const telefone = document.getElementById('reg-telefone').value;
    const senha = document.getElementById('reg-senha').value;

    document.querySelectorAll('.input-group input').forEach(i => i.classList.remove('error'));

    let temErro = false;
    if (!nome) { document.getElementById('reg-nome').classList.add('error'); temErro = true; }
    if (!email) { document.getElementById('reg-email').classList.add('error'); temErro = true; }
    if (!telefone) { document.getElementById('reg-telefone').classList.add('error'); temErro = true; }
    if (!senha) { document.getElementById('reg-senha').classList.add('error'); temErro = true; }

    if (temErro) return;

    const { error } = await _supabase.auth.signUp({
        email: email,
        password: senha,
        options: { 
            emailRedirectTo: REDIRECT_URL,
            data: { 
                full_name: nome,
                phone: telefone 
            } 
        }
    });

    if (error) {
        alert(error.message);
    } else {
        alert("Sucesso! Verifique seu e-mail.");
        alternarAba('login');
    }
};

window.loginManual = async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    const { error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) alert(error.message);
};

window.loginGoogle = async () => {
    await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
            redirectTo: REDIRECT_URL
        }
    });
};