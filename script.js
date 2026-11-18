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
            <span>Valor: R$ ${notif.valor.toFixed(2)} — ${notif.horario}</span>
        `;
        listaNotificacoes.appendChild(item);
    });
}

function marcarNotificacoesComoLidas() {
    listaHistoricoNotifs = listaHistoricoNotifs.map(n => ({ ...n, lida: true }));
    localStorage.setItem('historico_notifs_capivara', JSON.stringify(listaHistoricoNotifs));
    if (badgeNotificacao) badgeNotificacao.classList.add('oculta');
}

// Carregar as notificações ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    renderizarPainelNotificacoes();
});

// Título de boas-vindas
const boasVindasTitulo = document.getElementById('boas-vindas-titulo');

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let tipoTransacaoAtual = 'entrada'; // 'entrada' ou 'saida'
let usuarioLogadoNome = ''; // nome exibido na nota em PDF
const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const diasAbreviados = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const nomesDosMeses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const HORA_INICIAL = 7;   // grade começa às 07:00
const TOTAL_HORAS = 16;   // e vai até às 22:00

// --- DATAS E SEMANAS ---
// Toda semana começa na segunda-feira e é identificada pela data dessa segunda (ex.: "2026-11-09")
function adicionarDias(data, quantidade) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate() + quantidade);
}

function inicioDaSemana(data) {
    const deslocamento = (data.getDay() + 6) % 7; // segunda = 0 ... domingo = 6
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

// Semana atualmente selecionada (vale para a Organização Semanal e para o Financeiro)
let semanaSelecionada = inicioDaSemana(new Date());
let mesExibido = mesDaSemana(semanaSelecionada);
let modoAgenda = 'semanal'; // 'semanal' ou 'mensal'
let diaAtualChave = chaveDia(new Date());

// O mês "dono" de uma semana é o mês da quinta-feira dela
function mesDaSemana(inicioSemana) {
    const quinta = adicionarDias(inicioSemana, 3);
    return new Date(quinta.getFullYear(), quinta.getMonth(), 1);
}

// --- DADOS POR SEMANA (salvos no navegador) ---
// agendaPorSemana:     { "2026-11-09": { "hora-dia": "texto" } }
// financeiroPorSemana: { "2026-11-09": { "hora-dia": { valor, tipo } } }
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

            boasVindasTitulo.innerText = `Bem-vindo(a), ${usuarioObj.usuario}!`;
            usuarioLogadoNome = usuarioObj.usuario;
            telaInicial.classList.remove('ativa');
            telaLogado.classList.add('ativa');
        } else {
            alert('Senha incorreta! Tente novamente.');
        }
    });
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
        usuarioLogadoNome = '';
        telaLogado.classList.remove('ativa');
        telaInicial.classList.add('ativa');
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
        usuarioLogadoNome = '';
        telaLogado.classList.remove('ativa');
        telaInicial.classList.add('ativa');
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

// --- CABEÇALHOS DAS TABELAS COM AS DATAS DA SEMANA SELECIONADA ---
function atualizarCabecalhosDatas() {
    const seletores = ['#aba-organizacao thead th', '#visao-grade-financeira thead th'];
    const hoje = new Date();

    seletores.forEach(seletor => {
        document.querySelectorAll(seletor).forEach((th, indice) => {
            if (indice === 0) return; // coluna "Horário"

            const data = adicionarDias(semanaSelecionada, indice - 1);
            th.innerHTML = `${diasDaSemana[indice - 1]}<span class="data-cabecalho">${formatarDataCurta(data)}</span>`;
            th.classList.toggle('coluna-hoje-cabecalho', mesmoDia(data, hoje));
        });
    });
}

// --- GERADOR DA TABELA DE ORGANIZAÇÃO SEMANAL (07:00 às 22:00) ---
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

            // Em tempo real: salva, espelha no Financeiro e atualiza os pontinhos do calendário
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

            // Salva a cada tecla (input) e também ao confirmar (change), para tudo atualizar em tempo real
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
                spanEsquerdo.appendChild(document.createTextNode(` - ${nomeAtividade}`));

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

// --- SELEÇÃO DE SEMANA: NAVEGADOR, CALENDÁRIO MENSAL E SINCRONIZAÇÃO ---
function irParaSemana(dataQualquer) {
    semanaSelecionada = inicioDaSemana(dataQualquer);
    mesExibido = mesDaSemana(semanaSelecionada);
    renderizarSemana();
}

function selecionarSemanaNoCalendario(inicioSemana) {
    semanaSelecionada = inicioDaSemana(inicioSemana);
    definirModoAgenda('semanal'); // escolheu a semana: volta para a visão semanal
    renderizarSemana();
}

function descreverSemana() {
    const fim = adicionarDias(semanaSelecionada, 6);
    const mudaDeAno = semanaSelecionada.getFullYear() !== fim.getFullYear();
    const inicioTexto = mudaDeAno ? formatarDataCompleta(semanaSelecionada) : formatarDataCurta(semanaSelecionada);
    const titulo = `Semana de ${inicioTexto} a ${formatarDataCompleta(fim)}`;

    const milissegundosPorSemana = 7 * 24 * 60 * 60 * 1000;
    const diferenca = Math.round((semanaSelecionada - inicioDaSemana(new Date())) / milissegundosPorSemana);

    let subtitulo;
    if (diferenca === 0) subtitulo = 'Semana atual';
    else if (diferenca === 1) subtitulo = 'Próxima semana';
    else if (diferenca === -1) subtitulo = 'Semana passada';
    else if (diferenca > 1) subtitulo = `Daqui a ${diferenca} semanas`;
    else subtitulo = `Há ${Math.abs(diferenca)} semanas`;

    return { titulo, subtitulo };
}

function atualizarNavegadoresSemana() {
    const { titulo, subtitulo } = descreverSemana();

    document.querySelectorAll('.semana-titulo').forEach(el => el.textContent = titulo);
    document.querySelectorAll('.semana-sub').forEach(el => el.textContent = subtitulo);

    const tituloResumo = document.querySelector('.resumo-semanal-card > h3');
    if (tituloResumo) {
        const fim = adicionarDias(semanaSelecionada, 6);
        tituloResumo.textContent = `Balanço Consolidado da Semana (${formatarDataCurta(semanaSelecionada)} a ${formatarDataCurta(fim)})`;
    }
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
        linha.setAttribute('role', 'button');
        linha.tabIndex = 0;
        linha.setAttribute('aria-label', `Selecionar a semana de ${formatarDataCurta(inicioDestaLinha)} a ${formatarDataCurta(fimDestaLinha)}`);

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
        linha.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selecionarSemanaNoCalendario(inicioDestaLinha);
            }
        });

        grade.appendChild(linha);
        inicioLinha = adicionarDias(inicioLinha, 7);
    }
}

// Redesenha tudo o que depende da semana selecionada
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

// Botões ‹ › Hoje (existem na aba Organização Semanal e na aba Financeiro)
document.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-nav]');
    if (!botao) return;

    const acao = botao.dataset.nav;
    if (acao === 'anterior') irParaSemana(adicionarDias(semanaSelecionada, -7));
    else if (acao === 'proxima') irParaSemana(adicionarDias(semanaSelecionada, 7));
    else if (acao === 'hoje') irParaSemana(new Date());
});

// Alternar entre visão semanal e mensal
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

// Navegação entre meses dentro do calendário
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

// Quando o dia muda (virou a meia-noite ou o computador voltou de suspensão), atualiza o "hoje"
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

// --- NOTA EM PDF (aba Financeiro) ---
let temporizadorNota = null;
let urlPreviaAtual = null;

// Reúne, a partir dos dados salvos, tudo o que a nota precisa (sempre o estado mais recente)
function coletarDadosDaNota() {
    const chave = chaveDia(semanaSelecionada);
    const dias = [];

    for (let dia = 0; dia < 7; dia++) {
        const itens = [];

        for (let hIndex = 0; hIndex < TOTAL_HORAS; hIndex++) {
            const atividade = textoAgenda(chave, hIndex, dia);
            const financeiro = itemFinanceiro(chave, hIndex, dia);

            if (atividade || financeiro.valor > 0) {
                itens.push({
                    hora: `${String(hIndex + HORA_INICIAL).padStart(2, '0')}:00`,
                    atividade,
                    tipo: financeiro.valor > 0 ? financeiro.tipo : '',
                    valor: financeiro.valor > 0 ? financeiro.valor : 0
                });
            }
        }

        dias.push({ itens });
    }

    return { usuario: usuarioLogadoNome, semanaInicio: new Date(semanaSelecionada), dias };
}

function gerarNotaAgora() {
    return window.PlanifyNota.gerarNotaPDF({ ...coletarDadosDaNota(), emissao: new Date() });
}

function criarUrlDoPDF(resultado) {
    return URL.createObjectURL(new Blob([resultado.bytes], { type: 'application/pdf' }));
}

function atualizarStatusNota() {
    const status = document.getElementById('nota-status');
    if (!status || !window.PlanifyNota) return;

    const resumo = window.PlanifyNota.resumir(coletarDadosDaNota());
    const hora = new Date().toLocaleTimeString('pt-BR');
    const registros = `${resumo.registros} ${resumo.registros === 1 ? 'registro' : 'registros'}`;
    status.textContent = `Nota atualizada às ${hora} · ${registros} · Saldo ${window.PlanifyNota.moedaComSinal(resumo.saldo)}`;
}

// Chamada sempre que algo muda (agenda, valores, semana): mantém a nota em dia
function atualizarNotaAoVivo() {
    if (!window.PlanifyNota) return;

    atualizarStatusNota();

    const painel = document.getElementById('painel-previa-nota');
    const abaFinanceiro = document.getElementById('aba-financeiro');
    const previaVisivel = painel && !painel.classList.contains('oculto');
    if (!previaVisivel || !abaFinanceiro || !abaFinanceiro.classList.contains('ativa')) return;

    clearTimeout(temporizadorNota);
    temporizadorNota = setTimeout(atualizarPreviaNota, 300);
}

function atualizarPreviaNota() {
    const iframe = document.getElementById('iframe-previa-nota');
    if (!iframe || !window.PlanifyNota) return;

    const novaUrl = criarUrlDoPDF(gerarNotaAgora());
    iframe.src = `${novaUrl}#view=FitH`;

    if (urlPreviaAtual) URL.revokeObjectURL(urlPreviaAtual);
    urlPreviaAtual = novaUrl;
}

function alternarPreviaNota(abrir) {
    const painel = document.getElementById('painel-previa-nota');
    const botao = document.getElementById('btn-previa-nota');
    const iframe = document.getElementById('iframe-previa-nota');
    if (!painel) return;

    painel.classList.toggle('oculto', !abrir);
    if (botao) {
        botao.classList.toggle('ativa', abrir);
        botao.textContent = abrir ? 'Ocultar pré-visualização' : 'Pré-visualizar nota';
    }

    if (abrir) {
        atualizarPreviaNota();
    } else {
        clearTimeout(temporizadorNota);
        if (iframe) iframe.src = 'about:blank';
        if (urlPreviaAtual) {
            URL.revokeObjectURL(urlPreviaAtual);
            urlPreviaAtual = null;
        }
    }
}

// --- NOTA EM XML ---
function dataHoraISO(data) {
    const dois = (n) => String(n).padStart(2, '0');
    const deslocamento = -data.getTimezoneOffset(); // minutos em relação ao UTC
    const sinal = deslocamento >= 0 ? '+' : '-';
    const absoluto = Math.abs(deslocamento);
    return `${chaveDia(data)}T${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}${sinal}${dois(Math.floor(absoluto / 60))}:${dois(absoluto % 60)}`;
}

// Deixa o texto seguro para o XML (remove caracteres inválidos e escapa & < > " ')
function escaparXML(texto) {
    return String(texto)
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Valores em centavos -> "1234.56" (formato padrão para outros sistemas lerem)
function valorParaXML(centavos) {
    const absoluto = Math.abs(centavos);
    return `${centavos < 0 ? '-' : ''}${Math.floor(absoluto / 100)}.${String(absoluto % 100).padStart(2, '0')}`;
}

function nomeDoDia(indice) {
    return indice < 5 ? `${diasDaSemana[indice]}-feira` : diasDaSemana[indice];
}

function gerarNotaXML() {
    const emissao = new Date();
    const dados = coletarDadosDaNota();
    const inicio = dados.semanaInicio;
    const fim = adicionarDias(inicio, 6);
    const dois = (n) => String(n).padStart(2, '0');
    const numero = `PF-${chaveDia(inicio).replace(/-/g, '')}-${dois(emissao.getHours())}${dois(emissao.getMinutes())}${dois(emissao.getSeconds())}`;
    const usuario = String(dados.usuario || '').trim() || 'Usuário não identificado';

    const itensXML = [];
    const diasXML = [];
    let totalEntradas = 0;
    let totalSaidas = 0;
    let numeroItem = 0;

    dados.dias.forEach((dia, indice) => {
        const dataDoDia = adicionarDias(inicio, indice);
        let entradasDia = 0;
        let saidasDia = 0;

        dia.itens.forEach(item => {
            numeroItem++;
            const centavos = Math.round((Number(item.valor) || 0) * 100);
            const tipo = centavos > 0 && (item.tipo === 'entrada' || item.tipo === 'saida') ? item.tipo : 'nenhum';
            const valorItem = tipo === 'nenhum' ? 0 : centavos;

            if (tipo === 'entrada') entradasDia += valorItem;
            if (tipo === 'saida') saidasDia += valorItem;

            itensXML.push(
                `    <item numero="${numeroItem}">\n` +
                `      <data>${chaveDia(dataDoDia)}</data>\n` +
                `      <diaSemana>${escaparXML(nomeDoDia(indice))}</diaSemana>\n` +
                `      <horario>${escaparXML(item.hora)}</horario>\n` +
                `      <atividade>${escaparXML(item.atividade)}</atividade>\n` +
                `      <tipo>${tipo}</tipo>\n` +
                `      <valor>${valorParaXML(valorItem)}</valor>\n` +
                `    </item>`
            );
        });

        totalEntradas += entradasDia;
        totalSaidas += saidasDia;

        diasXML.push(
            `    <dia data="${chaveDia(dataDoDia)}" diaSemana="${escaparXML(nomeDoDia(indice))}">\n` +
            `      <entradas>${valorParaXML(entradasDia)}</entradas>\n` +
            `      <saidas>${valorParaXML(saidasDia)}</saidas>\n` +
            `      <saldo>${valorParaXML(entradasDia - saidasDia)}</saldo>\n` +
            `    </dia>`
        );
    });

    const conteudo =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<notaMovimentacao versao="1.0">\n' +
        '  <identificacao>\n' +
        `    <numero>${numero}</numero>\n` +
        `    <emissao>${dataHoraISO(emissao)}</emissao>\n` +
        `    <usuario>${escaparXML(usuario)}</usuario>\n` +
        '    <aviso>Documento informativo gerado pelo PlaniFy, sem valor fiscal.</aviso>\n' +
        '  </identificacao>\n' +
        '  <periodo>\n' +
        `    <inicio>${chaveDia(inicio)}</inicio>\n` +
        `    <fim>${chaveDia(fim)}</fim>\n` +
        '  </periodo>\n' +
        `  <movimentacoes quantidade="${numeroItem}">\n` +
        (itensXML.length ? itensXML.join('\n') + '\n' : '') +
        '  </movimentacoes>\n' +
        '  <resumoPorDia>\n' +
        diasXML.join('\n') + '\n' +
        '  </resumoPorDia>\n' +
        '  <totais moeda="BRL">\n' +
        `    <entradas>${valorParaXML(totalEntradas)}</entradas>\n` +
        `    <saidas>${valorParaXML(totalSaidas)}</saidas>\n` +
        `    <saldo>${valorParaXML(totalEntradas - totalSaidas)}</saldo>\n` +
        '  </totais>\n' +
        '</notaMovimentacao>\n';

    const nomeBase = `PlaniFy_Nota_${formatarDataCompleta(inicio).replace(/\//g, '-')}_a_${formatarDataCompleta(fim).replace(/\//g, '-')}`;
    return { conteudo, nomeArquivo: `${nomeBase}.xml`, numero };
}

// --- NOTA NO LEIAUTE OFICIAL DA NF-e 4.00 (RASCUNHO PARA HOMOLOGAÇÃO) ---
// ATENÇÃO: este XML segue a ESTRUTURA do leiaute oficial da NF-e (modelo 55, versão 4.00), mas é só um
// rascunho de TESTE: sai em ambiente de homologação (tpAmb = 2), sem assinatura digital e sem protocolo de
// autorização da SEFAZ. Ele NÃO tem valor fiscal. Para emitir uma nota de verdade é preciso CNPJ, inscrição
// estadual, certificado digital e um emissor autorizado (ou uma API de emissão) que assine e transmita o XML.
// Tudo o que está em CONFIG_FISCAL é FICTÍCIO: troque pelos dados reais quando o projeto for oficial.
const CONFIG_FISCAL = {
    regimeTributario: 1,           // 1 = Simples Nacional (único regime que este gerador monta)
    serie: 1,
    codigoUF: '35',                // código IBGE da UF do emitente (35 = São Paulo)
    naturezaOperacao: 'VENDA',
    cfop: '5102',                  // 5102 = venda de mercadoria adquirida de terceiros, dentro do estado
    ncm: '00000000',               // troque pelo NCM real do produto (a SEFAZ confere na tabela oficial)
    unidade: 'UN',
    emitente: {
        cnpj: '00000000000000',
        razaoSocial: 'EMITENTE DE TESTE PLANIFY',
        inscricaoEstadual: 'ISENTO',
        logradouro: 'RUA DE TESTE',
        numero: '0',
        bairro: 'CENTRO',
        codigoMunicipio: '3550308', // código IBGE do município (3550308 = São Paulo/SP)
        municipio: 'SAO PAULO',
        siglaUF: 'SP',
        cep: '01000000'
    },
    destinatario: {
        documento: '00000000000',   // CPF (11 dígitos) ou CNPJ (14 dígitos)
        logradouro: 'RUA DE TESTE',
        numero: '0',
        bairro: 'CENTRO',
        codigoMunicipio: '3550308',
        municipio: 'SAO PAULO',
        siglaUF: 'SP',
        cep: '01000000'
    }
};

function soDigitos(valor, tamanho) {
    return String(valor || '').replace(/\D/g, '').padStart(tamanho, '0').slice(-tamanho);
}

// Texto no padrão da NF-e: sem acentos, só caracteres ASCII visíveis, sem quebras de linha
function textoNFe(valor, maximo) {
    const limpo = String(valor || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximo)
        .trim();
    return escaparXML(limpo);
}

// Dígito verificador da chave de acesso (módulo 11, pesos de 2 a 9 da direita para a esquerda)
function calcularDVChave(chave43) {
    let peso = 2;
    let soma = 0;

    for (let i = chave43.length - 1; i >= 0; i--) {
        soma += Number(chave43[i]) * peso;
        peso = peso === 9 ? 2 : peso + 1;
    }

    const resto = soma % 11;
    return resto === 0 || resto === 1 ? 0 : 11 - resto;
}

// Número sequencial do rascunho (guardado no navegador, sobe a cada XML NF-e baixado)
function proximoNumeroNFe() {
    const proximo = (Number(localStorage.getItem('planify_nfe_numero')) || 0) + 1;

    try {
        localStorage.setItem('planify_nfe_numero', String(proximo));
    } catch (erro) {
        console.warn('Não foi possível guardar o número da NF-e.', erro);
    }

    return proximo;
}

// Código numérico aleatório de 8 dígitos (cNF), diferente do número da nota
function gerarCodigoNumerico(numeroNF) {
    let codigo;

    do {
        const aleatorio = (typeof crypto !== 'undefined' && crypto.getRandomValues)
            ? crypto.getRandomValues(new Uint32Array(1))[0]
            : Math.floor(Math.random() * 4294967296);
        codigo = aleatorio % 100000000;
    } while (codigo === 0 || codigo === numeroNF);

    return String(codigo).padStart(8, '0');
}

function enderecoNFe(tag, dados) {
    return `<${tag}>` +
        `<xLgr>${textoNFe(dados.logradouro, 60)}</xLgr>` +
        `<nro>${textoNFe(dados.numero, 60)}</nro>` +
        `<xBairro>${textoNFe(dados.bairro, 60)}</xBairro>` +
        `<cMun>${soDigitos(dados.codigoMunicipio, 7)}</cMun>` +
        `<xMun>${textoNFe(dados.municipio, 60)}</xMun>` +
        `<UF>${textoNFe(dados.siglaUF, 2)}</UF>` +
        `<CEP>${soDigitos(dados.cep, 8)}</CEP>` +
        '<cPais>1058</cPais><xPais>BRASIL</xPais>' +
        `</${tag}>`;
}

// Monta o XML no leiaute da NF-e 4.00 a partir das ENTRADAS da semana selecionada.
// Só as entradas (dinheiro recebido) viram itens: a NF-e é emitida por quem vende ou presta o serviço.
// Gastos e atividades sem valor não entram (eles continuam no PDF e no XML PlaniFy).
function gerarNotaNFe() {
    const cfg = CONFIG_FISCAL;

    if (cfg.regimeTributario !== 1) {
        return { erro: 'Este gerador só monta os grupos de tributos do Simples Nacional (regimeTributario = 1).' };
    }

    const dados = coletarDadosDaNota();
    const itens = [];

    dados.dias.forEach((dia, indiceDia) => {
        const dataDoDia = adicionarDias(dados.semanaInicio, indiceDia);

        dia.itens.forEach(item => {
            const centavos = Math.round((Number(item.valor) || 0) * 100);
            if (item.tipo === 'entrada' && centavos > 0) {
                itens.push({ data: dataDoDia, hora: item.hora, atividade: item.atividade, centavos });
            }
        });
    });

    if (itens.length === 0) {
        return { erro: 'Não há entradas (dinheiro recebido) com valor lançado nesta semana. O XML no leiaute da NF-e precisa de pelo menos um item. Lance uma entrada no Financeiro e tente de novo.' };
    }

    const emissao = new Date();
    const inicio = dados.semanaInicio;
    const fim = adicionarDias(inicio, 6);
    const dois = (n) => String(n).padStart(2, '0');

    // Chave de acesso: UF(2) + AAMM(4) + CNPJ(14) + modelo(2) + série(3) + número(9) + tipo de emissão(1) + código(8) + DV(1)
    const numeroNF = proximoNumeroNFe();
    const codigoNumerico = gerarCodigoNumerico(numeroNF);
    const cUF = soDigitos(cfg.codigoUF, 2);
    const aamm = `${String(emissao.getFullYear()).slice(2)}${dois(emissao.getMonth() + 1)}`;
    const cnpjEmitente = soDigitos(cfg.emitente.cnpj, 14);
    const chave43 = `${cUF}${aamm}${cnpjEmitente}55${String(Number(cfg.serie) || 1).padStart(3, '0')}${String(numeroNF).padStart(9, '0')}1${codigoNumerico}`;
    const digitoVerificador = calcularDVChave(chave43);
    const chave = `${chave43}${digitoVerificador}`;

    const emitente = cfg.emitente;
    const destinatario = cfg.destinatario;
    const inscricao = /^\d{2,14}$/.test(emitente.inscricaoEstadual) ? emitente.inscricaoEstadual : 'ISENTO';
    const docDestinatario = String(destinatario.documento || '').replace(/\D/g, '');
    const tagDocDestinatario = docDestinatario.length > 11
        ? `<CNPJ>${soDigitos(docDestinatario, 14)}</CNPJ>`
        : `<CPF>${soDigitos(docDestinatario, 11)}</CPF>`;

    let totalCentavos = 0;
    const detalhes = itens.map((item, indice) => {
        totalCentavos += item.centavos;
        const valor = valorParaXML(item.centavos);
        const codigoProduto = `PF${chaveDia(item.data).replace(/-/g, '')}${item.hora.slice(0, 2)}`;
        const descricao = textoNFe(item.atividade, 120) || 'ENTRADA SEM DESCRICAO';

        return `<det nItem="${indice + 1}">` +
            '<prod>' +
            `<cProd>${codigoProduto}</cProd><cEAN>SEM GTIN</cEAN><xProd>${descricao}</xProd>` +
            `<NCM>${soDigitos(cfg.ncm, 8)}</NCM><CFOP>${soDigitos(cfg.cfop, 4)}</CFOP>` +
            `<uCom>${textoNFe(cfg.unidade, 6)}</uCom><qCom>1.0000</qCom><vUnCom>${valor}</vUnCom><vProd>${valor}</vProd>` +
            `<cEANTrib>SEM GTIN</cEANTrib><uTrib>${textoNFe(cfg.unidade, 6)}</uTrib><qTrib>1.0000</qTrib><vUnTrib>${valor}</vUnTrib>` +
            '<indTot>1</indTot>' +
            '</prod>' +
            '<imposto>' +
            '<ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS>' +
            '<PIS><PISOutr><CST>49</CST><vBC>0.00</vBC><pPIS>0.0000</pPIS><vPIS>0.00</vPIS></PISOutr></PIS>' +
            '<COFINS><COFINSOutr><CST>49</CST><vBC>0.00</vBC><pCOFINS>0.0000</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS>' +
            '</imposto>' +
            '</det>';
    }).join('');

    const total = valorParaXML(totalCentavos);
    const infoAdicional = textoNFe(
        `NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL. RASCUNHO GERADO PELO PLANIFY. ` +
        `PERIODO DE ${formatarDataCompleta(inicio)} A ${formatarDataCompleta(fim)}. ITENS: ENTRADAS REGISTRADAS NA SEMANA.`,
        2000
    );

    // O XML sai compacto (sem quebras de linha entre as tags): é assim que a SEFAZ exige e que a assinatura digital funciona
    const conteudo =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">' +
        `<infNFe Id="NFe${chave}" versao="4.00">` +
        '<ide>' +
        `<cUF>${cUF}</cUF><cNF>${codigoNumerico}</cNF><natOp>${textoNFe(cfg.naturezaOperacao, 60)}</natOp>` +
        `<mod>55</mod><serie>${Number(cfg.serie) || 1}</serie><nNF>${numeroNF}</nNF>` +
        `<dhEmi>${dataHoraISO(emissao)}</dhEmi><tpNF>1</tpNF><idDest>1</idDest>` +
        `<cMunFG>${soDigitos(emitente.codigoMunicipio, 7)}</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis>` +
        `<cDV>${digitoVerificador}</cDV><tpAmb>2</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>1</indPres>` +
        '<procEmi>0</procEmi><verProc>PlaniFy 1.0</verProc>' +
        '</ide>' +
        '<emit>' +
        `<CNPJ>${cnpjEmitente}</CNPJ><xNome>${textoNFe(emitente.razaoSocial, 60)}</xNome>` +
        enderecoNFe('enderEmit', emitente) +
        `<IE>${inscricao}</IE><CRT>1</CRT>` +
        '</emit>' +
        '<dest>' +
        `${tagDocDestinatario}<xNome>NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL</xNome>` +
        enderecoNFe('enderDest', destinatario) +
        '<indIEDest>9</indIEDest>' +
        '</dest>' +
        detalhes +
        '<total><ICMSTot>' +
        '<vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST>' +
        '<vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet>' +
        `<vProd>${total}</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI>` +
        `<vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>${total}</vNF>` +
        '</ICMSTot></total>' +
        '<transp><modFrete>9</modFrete></transp>' +
        `<pag><detPag><tPag>01</tPag><vPag>${total}</vPag></detPag></pag>` +
        `<infAdic><infCpl>${infoAdicional}</infCpl></infAdic>` +
        '</infNFe>' +
        '</NFe>';

    return { conteudo, nomeArquivo: `NFe${chave}_RASCUNHO_HOMOLOGACAO.xml`, chave };
}

// --- DOWNLOAD DA NOTA (PDF ou XML, escolhido pelo usuário) ---
function baixarArquivo(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Gera o arquivo na hora do clique (dados e horário de download atuais) e baixa
// formato: 'pdf' | 'xml-nfe' (estrutura da NF-e 4.00, rascunho sem valor fiscal) | 'xml-planify' (todos os dados da semana)
function baixarNota(formato) {
    const rotulos = { 'pdf': 'PDF', 'xml-nfe': 'XML NF-e', 'xml-planify': 'XML PlaniFy' };

    try {
        if (formato === 'xml-planify') {
            const resultado = gerarNotaXML();
            baixarArquivo(new Blob([resultado.conteudo], { type: 'application/xml;charset=utf-8' }), resultado.nomeArquivo);
            return;
        }

        if (formato === 'xml-nfe') {
            const resultado = gerarNotaNFe();

            if (resultado.erro) {
                alert(resultado.erro);
                return;
            }

            baixarArquivo(new Blob([resultado.conteudo], { type: 'application/xml;charset=utf-8' }), resultado.nomeArquivo);
            return;
        }

        if (!window.PlanifyNota) {
            alert('O gerador de PDF não foi carregado. Confira se o arquivo nota-pdf.js está na mesma pasta do projeto.');
            return;
        }

        const resultado = gerarNotaAgora();
        baixarArquivo(new Blob([resultado.bytes], { type: 'application/pdf' }), resultado.nomeArquivo);
    } catch (erro) {
        console.error('Erro ao gerar a nota:', erro);
        alert(`Não foi possível gerar a nota em ${rotulos[formato] || 'PDF'}. Tente novamente.`);
    }
}

const btnBaixarNota = document.getElementById('btn-baixar-nota');
const menuFormatosNota = document.getElementById('menu-formatos-nota');
const btnPreviaNota = document.getElementById('btn-previa-nota');
const btnFecharPrevia = document.getElementById('btn-fechar-previa');

// Menu para escolher o formato (PDF ou XML)
function alternarMenuDownload(abrir) {
    if (!menuFormatosNota || !btnBaixarNota) return;

    const mostrar = abrir === undefined ? menuFormatosNota.classList.contains('oculto') : abrir;
    menuFormatosNota.classList.toggle('oculto', !mostrar);
    btnBaixarNota.setAttribute('aria-expanded', String(mostrar));
}

if (btnBaixarNota) {
    btnBaixarNota.addEventListener('click', (e) => {
        e.stopPropagation();
        alternarMenuDownload();
    });
}

if (menuFormatosNota) {
    menuFormatosNota.addEventListener('click', (e) => {
        const opcao = e.target.closest('[data-formato]');
        if (!opcao) return;

        alternarMenuDownload(false);
        baixarNota(opcao.dataset.formato);
    });
}

// Clicar fora ou apertar Esc fecha o menu
document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-download')) alternarMenuDownload(false);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') alternarMenuDownload(false);
});

if (btnPreviaNota) {
    btnPreviaNota.addEventListener('click', () => {
        const painel = document.getElementById('painel-previa-nota');
        alternarPreviaNota(painel.classList.contains('oculto'));
    });
}
if (btnFecharPrevia) btnFecharPrevia.addEventListener('click', () => alternarPreviaNota(false));

// --- LÓGICA DA ABA LEMBRETES E NOTIFICAÇÕES ---
const formNovoLembrete = document.getElementById('form-novo-lembrete');
const containerListaLembretes = document.getElementById('container-lista-lembretes');
const btnAtivarNotificacoes = document.getElementById('btn-ativar-notificacoes');

// Lista de Lembretes
let lembretes = JSON.parse(localStorage.getItem('lembretes_capivara')) || [];

if (btnAtivarNotificacoes) {
    btnAtivarNotificacoes.addEventListener('click', () => {
        if (!("Notification" in window)) {
            alert("Este navegador não suporta notificações de desktop.");
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                alert("Notificações ativadas com sucesso!");
                btnAtivarNotificacoes.textContent = "🔔 Notificações Ativadas";
                btnAtivarNotificacoes.style.backgroundColor = "#2ecc71";
                btnAtivarNotificacoes.style.color = "#1b3323";
            } else {
                alert("Permissão de notificação negada.");
            }
        });
    });
}

if (formNovoLembrete) {
    formNovoLembrete.addEventListener('submit', (e) => {
        e.preventDefault();

        const titulo = document.getElementById('lembrete-titulo').value;
        const valor = parseFloat(document.getElementById('lembrete-valor').value) || 0;
        const data = document.getElementById('lembrete-data').value;
        const hora = document.getElementById('lembrete-hora').value;

        const novoLembrete = {
            id: Date.now(),
            titulo,
            valor,
            data,
            hora,
            pago: false,
            notificado: false
        };

        lembretes.push(novoLembrete);
        salvarEAtualizarLembretes();
        formNovoLembrete.reset();
    });
}

function salvarEAtualizarLembretes() {
    localStorage.setItem('lembretes_capivara', JSON.stringify(lembretes));
    renderizarLembretes();
}

function renderizarLembretes() {
    if (!containerListaLembretes) return;

    containerListaLembretes.innerHTML = '';

    if (lembretes.length === 0) {
        containerListaLembretes.innerHTML = '<p style="text-align: center; color: #a3c1ad; padding: 15px;">Nenhum lembrete cadastrado.</p>';
        return;
    }

    // Ordena por data e hora mais próxima
    lembretes.sort((a, b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));

    lembretes.forEach(lembrete => {
        const card = document.createElement('div');
        card.classList.add('card-item-lembrete');
        if (lembrete.pago) card.classList.add('pago');

        const dataFormatada = lembrete.data.split('-').reverse().join('/');

        card.innerHTML = `
            <div class="info-lembrete">
                <h4>${lembrete.titulo}</h4>
                <p>📅 ${dataFormatada} às ${lembrete.hora}</p>
                <div class="valor-lembrete">R$ ${lembrete.valor.toFixed(2)}</div>
            </div>
            <div class="acoes-lembrete">
                <button type="button" class="btn-acao-lembrete" onclick="alternarPagoLembrete(${lembrete.id})" title="Marcar como Pago">
                    ${lembrete.pago ? '✅' : '✔️'}
                </button>
                <button type="button" class="btn-acao-lembrete" onclick="excluirLembrete(${lembrete.id})" title="Excluir">
                    🗑️
                </button>
            </div>
        `;

        containerListaLembretes.appendChild(card);
    });
}

window.alternarPagoLembrete = function(id) {
    lembretes = lembretes.map(l => {
        if (l.id === id) {
            l.pago = !l.pago;
        }
        return l;
    });
    salvarEAtualizarLembretes();
}

window.excluirLembrete = function(id) {
    lembretes = lembretes.filter(l => l.id !== id);
    salvarEAtualizarLembretes();
}

// Verificação periódica de alarmes (a cada 30 segundos)
setInterval(() => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const dataAtualStr = `${ano}-${mes}-${dia}`;
    const horaAtualStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    lembretes.forEach(lembrete => {
        if (!lembrete.pago && !lembrete.notificado && lembrete.data === dataAtualStr && lembrete.hora === horaAtualStr) {
            lembrete.notificado = true;
            
            // 1. Registra no sininho
            adicionarNovaNotificacao(lembrete.titulo, lembrete.valor);

            // 2. Alerta visual na tela
            alert(`⏰ HORA DO PAGAMENTO!\n\nLembrete: ${lembrete.titulo}\nValor: R$ ${lembrete.valor.toFixed(2)}`);

            // 3. Notificação nativa do sistema operacional
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Lembrete de Pagamento - Capivara do Senac", {
                    body: `Está na hora de pagar: ${lembrete.titulo} (R$ ${lembrete.valor.toFixed(2)})`
                });
            }
            salvarEAtualizarLembretes();
        }
    });
}, 30000);

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    renderizarSemana();
    renderizarLembretes();
}); 
// --- FUNÇÕES OPERACIONAIS DO PAINEL ADMIN ---

function carregarTabelaUsuariosAdmin() {
    const corpoTabela = document.getElementById('admin-corpo-tabela-usuarios');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    let usuariosEncontrados = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        // Identifica contas de usuários (chaves que contêm '@' e não são metadados)
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
        carregarTabelaUsuariosAdmin();
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

        // Salva uma notificação global que será lida por qualquer sessão ativa
        const avisoGlobal = {
            id: Date.now(),
            titulo: `[AVISO ADMIN] ${titulo}`,
            valor: texto, // reaproveitamos o campo para exibir a mensagem
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
