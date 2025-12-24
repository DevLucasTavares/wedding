let lastScrollTop = 0;
const header = document.getElementById('main-header');

window.addEventListener("scroll", function() {
    let st = window.pageYOffset || document.documentElement.scrollTop;
    
    const headerElement = document.getElementById('main-header');
    if (!headerElement) return;

    if (st > lastScrollTop && st > 50) {
        headerElement.classList.add('header-hidden');
    } else {
        headerElement.classList.remove('header-hidden');
    }
    
    lastScrollTop = st;
});