let countdownAtivo = false;
let emailPendente = "";

window.toggleSenha = (idInput, idIcone) => {
    const input = document.getElementById(idInput);
    const icone = document.getElementById(idIcone);
    
    if (!input || !icone) return;
    
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const iconName = isPassword ? 'eye-off' : 'eye';
    icone.setAttribute('data-lucide', iconName);
    lucide.createIcons();
};

window.voltarAoLogin = () => {
    document.getElementById('auth-main-content').style.display = 'block';
    document.getElementById('auth-status-screen').style.display = 'none';
};

const traduzirErroAuth = (msg) => {
    if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos, verifique os dados.";
    if (msg.includes("User already registered")) return "Você já tem conta! Tenta fazer login.";
    if (msg.includes("rate limit")) return "Calma! Você tentou muitas vezes. Espera um pouco.";
    return `Erro: ${msg}`;
};

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

window.loginGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) alert("Erro Google: " + error.message);
};

window.loginManual = async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) return alert("Preencha e-mail e senha!");

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        if (error.message.includes("Email not confirmed")) {
            emailPendente = email;
            document.getElementById('auth-main-content').style.display = 'none';
            document.getElementById('auth-status-screen').style.display = 'block';
            // document.getElementById('status-message').innerText = `Enviamos um link para ${email}.\nConfirme para liberar seu acesso!`;
            document.getElementById('status-message').innerHTML = `Enviamos um link para <b>${email}</b>.<br>Confirme para liberar seu acesso!`;
        } else {
            alert(traduzirErroAuth(error.message));
        }
    } else {
        if (window.navegar) window.navegar('home');
    }
};

window.registrarManual = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const telefone = document.getElementById('reg-telefone').value;
    const senha = document.getElementById('reg-senha').value;
    const senhaConf = document.getElementById('reg-senha-confirm').value;

    const regexSenha = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (senha !== senhaConf) return alert("As senhas não batem!");
    if (!regexSenha.test(senha)) return alert("Senha fraca: use pelo menos 6 caracteres, uma letra MAIÚSCULA e um número.");

    if (!nome || !email) return alert("Preencha os campos obrigatórios!");

    const { error } = await supabase.auth.signUp({
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
        alert(traduzirErroAuth(error.message));
    } else {
        emailPendente = email;
        document.getElementById('auth-main-content').style.display = 'none';
        document.getElementById('auth-status-screen').style.display = 'block';
        // document.getElementById('status-message').innerText = "Conta criada! Agora você <b>precisa</b> confirmar seu e-mail para entrar.";
        document.getElementById('status-message').innerHTML = "Conta criada!<br>Agora <b>confirme</b> seu e-mail para entrar.";
    }
};

window.reenviarEmail = async () => {
    if (countdownAtivo) return;

    const btn = document.getElementById('btn-resend');
    const { error } = await supabase.auth.resend({ type: 'signup', email: emailPendente });

    if (error) {
        alert(traduzirErroAuth(error.message));
    } else {
        iniciarCooldown(btn);
    }
};

function iniciarCooldown(btn) {
    let tempo = 60;
    countdownAtivo = true;
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";

    const timer = setInterval(() => {
        tempo--;
        btn.innerText = `Reenviar em ${tempo}s`;
        if (tempo <= 0) {
            clearInterval(timer);
            btn.innerText = "Reenviar E-mail";
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            countdownAtivo = false;
        }
    }, 1000);
}

window.deslogar = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        if (window.navegar) window.navegar('login');
    } else {
        alert("Erro ao deslogar: " + error.message);
    }
};