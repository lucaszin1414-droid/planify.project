// =====================================================
// PlaniFy - atividades.js
// Várias atividades dentro da mesma hora, cada uma com o seu valor no financeiro.
// Carregue DEPOIS do script.js e do extras.js (e antes do landing.js).
//
// Modelo novo:  atividades["AAAA-MM-DD"]["hora-dia"] = [ { id, texto, valor, tipo } ]
// Os campos antigos (agenda / financeiro) continuam no documento do usuário como
// cópia de segurança e só são lidos uma vez, para migrar quem já tinha dados.
// =====================================================
(function () {
    'use strict';

    const MAX_POR_HORA = 5;

    const centavos = (n) => Math.round((Number(n) || 0) * 100);
    const reais = (c) => `R$ ${(c / 100).toFixed(2)}`;

    let atividadesPorSemana = {};
    let migrouAgora = false;
    let contadorId = 0;

    // ---------- Dados ----------
    function novoId() {
        contadorId = (contadorId + 1) % 1000;
        return Date.now() * 1000 + contadorId;
    }

    function novoItem(texto) {
        return { id: novoId(), texto: texto || '', valor: 0, tipo: 'entrada' };
    }

    const preenchida = (a) => !!(a && (a.texto || Number(a.valor) > 0));

    function lista(chave, h, d) {
        const semana = atividadesPorSemana[chave];
        return (semana && semana[`${h}-${d}`]) || [];
    }

    function listaCriando(chave, campo) {
        const semana = atividadesPorSemana[chave] || (atividadesPorSemana[chave] = {});
        return semana[campo] || (semana[campo] = []);
    }

    // Toda célula da semana aberta tem pelo menos uma linha para digitar
    // (as linhas vazias nunca vão para a nuvem: veja limpar()).
    function garantirSemana(chave) {
        for (let h = 0; h < TOTAL_HORAS; h++) {
            for (let d = 0; d < 7; d++) {
                const l = listaCriando(chave, `${h}-${d}`);
                if (!l.length) l.push(novoItem());
            }
        }
    }

    // Normaliza e tira as linhas vazias (usado ao carregar e ao salvar)
    function limpar(origem) {
        const saida = {};
        Object.entries(origem || {}).forEach(([semana, campos]) => {
            const novos = {};
            Object.entries(campos || {}).forEach(([campo, itens]) => {
                const validos = (Array.isArray(itens) ? itens : []).filter(preenchida).map(a => ({
                    id: a.id || novoId(),
                    texto: String(a.texto || ''),
                    valor: Number(a.valor) > 0 ? Number(a.valor) : 0,
                    tipo: a.tipo === 'saida' ? 'saida' : 'entrada'
                }));
                if (validos.length) novos[campo] = validos;
            });
            if (Object.keys(novos).length) saida[semana] = novos;
        });
        return saida;
    }

    // Converte o formato antigo (um texto + um valor por horário) para o novo
    function migrar(agenda, financeiro) {
        const ag = agenda || {};
        const fin = financeiro || {};
        const saida = {};
        new Set([...Object.keys(ag), ...Object.keys(fin)]).forEach(semana => {
            const textos = ag[semana] || {};
            const valores = fin[semana] || {};
            new Set([...Object.keys(textos), ...Object.keys(valores)]).forEach(campo => {
                const texto = String(textos[campo] || '').trim();
                const f = valores[campo];
                const valor = f && Number(f.valor) > 0 ? Number(f.valor) : 0;
                if (!texto && !valor) return;
                if (!saida[semana]) saida[semana] = {};
                saida[semana][campo] = [{ id: novoId(), texto, valor, tipo: f && f.tipo === 'saida' ? 'saida' : 'entrada' }];
            });
        });
        return saida;
    }

    function carregar(dados) {
        migrouAgora = false;
        if (dados && dados.atividades && typeof dados.atividades === 'object') {
            atividadesPorSemana = limpar(dados.atividades);
        } else {
            atividadesPorSemana = migrar(dados && dados.agenda, dados && dados.financeiro);
            migrouAgora = Object.keys(atividadesPorSemana).length > 0;
        }
    }

    function itensDaSemana(chave) {
        const saida = [];
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < TOTAL_HORAS; h++) {
                lista(chave, h, d).forEach(a => {
                    if (!preenchida(a)) return;
                    saida.push({
                        campo: `${h}-${d}`, h, d, id: a.id, texto: a.texto,
                        valor: Number(a.valor) > 0 ? Number(a.valor) : 0, tipo: a.tipo
                    });
                });
            }
        }
        return saida;
    }

    // Usado por "Copiar semana anterior" e "Atividade repetida"
    function inserirTexto(chave, campo, texto) {
        const l = listaCriando(chave, campo);
        if (l.some(a => a.texto === texto)) return 'repetido';
        const vazio = l.find(a => !preenchida(a));
        if (vazio) { vazio.texto = texto; return 'ok'; }
        if (l.length >= MAX_POR_HORA) return 'cheio';
        l.push(novoItem(texto));
        return 'ok';
    }

    function textosParaCopiar(origem, destino) {
        const novos = [];
        itensDaSemana(origem).forEach(it => {
            if (!it.texto) return;
            const noDestino = (atividadesPorSemana[destino] && atividadesPorSemana[destino][it.campo]) || [];
            if (!noDestino.some(a => a.texto === it.texto)) novos.push({ campo: it.campo, texto: it.texto });
        });
        return novos;
    }

    function copiarTextos(destino, novos) {
        let colocados = 0;
        novos.forEach(x => { if (inserirTexto(destino, x.campo, x.texto) === 'ok') colocados++; });
        return colocados;
    }

    // ---------- Interface ----------
    function focarNoFim(el) {
        el.focus();
        const faixa = document.createRange();
        faixa.selectNodeContents(el);
        faixa.collapse(false);
        const selecao = window.getSelection();
        selecao.removeAllRanges();
        selecao.addRange(faixa);
    }

    function colarSoTexto(e) {
        e.preventDefault();
        const texto = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\s+/g, ' ');
        document.execCommand('insertText', false, texto);
    }

    function espelhar(h, d, item) {
        const span = document.querySelector(`#fin-cel-${h}-${d} [data-id="${item.id}"] .atividade-info-financeiro`);
        if (!span) return;
        span.textContent = item.texto || '-';
        span.title = item.texto || '';
    }

    function aposMudar() {
        sincronizarDadosComNuvem();
        calcularBalancos();
        if (modoAgenda === 'mensal') atualizarCalendario();
        atualizarNotaAoVivo();
        ext('aoMudarFinanceiro');
    }

    function adicionarVazio(h, d) {
        const chave = chaveDia(semanaSelecionada);
        const l = listaCriando(chave, `${h}-${d}`);
        const vazio = l.find(a => !preenchida(a));
        if (vazio) return vazio;
        if (l.length >= MAX_POR_HORA) {
            mostrarToast(`Limite de ${MAX_POR_HORA} atividades por horário.`);
            return null;
        }
        const novo = novoItem();
        l.push(novo);
        return novo;
    }

    async function removerItem(h, d, id) {
        const chave = chaveDia(semanaSelecionada);
        const campo = `${h}-${d}`;
        const atual = lista(chave, h, d);
        const item = atual.find(a => String(a.id) === String(id));
        if (!item) return;

        if (Number(item.valor) > 0) {
            const ok = await confirmarAcao({
                titulo: 'Remover atividade?',
                mensagem: `"${item.texto || 'Lançamento financeiro'}" tem ${reais(centavos(item.valor))} lançado no financeiro. Remover apaga a atividade e o valor.`,
                confirmar: 'Remover',
                perigo: true
            });
            if (!ok) return;
        }

        const resto = atual.filter(a => a !== item);
        if (!resto.length) resto.push(novoItem());
        atividadesPorSemana[chave][campo] = resto;
        renderizarCelulas(h, d);
        aposMudar();
    }

    function criarLinhaAgenda(h, d, item, total) {
        const linha = document.createElement('div');
        linha.className = 'ativ-linha';
        linha.dataset.id = item.id;

        const campo = document.createElement('div');
        campo.className = 'ativ-texto';
        campo.contentEditable = 'true';
        campo.textContent = item.texto;

        campo.addEventListener('input', () => {
            item.texto = campo.textContent.replace(/\s+/g, ' ').trim();
            espelhar(h, d, item);
            sincronizarDadosComNuvem();
            if (modoAgenda === 'mensal') atualizarCalendario();
            atualizarNotaAoVivo();
        });

        // Enter abre outra atividade no mesmo horário (se esta já tem texto)
        campo.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (!item.texto) return;
            const novo = adicionarVazio(h, d);
            if (novo) renderizarCelulas(h, d, novo.id);
        });
        campo.addEventListener('paste', colarSoTexto);
        linha.appendChild(campo);

        if (total > 1) {
            const remover = document.createElement('button');
            remover.type = 'button';
            remover.className = 'ativ-remover';
            remover.title = 'Remover esta atividade';
            remover.setAttribute('aria-label', 'Remover esta atividade');
            remover.textContent = '×';
            remover.addEventListener('click', () => removerItem(h, d, item.id));
            linha.appendChild(remover);
        }
        return linha;
    }

    function preencherCelulaAgenda(td, h, d) {
        const itens = lista(chaveDia(semanaSelecionada), h, d);
        td.innerHTML = '';

        const caixa = document.createElement('div');
        caixa.className = 'ativ-celula';
        itens.forEach(item => caixa.appendChild(criarLinhaAgenda(h, d, item, itens.length)));

        if (itens.length < MAX_POR_HORA) {
            const mais = document.createElement('button');
            mais.type = 'button';
            mais.className = 'ativ-adicionar';
            mais.title = 'Adicionar outra atividade neste horário';
            mais.setAttribute('aria-label', 'Adicionar outra atividade neste horário');
            mais.textContent = '+';
            mais.addEventListener('click', () => {
                const novo = adicionarVazio(h, d);
                if (novo) renderizarCelulas(h, d, novo.id);
            });
            caixa.appendChild(mais);
        }
        td.appendChild(caixa);
    }

    function criarLinhaFinanceira(item) {
        const linha = document.createElement('div');
        linha.className = 'fin-linha';
        linha.dataset.id = item.id;

        const span = document.createElement('span');
        span.className = 'atividade-info-financeiro';
        span.textContent = item.texto || '-';
        span.title = item.texto || '';

        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.placeholder = 'R$ 0,00';
        input.className = 'input-valor-financeiro';

        if (Number(item.valor) > 0) {
            input.value = item.valor;
            input.classList.add(item.tipo === 'saida' ? 'valor-saida' : 'valor-entrada');
            const categoria = ext('categoriaDe', item.texto, item);
            if (categoria) input.title = categoria;
        }

        const aoMudar = () => {
            const valor = parseFloat(input.value) || 0;
            item.valor = valor > 0 ? valor : 0;
            if (valor > 0) {
                item.tipo = tipoTransacaoAtual;
                input.classList.toggle('valor-entrada', item.tipo === 'entrada');
                input.classList.toggle('valor-saida', item.tipo !== 'entrada');
            } else {
                input.classList.remove('valor-entrada', 'valor-saida');
            }
            aposMudar();
        };
        input.addEventListener('input', aoMudar);
        input.addEventListener('change', aoMudar);

        linha.appendChild(span);
        linha.appendChild(input);
        return linha;
    }

    function preencherCelulaFinanceira(td, h, d) {
        td.innerHTML = '';
        const caixa = document.createElement('div');
        caixa.className = 'celula-financeira-container';
        lista(chaveDia(semanaSelecionada), h, d).forEach(item => caixa.appendChild(criarLinhaFinanceira(item)));
        td.appendChild(caixa);
    }

    // Redesenha só a célula mexida (agenda + financeiro) para não perder o cursor
    function renderizarCelulas(h, d, focoId) {
        const tdAgenda = document.getElementById(`agenda-cel-${h}-${d}`);
        if (tdAgenda) preencherCelulaAgenda(tdAgenda, h, d);
        const tdFin = document.getElementById(`fin-cel-${h}-${d}`);
        if (tdFin) preencherCelulaFinanceira(tdFin, h, d);
        if (focoId) {
            const alvo = document.querySelector(`#agenda-cel-${h}-${d} [data-id="${focoId}"] .ativ-texto`);
            if (alvo) focarNoFim(alvo);
        }
    }

    // ---------- Funções do script.js que passam a usar o modelo novo ----------
    window.textoAgenda = function (chave, h, d) {
        return lista(chave, h, d).map(a => a.texto).filter(Boolean).join(' + ');
    };

    window.gerarTabelaAgenda = function () {
        const corpo = document.getElementById('corpo-tabela-agenda');
        if (!corpo) return;
        corpo.innerHTML = '';

        const chave = chaveDia(semanaSelecionada);
        const hoje = new Date();
        garantirSemana(chave);

        for (let h = 0; h < TOTAL_HORAS; h++) {
            const tr = document.createElement('tr');
            const tdHorario = document.createElement('td');
            tdHorario.textContent = formatarHora(h);
            tdHorario.classList.add('coluna-horario');
            tr.appendChild(tdHorario);

            for (let d = 0; d < 7; d++) {
                const td = document.createElement('td');
                td.id = `agenda-cel-${h}-${d}`;
                td.classList.add('celula-agenda');
                if (mesmoDia(adicionarDias(semanaSelecionada, d), hoje)) td.classList.add('coluna-hoje');
                preencherCelulaAgenda(td, h, d);
                tr.appendChild(td);
            }
            corpo.appendChild(tr);
        }
    };

    window.gerarTabelaFinanceira = function () {
        const corpo = document.getElementById('corpo-tabela-financeira');
        if (!corpo) return;
        corpo.innerHTML = '';

        const chave = chaveDia(semanaSelecionada);
        const hoje = new Date();
        garantirSemana(chave);

        for (let h = 0; h < TOTAL_HORAS; h++) {
            const tr = document.createElement('tr');
            const tdHorario = document.createElement('td');
            tdHorario.textContent = formatarHora(h);
            tdHorario.classList.add('coluna-horario');
            tr.appendChild(tdHorario);

            for (let d = 0; d < 7; d++) {
                const td = document.createElement('td');
                td.id = `fin-cel-${h}-${d}`;
                if (mesmoDia(adicionarDias(semanaSelecionada, d), hoje)) td.classList.add('coluna-hoje');
                preencherCelulaFinanceira(td, h, d);
                tr.appendChild(td);
            }
            corpo.appendChild(tr);
        }
        gerarLinhaBalancoDiario();
        calcularBalancos();
    };

    window.atualizarEspelhamentoEBalancos = function () {
        calcularBalancos();
    };

    window.calcularBalancos = function () {
        const chave = chaveDia(semanaSelecionada);
        let totalE = 0;
        let totalS = 0;

        for (let d = 0; d < 7; d++) {
            let saldo = 0;
            for (let h = 0; h < TOTAL_HORAS; h++) {
                lista(chave, h, d).forEach(a => {
                    const c = centavos(a.valor);
                    if (c <= 0) return;
                    if (a.tipo === 'entrada') { saldo += c; totalE += c; }
                    else { saldo -= c; totalS += c; }
                });
            }
            const td = document.getElementById(`balanco-dia-${d}`);
            if (td) {
                td.textContent = reais(saldo);
                td.style.color = saldo > 0 ? '#2ecc71' : (saldo < 0 ? '#e74c3c' : '');
            }
        }

        const resE = document.getElementById('resumo-total-entradas');
        const resS = document.getElementById('resumo-total-saidas');
        const resB = document.getElementById('resumo-balanco-geral');
        if (resE) resE.textContent = reais(totalE);
        if (resS) resS.textContent = reais(totalS);
        if (resB) {
            resB.textContent = reais(totalE - totalS);
            resB.style.color = totalE - totalS >= 0 ? '#2ecc71' : '#e74c3c';
        }
    };

    window.atualizarResumoSemanal = function () {
        const alvo = document.getElementById('detalhes-lista-financeira');
        if (!alvo) return;
        alvo.innerHTML = '';

        const chave = chaveDia(semanaSelecionada);
        let achou = false;

        for (let d = 0; d < 7; d++) {
            const data = adicionarDias(semanaSelecionada, d);
            for (let h = 0; h < TOTAL_HORAS; h++) {
                lista(chave, h, d).forEach(item => {
                    if (!(Number(item.valor) > 0)) return;
                    achou = true;
                    const entrada = item.tipo === 'entrada';
                    const categoria = ext('categoriaDe', item.texto, item) || 'Outros';
                    const linha = document.createElement('div');
                    linha.classList.add('item-transacao-detalhe');
                    linha.innerHTML = `
                        <span><strong>${diasDaSemana[d]} ${formatarDataCurta(data)} (${formatarHora(h)})</strong> - ${escapeXML(item.texto || 'Sem nome')} · ${escapeXML(categoria)}</span>
                        <span style="color: ${entrada ? '#2ecc71' : '#e74c3c'};"><strong>${entrada ? '+' : '-'} R$ ${Number(item.valor).toFixed(2)}</strong></span>
                    `;
                    alvo.appendChild(linha);
                });
            }
        }

        if (!achou) alvo.innerHTML = '<p style="text-align: center; color: #aaaaaa; padding: 10px;">Nenhuma movimentação lançada nesta semana.</p>';
        ext('aoAtualizarResumo');
    };

    window.coletarDadosDaNota = function () {
        const chave = chaveDia(semanaSelecionada);
        const dias = [];
        for (let d = 0; d < 7; d++) {
            const itens = [];
            for (let h = 0; h < TOTAL_HORAS; h++) {
                lista(chave, h, d).forEach(a => {
                    const valor = Number(a.valor) > 0 ? Number(a.valor) : 0;
                    if (!a.texto && !valor) return;
                    const categoria = valor > 0 ? ` (${ext('categoriaDe', a.texto, a) || 'Outros'})` : '';
                    itens.push({
                        hora: formatarHora(h),
                        atividade: (a.texto || 'Lançamento financeiro') + categoria,
                        tipo: valor > 0 ? (a.tipo === 'saida' ? 'saida' : 'entrada') : '',
                        valor
                    });
                });
            }
            dias.push({ itens });
        }
        return { usuario: usuarioLogadoNome || 'Usuário PlaniFy', semanaInicio: semanaSelecionada, emissao: new Date(), dias };
    };

    // Conta atividades preenchidas (alimenta "Registros Globais" do painel admin)
    window.contarRegistros = function () {
        let total = 0;
        Object.values(atividadesPorSemana).forEach(campos => {
            Object.values(campos).forEach(itens => { total += itens.filter(preenchida).length; });
        });
        return total;
    };

    function temAtividadeNoDia(chaveLinha, d) {
        const campos = atividadesPorSemana[chaveLinha];
        if (!campos) return false;
        return Object.entries(campos).some(([campo, itens]) => campo.endsWith(`-${d}`) && itens.some(preenchida));
    }

    window.atualizarCalendario = function () {
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

            const linha = document.createElement('div');
            linha.classList.add('calendario-semana');
            if (chaveLinha === chaveSelecionada) linha.classList.add('selecionada');

            for (let d = 0; d < 7; d++) {
                const data = adicionarDias(inicioDestaLinha, d);
                const celula = document.createElement('div');
                celula.classList.add('calendario-dia');
                if (data.getMonth() !== mes) celula.classList.add('fora-do-mes');
                if (mesmoDia(data, hoje)) celula.classList.add('hoje');
                if (temAtividadeNoDia(chaveLinha, d)) celula.classList.add('tem-atividade');
                const numero = document.createElement('span');
                numero.textContent = data.getDate();
                celula.appendChild(numero);
                linha.appendChild(celula);
            }

            linha.addEventListener('click', () => selecionarSemanaNoCalendario(inicioDestaLinha));
            grade.appendChild(linha);
            inicioLinha = adicionarDias(inicioLinha, 7);
        }
    };

    // ---------- Ligação com o extras.js ----------
    window.PlanifyAtividades = { itensDaSemana, inserirTexto, textosParaCopiar, copiarTextos };

    const extras = window.PlanifyExtras;
    if (extras) {
        const original = {
            payload: extras.payload,
            aoCarregarDados: extras.aoCarregarDados,
            aoLimparSessao: extras.aoLimparSessao
        };

        extras.payload = function () {
            const base = original.payload ? original.payload() : {};
            return Object.assign({}, base, { atividades: limpar(atividadesPorSemana) });
        };

        extras.aoCarregarDados = function (dados) {
            carregar(dados);
            if (original.aoCarregarDados) original.aoCarregarDados.call(extras, dados);
            if (migrouAgora) sincronizarDadosComNuvem(); // grava o formato novo logo na primeira vez
        };

        extras.aoLimparSessao = function () {
            atividadesPorSemana = {};
            migrouAgora = false;
            if (original.aoLimparSessao) original.aoLimparSessao.call(extras);
        };
    }
})();
