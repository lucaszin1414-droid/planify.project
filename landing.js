// Animações e navegação da página de apresentação (tela inicial)
(function () {
    // Marca que o JS está ativo (as animações de entrada só se escondem se o JS funcionar)
    document.documentElement.classList.add('js');

    const hero = document.getElementById('topo');
    const nav = document.getElementById('nav-landing');
    const btnTopo = document.getElementById('btn-voltar-topo');
    const telaLogado = document.getElementById('tela-logado');

    // --- 1. Animação de entrada ao rolar (fade + subida) ---
    const elementosReveal = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observadorReveal = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visivel');
                    observadorReveal.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.15 });

        elementosReveal.forEach((el) => observadorReveal.observe(el));
    } else {
        elementosReveal.forEach((el) => el.classList.add('visivel'));
    }

    // --- 2. Barra de navegação e botão "voltar ao topo" aparecem ao rolar ---
    function atualizarAoRolar() {
        const alturaHero = hero ? hero.offsetHeight : 0;
        const rolagem = window.scrollY;

        if (nav) nav.classList.toggle('aparecer', rolagem > alturaHero - 120);
        if (btnTopo) btnTopo.classList.toggle('aparecer', rolagem > 600);
    }

    window.addEventListener('scroll', atualizarAoRolar, { passive: true });
    atualizarAoRolar();

    if (btnTopo) {
        btnTopo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 3. Destaca no menu a seção que está na tela ---
    const linksMenu = document.querySelectorAll('.nav-links a[data-secao]');
    const secoes = ['sobre', 'quem-somos', 'funcionalidades', 'contato']
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    if ('IntersectionObserver' in window && secoes.length) {
        const observadorMenu = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    linksMenu.forEach((link) => {
                        link.classList.toggle('ativo', link.dataset.secao === entrada.target.id);
                    });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });

        secoes.forEach((secao) => observadorMenu.observe(secao));
    }

    // --- 4. Botões Login/Cadastro da barra de navegação abrem os mesmos modais do topo ---
    document.querySelectorAll('[data-acao]').forEach((botao) => {
        botao.addEventListener('click', () => {
            const idAlvo = botao.dataset.acao === 'login' ? 'btn-login-header' : 'btn-cadastro-header';
            const alvo = document.getElementById(idAlvo);
            if (alvo) alvo.click();
        });
    });

    // --- 5. Ao entrar na área logada, volta a página para o topo ---
    if (telaLogado && 'MutationObserver' in window) {
        new MutationObserver(() => {
            if (telaLogado.classList.contains('ativa')) {
                window.scrollTo(0, 0);
            }
        }).observe(telaLogado, { attributes: true, attributeFilter: ['class'] });
    }
})();