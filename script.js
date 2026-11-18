// Referências das Telas
const telaInicial = document.getElementById('tela-inicial');
const telaLogado = document.getElementById('tela-logado');

// Referências dos Modais
const modalCadastro = document.getElementById('modal-cadastro');
const modalLogin = document.getElementById('modal-login');

// Botões do Header Inicial
const btnCadastroHeader = document.getElementById('btn-cadastro-header');
const btnLoginHeader = document.getElementById('btn-login-header');

// Botões de Fechar Modal
const fecharCadastro = document.getElementById('fechar-cadastro');
const fecharLogin = document.getElementById('fechar-login');

// Formulários
const formCadastro = document.getElementById('form-cadastro');
const formLogin = document.getElementById('form-login');

// Menu Hambúrguer e Opções
const btnMenuHamburguer = document.getElementById('btn-menu-hamburguer');
const dropdownMenu = document.getElementById('dropdown-menu');
const btnTrocarConta = document.getElementById('btn-trocar-conta');
const btnConfiguracoes = document.getElementById('btn-configuracoes');
const btnDesconectar = document.getElementById('btn-desconectar');
const btnPainelAdmin = document.getElementById('btn-painel-admin');
const btnSuporte = document.getElementById('btn-suporte');
const abaBtnAdmin = document.getElementById('aba-btn-admin');

// Códigos de acesso válidos do Administrador
const CODIGOS_ADMIN_VALIDOS = ["PLANIFY-ADMIN-2026-SECURE", "PLANIFY-ADM-2026-SECURE"];

// --- PERSISTÊNCIA DE SESSÃO ---
let usuarioLogadoEmail = localStorage.getItem('planify_sessao_ativa') || '';
let usuarioLogadoNome = localStorage.getItem('planify_nome_ativo') || '';

// --- LÓGICA DO SININHO E CENTRAL DE NOTIFICAÇÕES (NUVEM + LOCAL) ---
const btnSininho = document.getElementById('btn-sininho');
const dropdownNotificacoes = document.getElementById('dropdown-notificacoes');
const badgeNotificacao = document.getElementById('badge-notificacao');
const listaNotificacoes = document.getElementById('lista-notificacoes');
const btnLimparNotifs = document.getElementById('btn-limpar-notifs');

let listaHistoricoNotifs = [];

if (btnSininho && dropdownNotificacoes) {
    btnSininho.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdownMenu) dropdownMenu.classList.remove('mostrar');
        dropdownNotificacoes.classList.toggle('mostrar');
        marcarNotificacoesComoLidas();
    });
}

if (btnLimparNotifs) {
    btnLimparNotifs.addEventListener('click', () => {
        listaHistoricoNotifs = [];
        renderizarPainelNotificacoes();
    });
}

async function carregarAvisosGlobaisDaNuvem() {
    if (!window.firebaseDB) return;
    const { db, collection, getDocs } = window.firebaseDB;
    try {
        const snapshot = await getDocs(collection(db, "avisos_globais"));
        const avisosNuvem = [];
        snapshot.forEach((docSnap) => {
            avisosNuvem.push({ id: docSnap.id, ...docSnap.data() });
        });
        avisosNuvem.sort((a, b) => b.timestamp - a.timestamp);
        listaHistoricoNotifs = avisosNuvem;
        renderizarPainelNotificacoes();
    } catch (e) {
        console.error("Erro ao carregar avisos:", e);
    }
}

function renderizarPainelNotificacoes() {
    if (!listaNotificacoes) return;
    listaNotificacoes.innerHTML = '';

    const lidasLocal = JSON.parse(localStorage.getItem('planify_notifs_lidas') || '[]');
    const naoLidas = listaHistoricoNotifs.filter(n => !lidasLocal.includes(String(n.id))).length;

    if (badgeNotificacao) {
        if (naoLidas > 0) {
            badgeNotificacao.textContent = naoLidas;
            badgeNotificacao.classList.remove('oculta');
        } else {
            badgeNotificacao.classList.add('oculta');
        }
    }

    if (listaHistoricoNotifs.length === 0) {
        listaNotificacoes.innerHTML = '<p class="notif-vazia">Nenhuma notificação nova</p>';
        return;
    }

    listaHistoricoNotifs.forEach(notif => {
        const item = document.createElement('div');
        item.classList.add('item-notificacao', 'alerta-pagamento');
        item.innerHTML = `
            <strong>📢 ${escapeXML(notif.titulo)}</strong>
            <span>${escapeXML(String(notif.mensagem || notif.valor || ''))} — ${notif.horario || ''}</span>
        `;
        listaNotificacoes.appendChild(item);
    });
}

function marcarNotificacoesComoLidas() {
    const ids = listaHistoricoNotifs.map(n => String(n.id));
    localStorage.setItem('planify_notifs_lidas', JSON.stringify(ids));
    if (badgeNotificacao) badgeNotificacao.classList.add('oculta');
}

const boasVindasTitulo = document.getElementById('boas-vindas-titulo');

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let tipoTransacaoAtual = 'entrada';
const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const diasAbreviados = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const nomesDosMeses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const HORA_INICIAL = 7;
const TOTAL_HORAS = 16;

function adicionarDias(data, quantidade) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate() + quantidade);
}

function inicioDaSemana(data) {
    const deslocamento = (data.getDay() + 6) % 7;
    return adicionarDias(data, -deslocamento);
}

function chaveDia(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function mesmoDia(a, b) {
    return chaveDia(a) === chaveDia(b);
}

function formatarDataCurta(data) {
    return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function formatarDataCompleta(data) {
    return `${formatarDataCurta(data)}/${data.getFullYear()}`;
}

let semanaSelecionada = inicioDaSemana(new Date());
let mesExibido = mesDaSemana(semanaSelecionada);
let modoAgenda = 'semanal';
let diaAtualChave = chaveDia(new Date());

function mesDaSemana(inicioSemana) {
    const quinta = adicionarDias(inicioSemana, 3);
    return new Date(quinta.getFullYear(), quinta.getMonth(), 1);
}

// --- DADOS NA NUVEM (FIRESTORE) ---
let agendaPorSemana = {};
let financeiroPorSemana = {};
let listaLembretes = [];

async function carregarDadosDoUsuarioDaNuvem() {
    if (!window.firebaseDB || !usuarioLogadoEmail) return;
    const { db, doc, getDoc } = window.firebaseDB;

    try {
        const docRef = doc(db, "dados_usuarios", usuarioLogadoEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const dados = docSnap.data();
            agendaPorSemana = dados.agenda || {};
            financeiroPorSemana = dados.financeiro || {};
            listaLembretes = dados.lembretes || [];
        } else {
            agendaPorSemana = {};
            financeiroPorSemana = {};
            listaLembretes = [];
        }
        renderizarSemana();
        renderizarLembretes();
    } catch (erro) {
        console.error("Erro ao carregar dados do utilizador:", erro);
    }
}

let timeoutSalvarNuvem = null;
function sincronizarDadosComNuvem() {
    if (!window.firebaseDB || !usuarioLogadoEmail) return;
    clearTimeout(timeoutSalvarNuvem);
    timeoutSalvarNuvem = setTimeout(async () => {
        const { db, doc, setDoc } = window.firebaseDB;
        try {
            await setDoc(doc(db, "dados_usuarios", usuarioLogadoEmail), {
                agenda: agendaPorSemana,
                financeiro: financeiroPorSemana,
                lembretes: listaLembretes,
                ultimaAtualizacao: new Date().toISOString()
            }, { merge: true });
        } catch (erro) {
            console.error("Erro ao guardar na nuvem:", erro);
        }
    }, 600);
}

function textoAgenda(chaveSemana, hIndex, diaIndex) {
    const semana = agendaPorSemana[chaveSemana];
    return (semana && semana[`${hIndex}-${diaIndex}`]) || '';
}

function salvarTextoAgenda(hIndex, diaIndex, texto) {
    const chave = chaveDia(semanaSelecionada);
    const campo = `${hIndex}-${diaIndex}`;

    if (texto) {
        if (!agendaPorSemana[chave]) agendaPorSemana[chave] = {};
        agendaPorSemana[chave][campo] = texto;
    } else if (agendaPorSemana[chave]) {
        delete agendaPorSemana[chave][campo];
        if (Object.keys(agendaPorSemana[chave]).length === 0) delete agendaPorSemana[chave];
    }
    sincronizarDadosComNuvem();
}

function itemFinanceiro(chaveSemana, hIndex, diaIndex) {
    const semana = financeiroPorSemana[chaveSemana];
    return (semana && semana[`${hIndex}-${diaIndex}`]) || { valor: 0, tipo: 'entrada' };
}

// --- MODAIS DE CADASTRO E LOGIN ---
function abrirModal(acao) {
    if (acao === 'cadastro' && modalCadastro) {
        modalCadastro.style.display = 'block';
    } else if (acao === 'login' && modalLogin) {
        modalLogin.style.display = 'block';
    }
}

// Delegação: funciona tanto nos botões do menu quanto nos botões do cabeçalho.
document.addEventListener('click', (event) => {
    const botaoAcao = event.target.closest('[data-acao]');
    if (!botaoAcao) return;

    const acao = botaoAcao.dataset.acao;
    if (acao === 'login' || acao === 'cadastro') {
        event.preventDefault();
        abrirModal(acao);
    }
});

// Compatibilidade com botões antigos que não tenham data-acao.
if (btnCadastroHeader && !btnCadastroHeader.hasAttribute('data-acao')) {
    btnCadastroHeader.addEventListener('click', () => abrirModal('cadastro'));
}
if (btnLoginHeader && !btnLoginHeader.hasAttribute('data-acao')) {
    btnLoginHeader.addEventListener('click', () => abrirModal('login'));
}

if (fecharCadastro && modalCadastro) {
    fecharCadastro.addEventListener('click', () => modalCadastro.style.display = 'none');
}
if (fecharLogin && modalLogin) {
    fecharLogin.addEventListener('click', () => modalLogin.style.display = 'none');
}

window.addEventListener('click', (event) => {
    if (modalCadastro && event.target === modalCadastro) modalCadastro.style.display = 'none';
    if (modalLogin && event.target === modalLogin) modalLogin.style.display = 'none';
});

// --- CADASTRO NO FIREBASE ---
if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.firebaseDB) return alert("A aguardar ligação com a nuvem...");

        const usuario = document.getElementById('cad-usuario').value.trim();
        const email = document.getElementById('cad-email').value.trim().toLowerCase();
        const senha = document.getElementById('cad-senha').value;

        const { db, doc, getDoc, setDoc } = window.firebaseDB;
        try {
            const userRef = doc(db, "usuarios", email);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                alert('Este e-mail já está registado!');
                return;
            }

            await setDoc(userRef, {
                usuario,
                email,
                senha,
                criadoEm: new Date().toISOString()
            });

            alert('Cadastro realizado na nuvem com sucesso! Agora podes fazer o login.');
            formCadastro.reset();
            modalCadastro.style.display = 'none';
        } catch (erro) {
            alert('Erro ao cadastrar: ' + erro.message);
        }
    });
}

// --- LOGIN NO FIREBASE ---
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.firebaseDB) return alert("A aguardar ligação com a nuvem...");

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const senha = document.getElementById('login-senha').value;

        const { db, doc, getDoc } = window.firebaseDB;
        try {
            const userRef = doc(db, "usuarios", email);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                alert('Utilizador não encontrado! Faz o cadastro primeiro.');
                return;
            }

            const usuarioObj = userSnap.data();
            if (usuarioObj.senha === senha) {
                formLogin.reset();
                modalLogin.style.display = 'none';

                usuarioLogadoNome = usuarioObj.usuario;
                usuarioLogadoEmail = email;
                localStorage.setItem('planify_sessao_ativa', email);
                localStorage.setItem('planify_nome_ativo', usuarioObj.usuario);

                await ativarSessaoLogada();
            } else {
                alert('Senha incorreta! Tenta novamente.');
            }
        } catch (erro) {
            alert('Erro ao iniciar sessão: ' + erro.message);
        }
    });
}

async function ativarSessaoLogada() {
    if (boasVindasTitulo) boasVindasTitulo.innerText = `Bem-vindo(a), ${usuarioLogadoNome}!`;
    if (telaInicial) telaInicial.classList.remove('ativa');
    if (telaLogado) telaLogado.classList.add('ativa');
    await carregarDadosDoUsuarioDaNuvem();
    await carregarAvisosGlobaisDaNuvem();
}

// --- MENU HAMBÚRGUER ---
if (btnMenuHamburguer && dropdownMenu) {
    btnMenuHamburguer.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdownNotificacoes) dropdownNotificacoes.classList.remove('mostrar');
        dropdownMenu.classList.toggle('mostrar');
    });
}

window.addEventListener('click', () => {
    if (dropdownMenu && dropdownMenu.classList.contains('mostrar')) {
        dropdownMenu.classList.remove('mostrar');
    }
});

if (btnTrocarConta) {
    btnTrocarConta.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('mostrar');
        encerrarSessao();
        if (modalLogin) modalLogin.style.display = 'block';
    });
}

if (btnConfiguracoes) {
    btnConfiguracoes.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('mostrar');
        alert('Área de configurações em desenvolvimento.');
    });
}

if (btnDesconectar) {
    btnDesconectar.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('mostrar');
        encerrarSessao();
    });
}

function encerrarSessao() {
    localStorage.removeItem('planify_sessao_ativa');
    localStorage.removeItem('planify_nome_ativo');
    usuarioLogadoEmail = '';
    usuarioLogadoNome = '';
    if (abaBtnAdmin) abaBtnAdmin.style.display = 'none';
    if (telaLogado) telaLogado.classList.remove('ativa');
    if (telaInicial) telaInicial.classList.add('ativa');
}

// SUPORTE
if (btnSuporte) {
    btnSuporte.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('mostrar');
        window.location.href = "mailto:projetoplanify@gmail.com?subject=Suporte%20PlaniFy";
    });
}

// PAINEL ADMIN PROTEGIDO (CONECTADO AO FIRESTORE)
if (btnPainelAdmin) {
    btnPainelAdmin.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('mostrar');
        const codigoDigitado = prompt("Digite o código de acesso administrativo:")?.trim();

        if (CODIGOS_ADMIN_VALIDOS.includes(codigoDigitado)) {
            if (abaBtnAdmin) abaBtnAdmin.style.display = 'inline-block';

            document.querySelectorAll('.btn-aba').forEach(b => b.classList.remove('ativa'));
            document.querySelectorAll('.conteudo-aba').forEach(c => c.classList.remove('ativa'));

            const abaAdmin = document.getElementById('aba-admin');
            if (abaAdmin) {
                abaAdmin.classList.add('ativa');
                if (abaBtnAdmin) abaBtnAdmin.classList.add('ativa');
                atualizarMetricasAdmin();
            }
        } else if (codigoDigitado !== null) {
            alert("Código de acesso incorreto!");
        }
    });
}

async function atualizarMetricasAdmin() {
    if (!window.firebaseDB) return;
    const { db, collection, getDocs } = window.firebaseDB;

    const corpoTabela = document.getElementById('admin-corpo-tabela-usuarios');
    if (corpoTabela) corpoTabela.innerHTML = '<tr><td colspan="3" style="text-align:center;">A carregar dados da nuvem...</td></tr>';

    try {
        const usersSnap = await getDocs(collection(db, "usuarios"));
        const dadosSnap = await getDocs(collection(db, "dados_usuarios"));

        let totalUsuarios = 0;
        let registrosGlobais = 0;
        const listaUsuarios = [];

        usersSnap.forEach((docSnap) => {
            totalUsuarios++;
            listaUsuarios.push(docSnap.data());
        });

        // Soma apenas a contagem de registos para preservar a privacidade total
        dadosSnap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.agenda) {
                Object.values(d.agenda).forEach(sem => { registrosGlobais += Object.keys(sem).length; });
            }
            if (d.financeiro) {
                Object.values(d.financeiro).forEach(sem => { registrosGlobais += Object.keys(sem).length; });
            }
        });

        document.getElementById('admin-total-usuarios').textContent = totalUsuarios;
        document.getElementById('admin-usuarios-logados').textContent = totalUsuarios > 0 ? `${totalUsuarios} na base` : '0';
        document.getElementById('admin-registros-hoje').textContent = registrosGlobais;

        if (corpoTabela) {
            corpoTabela.innerHTML = '';
            if (listaUsuarios.length === 0) {
                corpoTabela.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #a3c1ad;">Nenhum utilizador registado ainda.</td></tr>';
            } else {
                listaUsuarios.forEach(u => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${escapeXML(u.usuario)}</td>
                        <td>${escapeXML(u.email)}</td>
                        <td>
                            <button type="button" onclick="adminExcluirConta('${escapeXML(u.email)}')" style="padding: 4px 8px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Excluir</button>
                        </td>
                    `;
                    corpoTabela.appendChild(tr);
                });
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar métricas admin:", erro);
    }
}  

window.adminExcluirConta = async function(emailUsuario) {
    if (!window.firebaseDB) return;
    if (confirm(`Tens a certeza que desejas excluir a conta de ${emailUsuario} da nuvem?`)) {
        const { db, doc, deleteDoc } = window.firebaseDB;
        try {
            await deleteDoc(doc(db, "usuarios", emailUsuario));
            await deleteDoc(doc(db, "dados_usuarios", emailUsuario));
            alert('Conta removida da nuvem com sucesso.');
            atualizarMetricasAdmin();
        } catch (e) {
            alert('Erro ao excluir conta: ' + e.message);
        }
    }
};

// Disparar aviso global na nuvem para todos os utilizadores
const formAdminAviso = document.getElementById('form-admin-aviso');
if (formAdminAviso) {
    formAdminAviso.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.firebaseDB) return;

        const titulo = document.getElementById('admin-aviso-titulo').value.trim();
        const texto = document.getElementById('admin-aviso-texto').value.trim();
        if (!titulo || !texto) return;

        const { db, doc, setDoc } = window.firebaseDB;
        const idAviso = String(Date.now());

        try {
            await setDoc(doc(db, "avisos_globais", idAviso), {
                titulo: `[AVISO ADMIN] ${titulo}`,
                mensagem: texto,
                horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
            });

            formAdminAviso.reset();
            alert('Aviso global publicado na nuvem! Aparecerá no sininho de todos os utilizadores.');
            await carregarAvisosGlobaisDaNuvem();
        } catch (erro) {
            alert('Erro ao publicar aviso: ' + erro.message);
        }
    });
}

// Botão de Backup Geral em JSON (da nuvem)
const btnAdminBackup = document.getElementById('btn-admin-backup');
if (btnAdminBackup) {
    btnAdminBackup.addEventListener('click', async () => {
        if (!window.firebaseDB) return;
        const { db, collection, getDocs } = window.firebaseDB;
        const usersSnap = await getDocs(collection(db, "usuarios"));
        const backup = [];
        usersSnap.forEach(d => backup.push({ email: d.id, usuario: d.data().usuario, criadoEm: d.data().criadoEm }));

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PlaniFy_Backup_Usuarios_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// --- LÓGICA DE ABAS ---
const botoesAba = document.querySelectorAll('.btn-aba');
const conteudosAba = document.querySelectorAll('.conteudo-aba');

botoesAba.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesAba.forEach(btn => btn.classList.remove('ativa'));
        conteudosAba.forEach(conteudo => conteudo.classList.remove('ativa'));

        botao.classList.add('ativa');
        const abaId = botao.getAttribute('data-aba');
        const conteudoAlvo = document.getElementById(abaId);
        if (conteudoAlvo) conteudoAlvo.classList.add('ativa');

        if (abaId === 'aba-financeiro') {
            atualizarEspelhamentoEBalancos();
            atualizarNotaAoVivo();
            const painelResumo = document.getElementById('visao-resumo-financeiro');
            if (painelResumo && painelResumo.classList.contains('ativa')) atualizarResumoSemanal();
        } else if (abaId === 'aba-lembretes') {
            renderizarLembretes();
        } else if (abaId === 'aba-admin') {
            atualizarMetricasAdmin();
        }
    });
});

// --- TABELAS E RESTANTE DA INTERFACE ---
function atualizarCabecalhosDatas() {
    const seletores = ['#aba-organizacao thead th', '#visao-grade-financeira thead th'];
    const hoje = new Date();

    seletores.forEach(seletor => {
        document.querySelectorAll(seletor).forEach((th, indice) => {
            if (indice === 0) return;
            const data = adicionarDias(semanaSelecionada, indice - 1);
            th.innerHTML = `${diasDaSemana[indice - 1]}<span class="data-cabecalho">${formatarDataCurta(data)}</span>`;
            th.classList.toggle('coluna-hoje-cabecalho', mesmoDia(data, hoje));
        });
    });
}

function gerarTabelaAgenda() {
    const corpoTabela = document.getElementById('corpo-tabela-agenda');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    const chave = chaveDia(semanaSelecionada);
    const hoje = new Date();

    for (let hIndex = 0; hIndex < TOTAL_HORAS; hIndex++) {
        const hora = hIndex + HORA_INICIAL;
        const tr = document.createElement('tr');
        const tdHorario = document.createElement('td');
        tdHorario.textContent = hora < 10 ? `0${hora}:00` : `${hora}:00`;
        tdHorario.classList.add('coluna-horario');
        tr.appendChild(tdHorario);

        for (let dia = 0; dia < 7; dia++) {
            const tdDia = document.createElement('td');
            tdDia.contentEditable = "true";
            tdDia.classList.add('celula-agenda');
            tdDia.textContent = textoAgenda(chave, hIndex, dia);

            if (mesmoDia(adicionarDias(semanaSelecionada, dia), hoje)) tdDia.classList.add('coluna-hoje');

            tdDia.addEventListener('input', () => {
                const texto = tdDia.innerText.trim();
                salvarTextoAgenda(hIndex, dia, texto);
                atualizarAtividadeEspelhada(hIndex, dia, texto);
                if (modoAgenda === 'mensal') atualizarCalendario();
                atualizarNotaAoVivo();
            });

            tr.appendChild(tdDia);
        }
        corpoTabela.appendChild(tr);
    }
}

function gerarTabelaFinanceira() {
    const corpoTabela = document.getElementById('corpo-tabela-financeira');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    const chave = chaveDia(semanaSelecionada);
    const hoje = new Date();

    for (let hIndex = 0; hIndex < TOTAL_HORAS; hIndex++) {
        const hora = hIndex + HORA_INICIAL;
        const tr = document.createElement('tr');
        const tdHorario = document.createElement('td');
        tdHorario.textContent = hora < 10 ? `0${hora}:00` : `${hora}:00`;
        tdHorario.classList.add('coluna-horario');
        tr.appendChild(tdHorario);

        for (let dia = 0; dia < 7; dia++) {
            const td = document.createElement('td');
            if (mesmoDia(adicionarDias(semanaSelecionada, dia), hoje)) td.classList.add('coluna-hoje');

            const container = document.createElement('div');
            container.classList.add('celula-financeira-container');

            const spanAtividade = document.createElement('span');
            spanAtividade.classList.add('atividade-info-financeiro');
            spanAtividade.id = `ativ-fin-${hIndex}-${dia}`;
            spanAtividade.textContent = textoAgenda(chave, hIndex, dia) || '-';

            const inputValor = document.createElement('input');
            inputValor.type = 'number';
            inputValor.step = '0.01';
            inputValor.placeholder = 'R$ 0,00';
            inputValor.classList.add('input-valor-financeiro');

            const item = itemFinanceiro(chave, hIndex, dia);
            if (item.valor > 0) {
                inputValor.value = item.valor;
                inputValor.classList.add(item.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida');
            }

            const aoMudarValor = () => salvarValorFinanceiro(hIndex, dia, parseFloat(inputValor.value) || 0, inputValor);
            inputValor.addEventListener('input', aoMudarValor);
            inputValor.addEventListener('change', aoMudarValor);

            container.appendChild(spanAtividade);
            container.appendChild(inputValor);
            td.appendChild(container);
            tr.appendChild(td);
        }
        corpoTabela.appendChild(tr);
    }
    gerarLinhaBalancoDiario();
    calcularBalancos();
}

function gerarLinhaBalancoDiario() {
    const linhaBalanco = document.getElementById('linha-balanco-diario');
    if (!linhaBalanco) return;
    linhaBalanco.innerHTML = '<td><strong>Balanço do Dia</strong></td>';
    const hoje = new Date();

    for (let dia = 0; dia < 7; dia++) {
        const tdBalanco = document.createElement('td');
        tdBalanco.id = `balanco-dia-${dia}`;
        tdBalanco.style.fontWeight = 'bold';
        tdBalanco.textContent = 'R$ 0,00';
        if (mesmoDia(adicionarDias(semanaSelecionada, dia), hoje)) tdBalanco.classList.add('coluna-hoje');
        linhaBalanco.appendChild(tdBalanco);
    }
}  

const btnsTipoTransacao = document.querySelectorAll('.btn-tipo-transacao');
btnsTipoTransacao.forEach(btn => {
    btn.addEventListener('click', () => {
        btnsTipoTransacao.forEach(b => b.classList.remove('ativa'));
        btn.classList.add('ativa');
        tipoTransacaoAtual = btn.getAttribute('data-tipo');
    });
});

const btnsVisao = document.querySelectorAll('.btn-visao');
btnsVisao.forEach(btn => {
    btn.addEventListener('click', () => {
        btnsVisao.forEach(b => b.classList.remove('ativa'));
        btn.classList.add('ativa');
        const visao = btn.getAttribute('data-visao');
        const painelGrade = document.getElementById('visao-grade-financeira');
        const painelResumo = document.getElementById('visao-resumo-financeiro');

        if (visao === 'grade') {
            if (painelGrade) painelGrade.classList.add('ativa');
            if (painelResumo) painelResumo.classList.remove('ativa');
        } else {
            if (painelGrade) painelGrade.classList.remove('ativa');
            if (painelResumo) painelResumo.classList.add('ativa');
            atualizarResumoSemanal();
        }
    });
});

function salvarValorFinanceiro(hIndex, diaIndex, valor, inputElement) {
    const chave = chaveDia(semanaSelecionada);
    const campo = `${hIndex}-${diaIndex}`;
    if (!financeiroPorSemana[chave]) financeiroPorSemana[chave] = {};

    if (valor <= 0) {
        delete financeiroPorSemana[chave][campo];
        inputElement.classList.remove('valor-entrada', 'valor-saida');
    } else {
        financeiroPorSemana[chave][campo] = { valor, tipo: tipoTransacaoAtual };
        inputElement.classList.toggle('valor-entrada', tipoTransacaoAtual === 'entrada');
        inputElement.classList.toggle('valor-saida', tipoTransacaoAtual !== 'entrada');
    }
    if (Object.keys(financeiroPorSemana[chave]).length === 0) delete financeiroPorSemana[chave];
    sincronizarDadosComNuvem();
    calcularBalancos();
    atualizarNotaAoVivo();
}

function atualizarAtividadeEspelhada(hIndex, diaIndex, texto) {
    const span = document.getElementById(`ativ-fin-${hIndex}-${diaIndex}`);
    if (span) span.textContent = texto !== '' ? texto : '-';
}

function atualizarEspelhamentoEBalancos() {
    const chave = chaveDia(semanaSelecionada);
    for (let hIndex = 0; hIndex < TOTAL_HORAS; hIndex++) {
        for (let dia = 0; dia < 7; dia++) {
            atualizarAtividadeEspelhada(hIndex, dia, textoAgenda(chave, hIndex, dia));
        }
    }
    calcularBalancos();
}

function calcularBalancos() {
    const dados = financeiroPorSemana[chaveDia(semanaSelecionada)] || {};
    let totalEntradasGeral = 0;
    let totalSaidasGeral = 0;

    for (let dia = 0; dia < 7; dia++) {
        let balancoDia = 0;
        for (let hIndex = 0; hIndex < TOTAL_HORAS; hIndex++) {
            const item = dados[`${hIndex}-${dia}`];
            if (item && item.valor > 0) {
                if (item.tipo === 'entrada') {
                    balancoDia += item.valor;
                    totalEntradasGeral += item.valor;
                } else {
                    balancoDia -= item.valor;
                    totalSaidasGeral += item.valor;
                }
            }
        }

        const tdBalanco = document.getElementById(`balanco-dia-${dia}`);
        if (tdBalanco) {
            tdBalanco.textContent = `R$ ${balancoDia.toFixed(2)}`;
            tdBalanco.style.color = balancoDia > 0 ? '#2ecc71' : (balancoDia < 0 ? '#e74c3c' : '#ffffff');
        }
    }

    const resEntradas = document.getElementById('resumo-total-entradas');
    const resSaidas = document.getElementById('resumo-total-saidas');
    const resBalanco = document.getElementById('resumo-balanco-geral');
    if (resEntradas) resEntradas.textContent = `R$ ${totalEntradasGeral.toFixed(2)}`;
    if (resSaidas) resSaidas.textContent = `R$ ${totalSaidasGeral.toFixed(2)}`;

    const balancoGeral = totalEntradasGeral - totalSaidasGeral;
    if (resBalanco) {
        resBalanco.textContent = `R$ ${balancoGeral.toFixed(2)}`;
        resBalanco.style.color = balancoGeral >= 0 ? '#2ecc71' : '#e74c3c';
    }
}

function atualizarResumoSemanal() {
    const listaDetalhes = document.getElementById('detalhes-lista-financeira');
    if (!listaDetalhes) return;
    listaDetalhes.innerHTML = '';
    let encontrouTransacao = false;
    const chave = chaveDia(semanaSelecionada);

    for (let dia = 0; dia < 7; dia++) {
        const dataDoDia = adicionarDias(semanaSelecionada, dia);
        for (let hIndex = 0; hIndex < TOTAL_HORAS; hIndex++) {
            const item = itemFinanceiro(chave, hIndex, dia);
            if (item.valor > 0) {
                encontrouTransacao = true;
                const horaText = (hIndex + HORA_INICIAL) < 10 ? `0${hIndex + HORA_INICIAL}:00` : `${hIndex + HORA_INICIAL}:00`;
                const nomeAtividade = textoAgenda(chave, hIndex, dia) || 'Sem nome';
                const cor = item.tipo === 'entrada' ? '#2ecc71' : '#e74c3c';
                const sinal = item.tipo === 'entrada' ? '+' : '-';

                const divItem = document.createElement('div');
                divItem.classList.add('item-transacao-detalhe');
                divItem.innerHTML = `
                    <span><strong>${diasDaSemana[dia]} ${formatarDataCurta(dataDoDia)} (${horaText})</strong> - ${escapeXML(nomeAtividade)}</span>
                    <span style="color: ${cor};"><strong>${sinal} R$ ${item.valor.toFixed(2)}</strong></span>
                `;
                listaDetalhes.appendChild(divItem);
            }
        }
    }

    if (!encontrouTransacao) {
        listaDetalhes.innerHTML = '<p style="text-align: center; color: #aaaaaa; padding: 10px;">Nenhuma movimentação lançada nesta semana.</p>';
    }
}

function irParaSemana(dataQualquer) {
    semanaSelecionada = inicioDaSemana(dataQualquer);
    mesExibido = mesDaSemana(semanaSelecionada);
    renderizarSemana();
}

function selecionarSemanaNoCalendario(inicioSemana) {
    semanaSelecionada = inicioDaSemana(inicioSemana);
    definirModoAgenda('semanal');
    renderizarSemana();
}

function descreverSemana() {
    const fim = adicionarDias(semanaSelecionada, 6);
    const mudaDeAno = semanaSelecionada.getFullYear() !== fim.getFullYear();
    const inicioTexto = mudaDeAno ? formatarDataCompleta(semanaSelecionada) : formatarDataCurta(semanaSelecionada);
    const titulo = `Semana de ${inicioTexto} a ${formatarDataCompleta(fim)}`;
    const diferenca = Math.round((semanaSelecionada - inicioDaSemana(new Date())) / (7 * 24 * 60 * 60 * 1000));
    let subtitulo = diferenca === 0 ? 'Semana atual' : (diferenca === 1 ? 'Próxima semana' : (diferenca === -1 ? 'Semana passada' : (diferenca > 1 ? `Daqui a ${diferenca} semanas` : `Há ${Math.abs(diferenca)} semanas`)));
    return { titulo, subtitulo };
}

function atualizarNavegadoresSemana() {
    const { titulo, subtitulo } = descreverSemana();
    document.querySelectorAll('.semana-titulo').forEach(el => el.textContent = titulo);
    document.querySelectorAll('.semana-sub').forEach(el => el.textContent = subtitulo);
}

function atualizarCalendario() {
    const grade = document.getElementById('calendario-grade');
    const tituloMes = document.getElementById('titulo-mes');
    if (!grade || !tituloMes) return;

    const ano = mesExibido.getFullYear();
    const mes = mesExibido.getMonth();
    tituloMes.textContent = `${nomesDosMeses[mes]} de ${ano}`;
    grade.innerHTML = '';

    const cabecalho = document.createElement('div');
    cabecalho.classList.add('calendario-dias-semana');
    diasAbreviados.forEach(nome => {
        const span = document.createElement('span');
        span.textContent = nome;
        cabecalho.appendChild(span);
    });
    grade.appendChild(cabecalho);

    const ultimoDoMes = new Date(ano, mes + 1, 0);
    const chaveSelecionada = chaveDia(semanaSelecionada);
    const hoje = new Date();
    let inicioLinha = inicioDaSemana(new Date(ano, mes, 1));

    while (inicioLinha <= ultimoDoMes) {
        const inicioDestaLinha = inicioLinha;
        const chaveLinha = chaveDia(inicioDestaLinha);
        const anotacoes = agendaPorSemana[chaveLinha] || {};
        const camposPreenchidos = Object.keys(anotacoes);

        const linha = document.createElement('div');
        linha.classList.add('calendario-semana');
        if (chaveLinha === chaveSelecionada) linha.classList.add('selecionada');

        for (let d = 0; d < 7; d++) {
            const data = adicionarDias(inicioDestaLinha, d);
            const celula = document.createElement('div');
            celula.classList.add('calendario-dia');
            if (data.getMonth() !== mes) celula.classList.add('fora-do-mes');
            if (mesmoDia(data, hoje)) celula.classList.add('hoje');
            if (camposPreenchidos.some(campo => campo.endsWith(`-${d}`))) celula.classList.add('tem-atividade');

            const numero = document.createElement('span');
            numero.textContent = data.getDate();
            celula.appendChild(numero);
            linha.appendChild(celula);
        }

        linha.addEventListener('click', () => selecionarSemanaNoCalendario(inicioDestaLinha));
        grade.appendChild(linha);
        inicioLinha = adicionarDias(inicioLinha, 7);
    }
}

function renderizarSemana() {
    atualizarCabecalhosDatas();
    gerarTabelaAgenda();
    gerarTabelaFinanceira();
    atualizarNavegadoresSemana();
    atualizarCalendario();

    const painelResumo = document.getElementById('visao-resumo-financeiro');
    if (painelResumo && painelResumo.classList.contains('ativa')) atualizarResumoSemanal();

    atualizarNotaAoVivo();
}

document.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-nav]');
    if (!botao) return;

    const acao = botao.dataset.nav;
    if (acao === 'anterior') irParaSemana(adicionarDias(semanaSelecionada, -7));
    else if (acao === 'proxima') irParaSemana(adicionarDias(semanaSelecionada, 7));
    else if (acao === 'hoje') irParaSemana(new Date());
});

function definirModoAgenda(modo) {
    modoAgenda = modo;
    document.querySelectorAll('.btn-modo-agenda').forEach(b => b.classList.toggle('ativa', b.dataset.modo === modo));

    const painel = document.getElementById('painel-calendario');
    if (painel) painel.classList.toggle('oculto', modo !== 'mensal');

    if (modo === 'mensal') {
        mesExibido = mesDaSemana(semanaSelecionada);
        atualizarCalendario();
    }
}

document.querySelectorAll('.btn-modo-agenda').forEach(b => {
    b.addEventListener('click', () => definirModoAgenda(b.dataset.modo));
});

const btnMesAnterior = document.getElementById('btn-mes-anterior');
const btnMesProximo = document.getElementById('btn-mes-proximo');

if (btnMesAnterior) {
    btnMesAnterior.addEventListener('click', () => {
        mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() - 1, 1);
        atualizarCalendario();
    });
}

if (btnMesProximo) {
    btnMesProximo.addEventListener('click', () => {
        mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 1);
        atualizarCalendario();
    });
}

// --- NOTA EM PDF ---
let temporizadorNota = null;
let urlPreviaAtual = null;

function coletarDadosDaNota() {
    const chave = chaveDia(semanaSelecionada);
    const dias = [];

    for (let dia = 0; dia < 7; dia++) {
        const semanaAgenda = agendaPorSemana[chave] || {};
        const semanaFin = financeiroPorSemana[chave] || {};
        const itensDoDia = [];

        for (let hIndex = 0; hIndex < TOTAL_HORAS; hIndex++) {
            const campo = `${hIndex}-${dia}`;
            const atividade = (semanaAgenda[campo] || '').trim();
            const fin = semanaFin[campo];
            const valorNum = fin && Number(fin.valor) > 0 ? Number(fin.valor) : 0;
            const tipoValido = fin && (fin.tipo === 'entrada' || fin.tipo === 'saida') ? fin.tipo : '';

            if (atividade !== '' || valorNum > 0) {
                const horaText = (hIndex + HORA_INICIAL) < 10 ? `0${hIndex + HORA_INICIAL}:00` : `${hIndex + HORA_INICIAL}:00`;
                itensDoDia.push({
                    hora: horaText,
                    atividade: atividade || 'Lançamento financeiro',
                    tipo: valorNum > 0 ? tipoValido : '',
                    valor: valorNum
                });
            }
        }
        dias.push({ itens: itensDoDia });
    }

    return {
        usuario: usuarioLogadoNome || 'Utilizador PlaniFy',
        semanaInicio: semanaSelecionada,
        emissao: new Date(),
        dias
    };
}

function atualizarNotaAoVivo() {
    const status = document.getElementById('nota-status');
    const iframe = document.getElementById('iframe-previa-nota');
    if (!window.PlanifyNota) return;

    if (temporizadorNota) clearTimeout(temporizadorNota);

    temporizadorNota = setTimeout(() => {
        try {
            const resultado = window.PlanifyNota.gerarNotaPDF(coletarDadosDaNota());
            const blob = new Blob([resultado.bytes], { type: 'application/pdf' });

            if (urlPreviaAtual) URL.revokeObjectURL(urlPreviaAtual);
            urlPreviaAtual = URL.createObjectURL(blob);

            if (iframe) iframe.src = urlPreviaAtual;

            if (status) {
                status.textContent = `Nota atualizada · ${resultado.resumo.registros} registos · Saldo: ${window.PlanifyNota.moedaComSinal(resultado.resumo.saldo)}`;
                status.style.color = '#2ecc71';
            }
        } catch (erro) {
            console.error('Erro ao atualizar prévia da nota:', erro);
        }
    }, 250);
}

const btnPreviaNota = document.getElementById('btn-previa-nota');
const painelPreviaNota = document.getElementById('painel-previa-nota');
const btnFecharPrevia = document.getElementById('btn-fechar-previa');
const btnBaixarNota = document.getElementById('btn-baixar-nota');
const menuFormatosNota = document.getElementById('menu-formatos-nota');

if (btnPreviaNota && painelPreviaNota) {
    btnPreviaNota.addEventListener('click', () => {
        painelPreviaNota.classList.toggle('oculto');
        if (!painelPreviaNota.classList.contains('oculto')) atualizarNotaAoVivo();
    });
}

if (btnFecharPrevia && painelPreviaNota) {
    btnFecharPrevia.addEventListener('click', () => painelPreviaNota.classList.add('oculto'));
}

if (btnBaixarNota && menuFormatosNota) {
    btnBaixarNota.addEventListener('click', (e) => {
        e.stopPropagation();
        const aberto = menuFormatosNota.classList.toggle('oculto');
        btnBaixarNota.setAttribute('aria-expanded', !aberto);
    });

    window.addEventListener('click', () => {
        if (!menuFormatosNota.classList.contains('oculto')) {
            menuFormatosNota.classList.add('oculto');
            btnBaixarNota.setAttribute('aria-expanded', 'false');
        }
    });

    menuFormatosNota.querySelectorAll('button[data-formato]').forEach(b => {
        b.addEventListener('click', () => {
            const formato = b.dataset.formato;
            menuFormatosNota.classList.add('oculto');

            if (formato === 'pdf') {
                const resultado = window.PlanifyNota.gerarNotaPDF(coletarDadosDaNota());
                const url = URL.createObjectURL(new Blob([resultado.bytes], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = resultado.nomeArquivo;
                a.click();
            } else if (formato === 'xml-nfe') {
                baixarTextoComoArquivo(
                    `<?xml version="1.0" encoding="UTF-8"?><nfeProc versao="4.00"><NFe><infNFe><emit><xNome>${escapeXML(usuarioLogadoNome)}</xNome></emit></infNFe></NFe></nfeProc>`,
                    'PlaniFy_NFe.xml',
                    'application/xml'
                );
            } else if (formato === 'xml-planify') {
                baixarTextoComoArquivo(
                    `<?xml version="1.0" encoding="UTF-8"?><PlaniFy><Usuario>${escapeXML(usuarioLogadoNome)}</Usuario></PlaniFy>`,
                    `PlaniFy_Dados_${chaveDia(semanaSelecionada)}.xml`,
                    'application/xml'
                );
            }
        });
    });
}

function escapeXML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function baixarTextoComoArquivo(conteudo, nome, mime) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: mime + ';charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
}

// --- LEMBRETES (SINCRONIZADOS NA NUVEM) ---
const formNovoLembrete = document.getElementById('form-novo-lembrete');
const containerListaLembretes = document.getElementById('container-lista-lembretes');
const btnAtivarNotificacoes = document.getElementById('btn-ativar-notificacoes');

if (formNovoLembrete) {
    formNovoLembrete.addEventListener('submit', (e) => {
        e.preventDefault();

        const titulo = document.getElementById('lembrete-titulo').value.trim();
        const valor = parseFloat(document.getElementById('lembrete-valor').value) || 0;
        const data = document.getElementById('lembrete-data').value;
        const hora = document.getElementById('lembrete-hora').value;

        if (!titulo || !data || !hora) return;

        listaLembretes.push({
            id: Date.now(),
            titulo,
            valor,
            data,
            hora,
            concluido: false
        });

        sincronizarDadosComNuvem();
        formNovoLembrete.reset();
        renderizarLembretes();
    });
}

function renderizarLembretes() {
    if (!containerListaLembretes) return;
    containerListaLembretes.innerHTML = '';

    if (listaLembretes.length === 0) {
        containerListaLembretes.innerHTML = '<p class="notif-vazia">Nenhum lembrete de pagamento agendado</p>';
        return;
    }

    listaLembretes.forEach(l => {
        const card = document.createElement('div');
        card.classList.add('card-item-lembrete');
        if (l.concluido) card.classList.add('pago');

        card.innerHTML = `
            <div class="info-lembrete">
                <h4>${escapeXML(l.titulo)}</h4>
                <p>R$ ${l.valor.toFixed(2)} · ${l.data} às ${l.hora}</p>
            </div>
            <div class="acoes-lembrete">
                <button class="btn-acao-lembrete" onclick="alternarLembrete(${l.id})">✓</button>
                <button class="btn-acao-lembrete" onclick="excluirLembrete(${l.id})">🗑</button>
            </div>
        `;

        containerListaLembretes.appendChild(card);
    });
}

window.alternarLembrete = (id) => {
    listaLembretes = listaLembretes.map(l => l.id === id ? { ...l, concluido: !l.concluido } : l);
    sincronizarDadosComNuvem();
    renderizarLembretes();
};

window.excluirLembrete = (id) => {
    listaLembretes = listaLembretes.filter(l => l.id !== id);
    sincronizarDadosComNuvem();
    renderizarLembretes();
};

if (btnAtivarNotificacoes) {
    btnAtivarNotificacoes.addEventListener('click', () => {
        if ('Notification' in window) Notification.requestPermission();
    });
}

// INICIALIZAÇÃO QUANDO O FIREBASE ESTIVER PRONTO
window.addEventListener('firebasePronto', () => {
    if (usuarioLogadoEmail) {
        ativarSessaoLogada();
    }
});
