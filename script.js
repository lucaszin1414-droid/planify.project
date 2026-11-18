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

// Código de acesso do Administrador
const CODIGO_ADMIN_PADRAO = "PLANIFY-ADMIN-2026-SECURE";

// --- PERSISTÊNCIA REAL DE SESSÃO ---
let usuarioLogadoEmail = localStorage.getItem('planify_sessao_ativa') || '';
let usuarioLogadoNome = localStorage.getItem('planify_nome_ativo') || '';

// --- LÓGICA DO SININHO E CENTRAL DE NOTIFICAÇÕES ---
const btnSininho = document.getElementById('btn-sininho');
const dropdownNotificacoes = document.getElementById('dropdown-notificacoes');
const badgeNotificacao = document.getElementById('badge-notificacao');
const listaNotificacoes = document.getElementById('lista-notificacoes');
const btnLimparNotifs = document.getElementById('btn-limpar-notifs');

let listaHistoricoNotifs = JSON.parse(localStorage.getItem('historico_notifs_capivara')) || [];

if (btnSininho) {
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
        localStorage.setItem('historico_notifs_capivara', JSON.stringify(listaHistoricoNotifs));
        renderizarPainelNotificacoes();
    });
}

function adicionarNovaNotificacao(titulo, valor) {
    const novaNotif = {
        id: Date.now(),
        titulo,
        valor,
        horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lida: false
    };

    listaHistoricoNotifs.unshift(novaNotif);
    localStorage.setItem('historico_notifs_capivara', JSON.stringify(listaHistoricoNotifs));
    renderizarPainelNotificacoes();
}

function renderizarPainelNotificacoes() {
    if (!listaNotificacoes) return;

    listaNotificacoes.innerHTML = '';

    const naoLidas = listaHistoricoNotifs.filter(n => !n.lida).length;
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
            <strong>⏰ ${notif.titulo}</strong>
            <span>${notif.valor ? 'Valor: R$ ' + Number(notif.valor).toFixed(2) + ' — ' : ''}${notif.horario}</span>
        `;
        listaNotificacoes.appendChild(item);
    });
}

function marcarNotificacoesComoLidas() {
    listaHistoricoNotifs = listaHistoricoNotifs.map(n => ({ ...n, lida: true }));
    localStorage.setItem('historico_notifs_capivara', JSON.stringify(listaHistoricoNotifs));
    if (badgeNotificacao) badgeNotificacao.classList.add('oculta');
}

// Título de boas-vindas
const boasVindasTitulo = document.getElementById('boas-vindas-titulo');

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let tipoTransacaoAtual = 'entrada'; // 'entrada' ou 'saida'
const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const diasAbreviados = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const nomesDosMeses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const HORA_INICIAL = 7;   // grade começa às 07:00
const TOTAL_HORAS = 16;   // e vai até às 22:00

// --- DATAS E SEMANAS ---
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

// --- DADOS POR SEMANA ---
function lerDoArmazenamento(chave) {
    try {
        return JSON.parse(localStorage.getItem(chave)) || {};
    } catch (erro) {
        return {};
    }
}

function salvarNoArmazenamento(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
    } catch (erro) {
        console.warn('Não foi possível salvar os dados no navegador.', erro);
    }
}

let agendaPorSemana = lerDoArmazenamento('planify_agenda');
let financeiroPorSemana = lerDoArmazenamento('planify_financeiro');

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

    salvarNoArmazenamento('planify_agenda', agendaPorSemana);
}

function itemFinanceiro(chaveSemana, hIndex, diaIndex) {
    const semana = financeiroPorSemana[chaveSemana];
    return (semana && semana[`${hIndex}-${diaIndex}`]) || { valor: 0, tipo: 'entrada' };
}

// --- ABRIR E FECHAR MODAIS ---
if (btnCadastroHeader) btnCadastroHeader.addEventListener('click', () => modalCadastro.style.display = 'block');
if (btnLoginHeader) btnLoginHeader.addEventListener('click', () => modalLogin.style.display = 'block');

if (fecharCadastro) fecharCadastro.addEventListener('click', () => modalCadastro.style.display = 'none');
if (fecharLogin) fecharLogin.addEventListener('click', () => modalLogin.style.display = 'none');

window.addEventListener('click', (event) => {
    if (event.target === modalCadastro) modalCadastro.style.display = 'none';
    if (event.target === modalLogin) modalLogin.style.display = 'none';
});

// --- LÓGICA DE CADASTRO ---
if (formCadastro) {
    formCadastro.addEventListener('submit', (e) => {
        e.preventDefault();
        const usuario = document.getElementById('cad-usuario').value;
        const email = document.getElementById('cad-email').value;
        const senha = document.getElementById('cad-senha').value;

        const novoUsuario = { usuario, email, senha };
        localStorage.setItem(email, JSON.stringify(novoUsuario));

        alert('Cadastro realizado com sucesso! Agora você pode fazer o login.');
        formCadastro.reset();
        modalCadastro.style.display = 'none';
    });
}

// --- LÓGICA DE LOGIN ---
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;

        const contaSalva = localStorage.getItem(email);
        if (!contaSalva) {
            alert('Usuário não cadastrado! Faça o cadastro primeiro.');
            return;
        }

        const usuarioObj = JSON.parse(contaSalva);
        if (usuarioObj.senha === senha) {
            formLogin.reset();
            modalLogin.style.display = 'none';

            usuarioLogadoNome = usuarioObj.usuario;
            usuarioLogadoEmail = email;
            localStorage.setItem('planify_sessao_ativa', email);
            localStorage.setItem('planify_nome_ativo', usuarioObj.usuario);

            ativarSessaoLogada();
        } else {
            alert('Senha incorreta! Tente novamente.');
        }
    });
}

function ativarSessaoLogada() {
    boasVindasTitulo.innerText = `Bem-vindo(a), ${usuarioLogadoNome}!`;
    telaInicial.classList.remove('ativa');
    telaLogado.classList.add('ativa');
    renderizarSemana();
}

// --- MENU HAMBÚRGUER ---
if (btnMenuHamburguer) {
    btnMenuHamburguer.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('mostrar');
    });
}

window.addEventListener('click', () => {
    if (dropdownMenu && dropdownMenu.classList.contains('mostrar')) {
        dropdownMenu.classList.remove('mostrar');
    }
});

// --- OPÇÕES DO MENU ---
if (btnTrocarConta) {
    btnTrocarConta.addEventListener('click', () => {
        dropdownMenu.classList.remove('mostrar');
        encerrarSessao();
        modalLogin.style.display = 'block';
    });
}

if (btnConfiguracoes) {
    btnConfiguracoes.addEventListener('click', () => {
        dropdownMenu.classList.remove('mostrar');
        alert('Área de configurações em desenvolvimento.');
    });
}

if (btnDesconectar) {
    btnDesconectar.addEventListener('click', () => {
        dropdownMenu.classList.remove('mostrar');
        encerrarSessao();
    });
}

function encerrarSessao() {
    localStorage.removeItem('planify_sessao_ativa');
    localStorage.removeItem('planify_nome_ativo');
    usuarioLogadoEmail = '';
    usuarioLogadoNome = '';
    telaLogado.classList.remove('ativa');
    telaInicial.classList.add('ativa');
}

// SUPORTE
if (btnSuporte) {
    btnSuporte.addEventListener('click', () => {
        dropdownMenu.classList.remove('mostrar');
        window.location.href = "mailto:projetoplanify@gmail.com?subject=Suporte%20PlaniFy";
    });
}

// PAINEL ADMIN PROTEGIDO
if (btnPainelAdmin) {
    btnPainelAdmin.addEventListener('click', () => {
        dropdownMenu.classList.remove('mostrar');
        const codigoDigitado = prompt("Digite o código de acesso administrativo:");

        if (codigoDigitado === CODIGO_ADMIN_PADRAO) {
            document.querySelectorAll('.btn-aba').forEach(b => b.classList.remove('ativa'));
            document.querySelectorAll('.conteudo-aba').forEach(c => c.classList.remove('ativa'));

            const abaAdmin = document.getElementById('aba-admin');
            if (abaAdmin) {
                abaAdmin.classList.add('ativa');
                atualizarMetricasAdmin();
            }
        } else if (codigoDigitado !== null) {
            alert("Código de acesso incorreto!");
        }
    });
}

function atualizarMetricasAdmin() {
    let totalUsuarios = 0;
    let registrosHoje = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave && chave.includes('@') && !chave.includes('planify_')) {
            totalUsuarios++;
        }
    }

    const agendaGeral = lerDoArmazenamento('planify_agenda');
    const finGeral = lerDoArmazenamento('planify_financeiro');

    Object.values(agendaGeral).forEach(semana => { registrosHoje += Object.keys(semana).length; });
    Object.values(finGeral).forEach(semana => { registrosHoje += Object.keys(semana).length; });

    document.getElementById('admin-total-usuarios').textContent = totalUsuarios;
    document.getElementById('admin-usuarios-logados').textContent = usuarioLogadoEmail ? '1 (Você)' : '0';
    document.getElementById('admin-registros-hoje').textContent = registrosHoje;

    carregarTabelaUsuariosAdmin();
}

function carregarTabelaUsuariosAdmin() {
    const corpoTabela = document.getElementById('admin-corpo-tabela-usuarios');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    let usuariosEncontrados = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave && chave.includes('@') && !chave.includes('planify_')) {
            try {
                const dadosUsuario = JSON.parse(localStorage.getItem(chave));
                if (dadosUsuario && dadosUsuario.usuario) {
                    usuariosEncontrados++;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${escapeXML(dadosUsuario.usuario)}</td>
                        <td>${escapeXML(chave)}</td>
                        <td>
                            <button type="button" onclick="adminExcluirConta('${escapeXML(chave)}')" style="padding: 4px 8px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Excluir</button>
                        </td>
                    `;
                    corpoTabela.appendChild(tr);
                }
            } catch (e) {}
        }
    }

    if (usuariosEncontrados === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #a3c1ad;">Nenhum usuário cadastrado além de você.</td></tr>`;
    }
}

window.adminExcluirConta = function(emailUsuario) {
    if (confirm(`Tem certeza que deseja excluir a conta de ${emailUsuario}? Esta ação é irreversível.`)) {
        localStorage.removeItem(emailUsuario);
        alert('Conta removida com sucesso.');
        atualizarMetricasAdmin();
    }
};

// Disparar aviso global para o sininho de todos
const formAdminAviso = document.getElementById('form-admin-aviso');
if (formAdminAviso) {
    formAdminAviso.addEventListener('submit', (e) => {
        e.preventDefault();
        const titulo = document.getElementById('admin-aviso-titulo').value.trim();
        const texto = document.getElementById('admin-aviso-texto').value.trim();

        if (!titulo || !texto) return;

        const avisoGlobal = {
            id: Date.now(),
            titulo: `[AVISO ADMIN] ${titulo}`,
            valor: texto,
            horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lida: false
        };

        let historicoGeral = JSON.parse(localStorage.getItem('historico_notifs_capivara')) || [];
        historicoGeral.unshift(avisoGlobal);
        localStorage.setItem('historico_notifs_capivara', JSON.stringify(historicoGeral));

        formAdminAviso.reset();
        alert('Aviso global disparado com sucesso! Ele aparecerá no sininho dos usuários.');
        renderizarPainelNotificacoes();
    });
}

// Botão de Backup Geral em JSON
const btnAdminBackup = document.getElementById('btn-admin-backup');
if (btnAdminBackup) {
    btnAdminBackup.addEventListener('click', () => {
        const dadosGerais = {};
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            dadosGerais[chave] = localStorage.getItem(chave);
        }

        const blob = new Blob([JSON.stringify(dadosGerais, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PlaniFy_Backup_Admin_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
}

// --- LÓGICA DE ABAS DA NAVEGAÇÃO ---
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
        }
    });
});

// --- CABEÇALHOS DAS TABELAS ---
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

// --- GERADOR DA TABELA DE ORGANIZAÇÃO SEMANAL ---
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
        const horaFormatada = hora < 10 ? `0${hora}:00` : `${hora}:00`;
        tdHorario.textContent = horaFormatada;
        tdHorario.classList.add('coluna-horario');
        tr.appendChild(tdHorario);

        for (let dia = 0; dia < 7; dia++) {
            const tdDia = document.createElement('td');
            tdDia.contentEditable = "true";
            tdDia.classList.add('celula-agenda');
            tdDia.dataset.horaIndex = hIndex;
            tdDia.dataset.diaIndex = dia;
            tdDia.textContent = textoAgenda(chave, hIndex, dia);

            if (mesmoDia(adicionarDias(semanaSelecionada, dia), hoje)) {
                tdDia.classList.add('coluna-hoje');
            }

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

// --- GERADOR DA TABELA FINANCEIRA ---
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
        const horaFormatada = hora < 10 ? `0${hora}:00` : `${hora}:00`;
        tdHorario.textContent = horaFormatada;
        tdHorario.classList.add('coluna-horario');
        tr.appendChild(tdHorario);

        for (let dia = 0; dia < 7; dia++) {
            const td = document.createElement('td');
            if (mesmoDia(adicionarDias(semanaSelecionada, dia), hoje)) {
                td.classList.add('coluna-hoje');
            }

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
            inputValor.id = `input-fin-${hIndex}-${dia}`;

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
        if (mesmoDia(adicionarDias(semanaSelecionada, dia), hoje)) {
            tdBalanco.classList.add('coluna-hoje');
        }
        linhaBalanco.appendChild(tdBalanco);
    }
}

// --- CONTROLES DA ABA FINANCEIRO ---
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
            painelGrade.classList.add('ativa');
            painelResumo.classList.remove('ativa');
        } else {
            painelGrade.classList.remove('ativa');
            painelResumo.classList.add('ativa');
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
        financeiroPorSemana[chave][campo] = {
            valor: valor,
            tipo: tipoTransacaoAtual
        };

        if (tipoTransacaoAtual === 'entrada') {
            inputElement.classList.add('valor-entrada');
            inputElement.classList.remove('valor-saida');
        } else {
            inputElement.classList.add('valor-saida');
            inputElement.classList.remove('valor-entrada');
        }
    }

    if (Object.keys(financeiroPorSemana[chave]).length === 0) delete financeiroPorSemana[chave];
    salvarNoArmazenamento('planify_financeiro', financeiroPorSemana);

    calcularBalancos();
    atualizarNotaAoVivo();
}

function atualizarAtividadeEspelhada(hIndex, diaIndex, texto) {
    const span = document.getElementById(`ativ-fin-${hIndex}-${diaIndex}`);
    if (span) {
        span.textContent = texto !== '' ? texto : '-';
    }
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
            if (balancoDia > 0) {
                tdBalanco.style.color = '#2ecc71';
            } else if (balancoDia < 0) {
                tdBalanco.style.color = '#e74c3c';
            } else {
                tdBalanco.style.color = '#ffffff';
            }
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

                const spanEsquerdo = document.createElement('span');
                const destaque = document.createElement('strong');
                destaque.textContent = `${diasDaSemana[dia]} ${formatarDataCurta(dataDoDia)} (${horaText})`;
                spanEsquerdo.appendChild(destaque);
                spanEsquerdo.appendChild(document.createTextNode(` - ${escapeXML(nomeAtividade)}`));

                const spanDireito = document.createElement('span');
                spanDireito.style.color = cor;
                const valorForte = document.createElement('strong');
                valorForte.textContent = `${sinal} R$ ${item.valor.toFixed(2)}`;
                spanDireito.appendChild(valorForte);

                divItem.appendChild(spanEsquerdo);
                divItem.appendChild(spanDireito);
                listaDetalhes.appendChild(divItem);
            }
        }
    }

    if (!encontrouTransacao) {
        listaDetalhes.innerHTML = '<p style="text-align: center; color: #aaaaaa; padding: 10px;">Nenhuma movimentação lançada nesta semana.</p>';
    }
}

// --- SELEÇÃO DE SEMANA ---
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
        const fimDestaLinha = adicionarDias(inicioDestaLinha, 6);
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
    document.querySelectorAll('.btn-modo-agenda').forEach(botao => {
        botao.classList.toggle('ativa', botao.dataset.modo === modo);
    });

    const painel = document.getElementById('painel-calendario');
    if (painel) painel.classList.toggle('oculto', modo !== 'mensal');

    if (modo === 'mensal') {
        mesExibido = mesDaSemana(semanaSelecionada);
        atualizarCalendario();
    }
}

document.querySelectorAll('.btn-modo-agenda').forEach(botao => {
    botao.addEventListener('click', () => definirModoAgenda(botao.dataset.modo));
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

function verificarMudancaDeDia() {
    const chaveHoje = chaveDia(new Date());
    if (chaveHoje !== diaAtualChave) {
        diaAtualChave = chaveHoje;
        renderizarSemana();
    }
}

setInterval(verificarMudancaDeDia, 60000);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) verificarMudancaDeDia();
});

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
                    atividade: atividade !== '' ? atividade : 'Lançamento financeiro',
                    tipo: valorNum > 0 ? tipoValido : '',
                    valor: valorNum
                });
            }
        }
        dias.push({ itens: itensDoDia });
    }

    return {
        usuario: usuarioLogadoNome || 'Usuário PlaniFy',
        semanaInicio: semanaSelecionada,
        emissao: new Date(),
        dias
    };
}

function gerarBytesPDFDaSemana() {
    const dados = coletarDadosDaNota();
    return window.PlanifyNota.gerarNotaPDF(dados);
}

function atualizarNotaAoVivo() {
    const status = document.getElementById('nota-status');
    const iframe = document.getElementById('iframe-previa-nota');

    if (temporizadorNota) clearTimeout(temporizadorNota);

    temporizadorNota = setTimeout(() => {
        try {
            const resultado = gerarBytesPDFDaSemana();
            const blob = new Blob([resultado.bytes], { type: 'application/pdf' });

            if (urlPreviaAtual) URL.revokeObjectURL(urlPreviaAtual);
            urlPreviaAtual = URL.createObjectURL(blob);

            if (iframe) iframe.src = urlPreviaAtual;

            if (status) {
                status.textContent = `Nota atualizada · ${resultado.resumo.registros} registros · Saldo: ${window.PlanifyNota.moedaComSinal(resultado.resumo.saldo)}`;
                status.style.color = '#2ecc71';
            }
        } catch (erro) {
            if (status) {
                status.textContent = 'Erro ao atualizar nota.';
                status.style.color = '#e74c3c';
            }
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

    menuFormatosNota.querySelectorAll('button[data-formato]').forEach(botaoFormatos => {
        botaoFormatos.addEventListener('click', () => {
            const formato = botaoFormatos.dataset.formato;
            menuFormatosNota.classList.add('oculto');
            if (formato === 'pdf') baixarArquivoPDF();
            else if (formato === 'xml-nfe') baixarXMLNFeRascunho();
            else if (formato === 'xml-planify') baixarXMLPlanifyCompleto();
        });
    });
}

function baixarArquivoPDF() {
    const resultado = gerarBytesPDFDaSemana();
    const blob = new Blob([resultado.bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultado.nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function baixarXMLNFeRascunho() {
    const dados = coletarDadosDaNota();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc versao="4.00"><NFe><infNFe><emit><xNome>${escapeXML(dados.usuario)}</xNome></emit></infNFe></NFe></nfeProc>`;
    baixarTextoComoArquivo(xml, 'PlaniFy_NFe.xml', 'application/xml');
}

function baixarXMLPlanifyCompleto() {
    const chave = chaveDia(semanaSelecionada);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<PlaniFy><Usuario>${escapeXML(usuarioLogadoNome)}</Usuario></PlaniFy>`;
    baixarTextoComoArquivo(xml, `PlaniFy_Dados_${chave}.xml`, 'application/xml');
}

function escapeXML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function baixarTextoComoArquivo(conteudo, nome, mime) {
    const blob = new Blob([conteudo], { type: mime + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- LEMBRETES ---
let listaLembretes = JSON.parse(localStorage.getItem('lembretes_pagamento_capivara')) || [];
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
        listaLembretes.push({ id: Date.now(), titulo, valor, data, hora, concluido: false });
        localStorage.setItem('lembretes_pagamento_capivara', JSON.stringify(listaLembretes));
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
    localStorage.setItem('lembretes_pagamento_capivara', JSON.stringify(listaLembretes));
    renderizarLembretes();
};

window.excluirLembrete = (id) => {
    listaLembretes = listaLembretes.filter(l => l.id !== id);
    localStorage.setItem('lembretes_pagamento_capivara', JSON.stringify(listaLembretes));
    renderizarLembretes();
};

if (btnAtivarNotificacoes) {
    btnAtivarNotificacoes.addEventListener('click', () => {
        if ('Notification' in window) Notification.requestPermission();
    });
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    renderizarPainelNotificacoes();
    if (usuarioLogadoEmail) {
        ativarSessaoLogada();
    }
});
