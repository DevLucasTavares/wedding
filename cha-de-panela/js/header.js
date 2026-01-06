let lastScroll = 0;

window.addEventListener("scroll", () => {
    const header = document.querySelector('.nav-container');
    
    if (!header) return;

    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    const naHome = (window.paginaAtual === 'home');

    if (!naHome || currentScroll > 50) {
        header.classList.add('header-scrolled');
    } else {
        header.classList.remove('header-scrolled');
    }

    if (window.innerWidth <= 768) {
        if (currentScroll > lastScroll && currentScroll > 80) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
    } else {
        header.classList.remove('header-hidden');
    }

    lastScroll = currentScroll <= 0 ? 0 : currentScroll;
}, { passive: true });