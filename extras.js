// =====================================================
// PlaniFy - extras.js
// Categorias + gráfico, orçamento semanal, metas, dica do dia,
// copiar semana, atividades repetidas, exportar Excel, tema claro/escuro,
// instalar como app (PWA), hora atual na grade e avisos no painel admin.
// Depende do script.js (carregue DEPOIS dele) e do atividades.js (carregue DEPOIS deste).
// =====================================================
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const dinheiro = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const arredondar = (n) => Math.round((Number(n) || 0) * 100) / 100;

    // ---------- Estado guardado na conta (vai junto no sincronizarAgora) ----------
    let config = { orcamentoSemanal: 0, alertas: {} };
    let metas = [];

    // ---------- Categorias ----------
    const CATEGORIAS = {
        saida: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Contas', 'Compras', 'Outros'],
        entrada: ['Salário', 'Mesada', 'Extra/Freelance', 'Presente', 'Outros']
    };
    const ICONES = {
        'Alimentação': '🍽️', 'Transporte': '🚌', 'Moradia': '🏠', 'Saúde': '💊', 'Educação': '📚',
        'Lazer': '🎮', 'Contas': '🧾', 'Compras': '🛍️', 'Outros': '📦', 'Sem categoria': '▫️',
        'Salário': '💼', 'Mesada': '👛', 'Extra/Freelance': '🛠️', 'Presente': '🎁'
    };
    const CORES = {
        'Alimentação': '#e67e22', 'Transporte': '#3498db', 'Moradia': '#9b59b6', 'Saúde': '#e74c3c',
        'Educação': '#1abc9c', 'Lazer': '#f1c40f', 'Contas': '#95a5a6', 'Compras': '#e84393',
        'Outros': '#7f8c8d', 'Sem categoria': '#586e63'
    };

    // A categoria vem do texto que você já escreve na Organização Semanal.
    // Ex.: "Mercado" -> Alimentação, "Uber" -> Transporte, "Conta de luz" -> Contas.
    const PALAVRAS = {
        saida: [
            ['Saúde', ['farmacia', 'remedio', 'medico', 'consulta', 'dentista', 'exame', 'hospital', 'academia', 'psicolog', 'terapia', 'plano de saude', 'oculos', 'vacina', 'saude']],
            ['Moradia', ['aluguel', 'condominio', 'iptu', 'reforma', 'movel', 'moveis', 'casa', 'faxina', 'encanador', 'eletricista', 'gas']],
            ['Transporte', ['uber', '99', 'taxi', 'onibus', 'passagem', 'gasolina', 'combustivel', 'metro', 'estacionamento', 'pedagio', 'moto', 'carro', 'bilhete', 'trem', 'mecanico', 'oficina', 'ipva', 'etanol']],
            ['Alimentação', ['mercado', 'supermercado', 'almoco', 'jantar', 'lanche', 'cafe', 'padaria', 'restaurante', 'pizza', 'hamburguer', 'comida', 'ifood', 'delivery', 'feira', 'acougue', 'acai', 'sorvete', 'doce', 'bebida', 'refeicao', 'marmita', 'salgado', 'pao', 'churrasco', 'hortifruti', 'sacolao']],
            ['Educação', ['curso', 'escola', 'faculdade', 'mensalidade', 'livro', 'apostila', 'matricula', 'material escolar', 'caderno', 'prova', 'enem', 'inscricao']],
            ['Lazer', ['cinema', 'jogo', 'game', 'show', 'festa', 'viagem', 'passeio', 'bar', 'balada', 'parque', 'clube', 'ingresso', 'hotel', 'role', 'rolê', 'churras']],
            ['Compras', ['roupa', 'sapato', 'tenis', 'camisa', 'calca', 'presente', 'shopping', 'loja', 'eletronico', 'fone', 'amazon', 'shopee', 'cosmetico', 'perfume', 'salao', 'barbearia', 'cabelo', 'mercado livre']],
            ['Contas', ['luz', 'energia', 'agua', 'internet', 'telefone', 'celular', 'plano', 'boleto', 'fatura', 'cartao', 'conta', 'imposto', 'taxa', 'seguro', 'assinatura', 'netflix', 'spotify', 'wifi', 'recarga', 'parcela', 'emprestimo', 'financiamento']]
        ],
        entrada: [
            ['Mesada', ['mesada']],
            ['Salário', ['salario', 'pagamento', 'holerite', 'estagio', 'bolsa', '13', 'ferias', 'adiantamento']],
            ['Extra/Freelance', ['freela', 'freelance', 'extra', 'bico', 'venda', 'vendi', 'servico', 'projeto', 'comissao', 'rendimento', 'reembolso']],
            ['Presente', ['presente', 'ganhei', 'doacao', 'premio']]
        ]
    };

    function normalizar(texto) {
        return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function montarRegras(lista) {
        return lista.map(([nome, palavras]) => {
            const partes = palavras.map(p => {
                const base = normalizar(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // palavras curtas só valem inteiras (evita "bar" dentro de "barato")
                return base.length <= 4 ? `\\b${base}s?\\b` : `\\b${base}`;
            });
            return [nome, new RegExp(partes.join('|'))];
        });
    }

    const REGRAS = { saida: montarRegras(PALAVRAS.saida), entrada: montarRegras(PALAVRAS.entrada) };

    function categoriaDe(texto, item) {
        const tipo = item && item.tipo === 'entrada' ? 'entrada' : 'saida';
        const alvo = normalizar(texto);
        if (alvo) {
            for (const [nome, regex] of REGRAS[tipo]) {
                if (regex.test(alvo)) return nome;
            }
        }
        // lançamentos antigos que já tinham categoria escolhida à mão
        if (item && item.categoria && item.categoria !== 'Sem categoria') return item.categoria;
        return 'Outros';
    }

    // ---------- Dados da semana (vêm do atividades.js: várias atividades por hora) ----------
    function itensDaSemana() {
        const chave = chaveDia(semanaSelecionada);
        const lista = window.PlanifyAtividades ? window.PlanifyAtividades.itensDaSemana(chave) : [];
        return lista
            .filter(i => Number(i.valor) > 0)
            .map(i => ({ ...i, categoriaAuto: categoriaDe(i.texto, i) }));
    }

    function gastosDaSemana() {
        return arredondar(itensDaSemana().filter(i => i.tipo === 'saida').reduce((s, i) => s + Number(i.valor), 0));
    }

    function gastosPorCategoria() {
        const mapa = {};
        itensDaSemana().filter(i => i.tipo === 'saida').forEach(i => {
            const cat = i.categoriaAuto || 'Outros';
            mapa[cat] = arredondar((mapa[cat] || 0) + Number(i.valor));
        });
        return mapa;
    }

    // ---------- Gráfico de gastos por categoria ----------
    function renderizarGrafico() {
        const alvo = $('grafico-categorias');
        if (!alvo) return;
        const lista = Object.entries(gastosPorCategoria()).sort((a, b) => b[1] - a[1]);
        const total = lista.reduce((s, [, v]) => s + v, 0);

        if (!lista.length) {
            alvo.innerHTML = '<p class="vazio-extra">Nenhum gasto lançado nesta semana.</p>';
            return;
        }

        alvo.innerHTML = '';
        lista.forEach(([nome, valor]) => {
            const pct = total ? (valor / total) * 100 : 0;
            const linha = document.createElement('div');
            linha.className = 'grafico-linha';
            linha.innerHTML = `
                <span class="grafico-nome">${ICONES[nome] || '▫️'} ${escapeXML(nome)}</span>
                <div class="barra-progresso"><div style="width:${pct.toFixed(1)}%; background:${CORES[nome] || '#7f8c8d'}"></div></div>
                <span class="grafico-valor">${dinheiro(valor)} · ${pct.toFixed(0)}%</span>
            `;
            alvo.appendChild(linha);
        });
    }

    // ---------- Orçamento semanal ----------
    function renderizarOrcamento() {
        const barra = $('orcamento-barra');
        const texto = $('orcamento-texto');
        const campo = $('orcamento-limite');
        if (!barra || !texto) return;

        const limite = Number(config.orcamentoSemanal) || 0;
        if (campo && document.activeElement !== campo) campo.value = limite > 0 ? limite : '';

        if (limite <= 0) {
            barra.style.width = '0%';
            texto.textContent = 'Defina um limite de gastos para a semana e acompanhe aqui.';
            return;
        }

        const gastos = gastosDaSemana();
        const pct = (gastos / limite) * 100;
        barra.style.width = Math.min(100, pct).toFixed(1) + '%';
        barra.style.background = pct >= 100 ? '#e74c3c' : (pct >= 80 ? '#f39c12' : '#2ecc71');

        texto.textContent = pct >= 100
            ? `Você gastou ${dinheiro(gastos)} de ${dinheiro(limite)} (${pct.toFixed(0)}%) e passou ${dinheiro(gastos - limite)} do limite.`
            : `Você gastou ${dinheiro(gastos)} de ${dinheiro(limite)} (${pct.toFixed(0)}%). Ainda restam ${dinheiro(limite - gastos)}.`;
    }

    // Avisa quando passa de 80% e de 100% (uma vez por semana e por nível)
    function verificarOrcamento() {
        const limite = Number(config.orcamentoSemanal) || 0;
        if (limite <= 0) return;

        const chave = chaveDia(semanaSelecionada);
        const gastos = gastosDaSemana();
        const pct = (gastos / limite) * 100;
        const nivel = pct >= 100 ? 100 : (pct >= 80 ? 80 : 0);
        if (!nivel) return;

        const marca = `${chave}:${nivel}`;
        if (config.alertas[marca]) return;
        config.alertas[`${chave}:80`] = true;
        config.alertas[marca] = true;

        // mantém só as marcas mais recentes
        const chaves = Object.keys(config.alertas).sort();
        while (chaves.length > 40) delete config.alertas[chaves.shift()];

        const titulo = nivel === 100 ? 'Orçamento da semana estourado' : 'Atenção ao orçamento da semana';
        const texto = nivel === 100
            ? `Você gastou ${dinheiro(gastos)} e passou do limite de ${dinheiro(limite)}.`
            : `Você já usou ${pct.toFixed(0)}% do limite de ${dinheiro(limite)} (gastou ${dinheiro(gastos)}).`;

        notifsPessoais.unshift({ id: `orc-${chave}-${nivel}`, titulo, texto, timestamp: Date.now() });
        notifsPessoais = notifsPessoais.slice(0, 30);
        mostrarToast(`${nivel === 100 ? '🚨' : '⚠️'} ${titulo}: ${texto}`);
        renderizarPainelNotificacoes();
        sincronizarDadosComNuvem();
    }

    function ligarFormOrcamento() {
        const form = $('form-orcamento');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const valor = arredondar(parseFloat($('orcamento-limite').value));
            if (!(valor >= 0)) return alert('Digite um valor válido.');
            config.orcamentoSemanal = valor;
            // limite novo: libera os avisos da semana atual de novo
            const chave = chaveDia(semanaSelecionada);
            delete config.alertas[`${chave}:80`];
            delete config.alertas[`${chave}:100`];
            sincronizarDadosComNuvem();
            renderizarOrcamento();
            mostrarToast(valor > 0 ? `✅ Limite semanal salvo: ${dinheiro(valor)}` : '✅ Limite removido');
            verificarOrcamento();
        });
    }

    // ---------- Metas de economia ----------
    function renderizarMetas() {
        const lista = $('lista-metas');
        if (!lista) return;

        if (!metas.length) {
            lista.innerHTML = '<p class="notif-vazia">Nenhuma meta criada ainda</p>';
            return;
        }

        lista.innerHTML = '';
        metas.forEach(m => {
            const alvo = Number(m.alvo) || 0;
            const guardado = Number(m.guardado) || 0;
            const pct = alvo > 0 ? Math.min(100, (guardado / alvo) * 100) : 0;
            const falta = Math.max(0, arredondar(alvo - guardado));
            const atingida = guardado >= alvo;

            let info;
            if (atingida) {
                info = '🎉 Meta atingida! Parabéns!';
            } else if (m.prazo) {
                const dias = Math.ceil((new Date(m.prazo + 'T23:59:59') - new Date()) / 86400000);
                const [a, mm, d] = m.prazo.split('-');
                if (dias > 0) {
                    const semanas = Math.max(1, Math.ceil(dias / 7));
                    info = `Faltam ${dinheiro(falta)} · prazo ${d}/${mm}/${a} (${dias} dia${dias === 1 ? '' : 's'}) · guarde cerca de ${dinheiro(falta / semanas)} por semana`;
                } else {
                    info = `Faltam ${dinheiro(falta)} · o prazo (${d}/${mm}/${a}) já passou`;
                }
            } else {
                info = `Faltam ${dinheiro(falta)}`;
            }

            const card = document.createElement('div');
            card.className = 'meta-card' + (atingida ? ' meta-atingida' : '');
            card.dataset.id = m.id;
            card.innerHTML = `
                <div class="meta-topo">
                    <h4>${escapeXML(m.nome)}</h4>
                    <button type="button" class="btn-acao-lembrete" data-acao="excluir" title="Excluir meta">🗑</button>
                </div>
                <div class="barra-progresso"><div style="width:${pct.toFixed(1)}%; background:${atingida ? '#2ecc71' : '#8fc7a8'}"></div></div>
                <p class="meta-valores">${dinheiro(guardado)} de ${dinheiro(alvo)} (${pct.toFixed(0)}%)</p>
                <p class="meta-info">${escapeXML(info)}</p>
                <div class="meta-acoes">
                    <input type="number" step="0.01" min="0" placeholder="Valor (R$)" class="meta-input-valor">
                    <button type="button" data-acao="guardar">+ Guardar</button>
                    <button type="button" data-acao="retirar">− Retirar</button>
                </div>
            `;
            lista.appendChild(card);
        });
    }

    function alterarMeta(id, delta) {
        const meta = metas.find(m => String(m.id) === String(id));
        if (!meta) return;
        const antes = Number(meta.guardado) || 0;
        meta.guardado = Math.max(0, arredondar(antes + delta));
        if (delta > 0 && antes < meta.alvo && meta.guardado >= meta.alvo) {
            mostrarToast(`🎉 Meta atingida: ${meta.nome}!`);
        }
        sincronizarDadosComNuvem();
        renderizarMetas();
    }

    function ligarMetas() {
        const form = $('form-nova-meta');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const nome = $('meta-nome').value.trim();
                const alvo = arredondar(parseFloat($('meta-valor').value));
                const prazo = $('meta-prazo').value;
                if (!nome || !(alvo > 0)) return alert('Informe o nome e um valor maior que zero.');
                if (metas.length >= 10) return alert('Você pode ter até 10 metas ao mesmo tempo.');
                metas.push({ id: Date.now(), nome, alvo, prazo: prazo || '', guardado: 0 });
                form.reset();
                sincronizarDadosComNuvem();
                renderizarMetas();
            });
        }

        const lista = $('lista-metas');
        if (lista) {
            lista.addEventListener('click', (e) => {
                const botao = e.target.closest('button[data-acao]');
                if (!botao) return;
                const card = botao.closest('.meta-card');
                if (!card) return;
                const id = card.dataset.id;
                const acao = botao.dataset.acao;

                if (acao === 'excluir') {
                    if (!confirm('Excluir esta meta?')) return;
                    metas = metas.filter(m => String(m.id) !== String(id));
                    sincronizarDadosComNuvem();
                    renderizarMetas();
                    return;
                }

                const valor = arredondar(parseFloat(card.querySelector('.meta-input-valor').value));
                if (!(valor > 0)) return alert('Digite um valor maior que zero.');
                alterarMeta(id, acao === 'guardar' ? valor : -valor);
            });
        }
    }

    // ---------- Dica financeira do dia ----------
    const DICAS = [
        'Regra 50-30-20: use cerca de 50% da renda para necessidades, 30% para desejos e 20% para poupar ou quitar dívidas.',
        'Reserva de emergência: o ideal é juntar de 3 a 6 meses dos seus gastos essenciais, em um lugar seguro e de fácil resgate.',
        'Anote todos os gastos por uma semana. Só dá para controlar o que você enxerga.',
        'Pague-se primeiro: separe o valor da poupança assim que o dinheiro entrar, e não o que sobrar no fim do mês.',
        'O rotativo do cartão de crédito tem juros altíssimos. Sempre que puder, pague a fatura inteira.',
        'Compra por impulso? Espere 24 horas. Se ainda fizer sentido amanhã, aí compre.',
        'Compare o preço por quilo ou por litro, não só o preço da embalagem.',
        'Gastos pequenos e frequentes (lanche, delivery, apps) somam bastante no fim do mês.',
        'Meta boa tem valor e prazo. "Juntar dinheiro" é vago; "R$ 600 até março" funciona.',
        'Parcelar sem juros ainda compromete os meses seguintes. Some as parcelas antes de comprar.',
        'Se tem mais de uma dívida, comece pela que cobra os juros mais altos.',
        'Revise as assinaturas (streaming, apps) e cancele as que você quase não usa.',
        'Juros compostos: guardar pouco, mas todo mês, cresce bastante com o tempo.',
        'Separe o dinheiro do dia a dia do dinheiro da reserva. Fica mais difícil gastar sem querer.',
        'Cadastre os vencimentos nos lembretes. Atraso gera multa e juros que poderiam ser evitados.',
        'Renda variável? Calcule a média dos últimos meses e viva abaixo dela.',
        'Antes de uma compra grande, pesquise em pelo menos três lugares.',
        'Ir ao mercado com lista e sem fome reduz as compras por impulso.',
        'Dinheiro parado perde valor com a inflação. Para a reserva, prefira opções seguras com resgate rápido.',
        'Orçamento não é proibição: reserve um valor para o lazer e gaste sem culpa dentro dele.',
        'Pense no preço em horas de trabalho: quanto você precisa trabalhar para pagar isso?',
        'Conversar sobre dinheiro com a família evita surpresas e ajuda a decidir em conjunto.',
        'Dedique 10 minutos por semana para revisar suas finanças. O hábito vale mais do que a planilha perfeita.',
        'Confira as tarifas do seu banco e do cartão. Taxas pequenas cobradas todo mês pesam no ano.',
        'O cheque especial tem juros altos. Use só em último caso e por poucos dias.',
        'Antes de emprestar dinheiro, pergunte-se: se eu não receber de volta, vou ficar bem?',
        'Dívida atrasada costuma ter desconto na negociação. Vale ligar e perguntar.',
        'Para metas de curto prazo, como uma viagem, guarde um valor fixo por semana. O PlaniFy calcula quanto na aba Metas.',
        'Cuidado com golpes: nenhuma empresa séria pede sua senha ou um depósito antecipado para liberar dinheiro.',
        'Registrar os gastos é o primeiro passo. O segundo é olhar para eles e decidir o que vale a pena.'
    ];
    let indiceDica = 0;

    // Sorteia uma dica diferente a cada vez que o site é aberto (nunca repete a última)
    function sortearDica() {
        let ultima = -1;
        try { ultima = parseInt(localStorage.getItem('planify_ultima_dica'), 10); } catch (e) {}
        let novo = Math.floor(Math.random() * DICAS.length);
        if (DICAS.length > 1 && novo === ultima) novo = (novo + 1 + Math.floor(Math.random() * (DICAS.length - 1))) % DICAS.length;
        try { localStorage.setItem('planify_ultima_dica', String(novo)); } catch (e) {}
        return novo;
    }

    function renderizarDica() {
        const texto = $('dica-texto');
        if (texto) texto.textContent = DICAS[indiceDica];
    }

    function ligarDica() {
        indiceDica = sortearDica();
        renderizarDica();
        const botao = $('btn-outra-dica');
        if (botao) botao.addEventListener('click', () => {
            indiceDica = (indiceDica + 1) % DICAS.length;
            try { localStorage.setItem('planify_ultima_dica', String(indiceDica)); } catch (e) {}
            renderizarDica();
        });
    }

    // ---------- Copiar semana anterior ----------
    function copiarSemanaAnterior() {
        const A = window.PlanifyAtividades;
        if (!A) return;
        const atual = chaveDia(semanaSelecionada);
        const anterior = chaveDia(adicionarDias(semanaSelecionada, -7));
        const novos = A.textosParaCopiar(anterior, atual);

        if (!novos.length) return alert('Não há atividades novas para copiar da semana anterior (ou todas já estão nesta semana).');
        if (!confirm(`Copiar ${novos.length} atividade${novos.length === 1 ? '' : 's'} da semana anterior para esta semana?\n\nAtividades que já existem no mesmo horário não são repetidas, e os valores do financeiro não são copiados.`)) return;

        const colocadas = A.copiarTextos(atual, novos);
        sincronizarDadosComNuvem();
        renderizarSemana();
        mostrarToast(`✅ ${colocadas} atividade${colocadas === 1 ? '' : 's'} copiada${colocadas === 1 ? '' : 's'}.`);
    }

    // ---------- Atividade que se repete ----------
    function abrirRepetir() {
        const sel = $('rep-hora');
        if (sel && !sel.options.length) {
            for (let h = 0; h < TOTAL_HORAS; h++) {
                const op = document.createElement('option');
                op.value = h;
                op.textContent = formatarHora(h);
                sel.appendChild(op);
            }
            sel.value = Math.min(TOTAL_HORAS - 1, Math.max(0, 8 - HORA_INICIAL));
        }
        $('modal-repetir').style.display = 'block';
    }

    function ligarRepetir() {
        const abrir = $('btn-repetir-atividade');
        const modal = $('modal-repetir');
        if (!abrir || !modal) return;

        abrir.addEventListener('click', abrirRepetir);
        $('fechar-repetir').addEventListener('click', () => { modal.style.display = 'none'; });
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

        $('form-repetir').addEventListener('submit', (e) => {
            e.preventDefault();
            const texto = $('rep-texto').value.trim();
            const dias = Array.from(document.querySelectorAll('#rep-dias input:checked')).map(i => Number(i.value));
            const hIndex = Number($('rep-hora').value);
            const semanas = Math.min(52, Math.max(1, parseInt($('rep-semanas').value, 10) || 1));

            if (!texto) return alert('Escreva a atividade.');
            if (!dias.length) return alert('Marque pelo menos um dia da semana.');

            let colocadas = 0;
            let puladas = 0;
            for (let k = 0; k < semanas; k++) {
                const chave = chaveDia(adicionarDias(semanaSelecionada, 7 * k));
                dias.forEach(dia => {
                    const r = window.PlanifyAtividades.inserirTexto(chave, `${hIndex}-${dia}`, texto);
                    if (r === 'ok') colocadas++; else puladas++;
                });
            }

            sincronizarDadosComNuvem();
            renderizarSemana();
            modal.style.display = 'none';
            $('form-repetir').reset();
            alert(`Pronto! ${colocadas} horário${colocadas === 1 ? '' : 's'} preenchido${colocadas === 1 ? '' : 's'}` + (puladas ? ` (${puladas} já tinham essa atividade ou estavam cheios e foram mantidos).` : '.'));
        });
    }

    // ---------- Hora atual na grade ----------
    function semanaAtualSelecionada() {
        return chaveDia(semanaSelecionada) === chaveDia(inicioDaSemana(new Date()));
    }

    function destacarHoraAtual() {
        document.querySelectorAll('.tabela-agenda tr.linha-hora-atual').forEach(tr => tr.classList.remove('linha-hora-atual'));
        if (!semanaAtualSelecionada()) return;
        const indice = new Date().getHours() - HORA_INICIAL;
        if (indice < 0 || indice >= TOTAL_HORAS) return;
        ['corpo-tabela-agenda', 'corpo-tabela-financeira'].forEach(id => {
            const corpo = $(id);
            if (corpo && corpo.rows[indice]) corpo.rows[indice].classList.add('linha-hora-atual');
        });
    }

    function rolarParaHoraAtual() {
        if (!semanaAtualSelecionada()) return;
        const indice = new Date().getHours() - HORA_INICIAL;
        if (indice < 0 || indice >= TOTAL_HORAS) return;

        document.querySelectorAll('.conteudo-aba.ativa .tabela-container').forEach(container => {
            if (container.offsetParent === null) return; // escondido
            const corpo = container.querySelector('tbody');
            const cabecalho = container.querySelector('thead');
            const linha = corpo && corpo.rows[indice];
            if (!linha) return;
            const folga = (cabecalho ? cabecalho.offsetHeight : 0) + linha.offsetHeight * 2;
            container.scrollTop = Math.max(0, linha.offsetTop - folga);
        });
    }

    // ---------- Exportar para Excel ----------
    function baixarExcel() {
        if (!window.XLSX) return alert('Não foi possível carregar o gerador de Excel. Confira sua internet e recarregue a página.');

        const chave = chaveDia(semanaSelecionada);
        const itens = window.PlanifyAtividades ? window.PlanifyAtividades.itensDaSemana(chave) : [];

        const movimentos = [['Nº', 'Data', 'Dia', 'Horário', 'Atividade', 'Tipo', 'Categoria', 'Valor (R$)']];
        const porDia = [['Dia', 'Data', 'Entradas (R$)', 'Saídas (R$)', 'Saldo (R$)']];
        const porCat = {};
        let totalE = 0, totalS = 0, n = 0;

        for (let dia = 0; dia < 7; dia++) {
            const data = adicionarDias(semanaSelecionada, dia);
            let e = 0, s = 0;

            itens.filter(i => i.d === dia).forEach(it => {
                n++;
                const valor = it.valor > 0 ? it.valor : 0;
                const saida = valor > 0 && it.tipo === 'saida';
                const categoria = valor > 0 ? categoriaDe(it.texto, it) : '';
                if (valor > 0) {
                    if (saida) { s += valor; porCat[categoria] = (porCat[categoria] || 0) + valor; }
                    else e += valor;
                }
                movimentos.push([
                    n, formatarDataCompleta(data), diasDaSemana[dia], formatarHora(it.h),
                    it.texto || 'Lançamento financeiro',
                    valor > 0 ? (saida ? 'Saída' : 'Entrada') : '',
                    categoria,
                    valor > 0 ? arredondar(valor) : ''
                ]);
            });

            e = arredondar(e); s = arredondar(s);
            totalE += e; totalS += s;
            porDia.push([diasDaSemana[dia], formatarDataCompleta(data), e, s, arredondar(e - s)]);
        }

        totalE = arredondar(totalE); totalS = arredondar(totalS);
        movimentos.push([]);
        movimentos.push(['', '', '', '', '', 'Total de entradas', '', totalE]);
        movimentos.push(['', '', '', '', '', 'Total de saídas', '', totalS]);
        movimentos.push(['', '', '', '', '', 'Saldo da semana', '', arredondar(totalE - totalS)]);
        porDia.push(['Total da semana', '', totalE, totalS, arredondar(totalE - totalS)]);

        const categorias = [['Categoria', 'Total gasto (R$)', '% dos gastos']];
        Object.entries(porCat).sort((a, b) => b[1] - a[1]).forEach(([nome, v]) => {
            categorias.push([nome, arredondar(v), totalS > 0 ? v / totalS : 0]);
        });

        const formatar = (ws, colunas, formato) => {
            Object.keys(ws).forEach(ref => {
                if (ref[0] === '!') return;
                const col = ref.replace(/\d+/g, '');
                const linha = parseInt(ref.replace(/\D+/g, ''), 10);
                if (colunas.includes(col) && linha > 1 && typeof ws[ref].v === 'number') ws[ref].z = formato;
            });
        };

        const wb = XLSX.utils.book_new();

        const ws1 = XLSX.utils.aoa_to_sheet(movimentos);
        ws1['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 10 }, { wch: 9 }, { wch: 38 }, { wch: 18 }, { wch: 16 }, { wch: 14 }];
        formatar(ws1, ['H'], '"R$" #,##0.00');
        XLSX.utils.book_append_sheet(wb, ws1, 'Movimentações');

        const ws2 = XLSX.utils.aoa_to_sheet(porDia);
        ws2['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        formatar(ws2, ['C', 'D', 'E'], '"R$" #,##0.00');
        XLSX.utils.book_append_sheet(wb, ws2, 'Resumo por dia');

        const ws3 = XLSX.utils.aoa_to_sheet(categorias);
        ws3['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 14 }];
        formatar(ws3, ['B'], '"R$" #,##0.00');
        formatar(ws3, ['C'], '0.0%');
        XLSX.utils.book_append_sheet(wb, ws3, 'Gastos por categoria');

        const fim = adicionarDias(semanaSelecionada, 6);
        const dd = (d) => formatarDataCompleta(d).replace(/\//g, '-');
        XLSX.writeFile(wb, `PlaniFy_Semana_${dd(semanaSelecionada)}_a_${dd(fim)}.xlsx`);
    }

    // ---------- Tema claro / escuro ----------
    function aplicarTema(tema) {
        tema = tema === 'claro' ? 'claro' : 'escuro';
        document.documentElement.setAttribute('data-tema', tema);
        try { localStorage.setItem('planify_tema', tema); } catch (e) {}
        document.querySelectorAll('[data-opcao-tema]').forEach(b => b.classList.toggle('ativo', b.dataset.opcaoTema === tema));
    }

    function ligarTema() {
        let salvo = 'escuro';
        try { salvo = localStorage.getItem('planify_tema') || 'escuro'; } catch (e) {}
        aplicarTema(salvo);
        document.querySelectorAll('[data-opcao-tema]').forEach(b => b.addEventListener('click', () => aplicarTema(b.dataset.opcaoTema)));
    }

    // ---------- Abas dentro das configurações ----------
    function mostrarAbaConfig(idPainel) {
        document.querySelectorAll('.cfg-aba').forEach(b => b.classList.toggle('ativa', b.dataset.cfgAba === idPainel));
        document.querySelectorAll('.cfg-painel').forEach(p => p.classList.toggle('ativo', p.id === idPainel));
    }

    function ligarAbasConfig() {
        document.querySelectorAll('.cfg-aba').forEach(b => b.addEventListener('click', () => mostrarAbaConfig(b.dataset.cfgAba)));
    }

    // ---------- Instalar como app (PWA) ----------
    let promptInstalacao = null;

    function jaInstalado() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function atualizarInstalacao() {
        const texto = $('instalar-texto');
        const botao = $('btn-instalar-app');
        if (!texto || !botao) return;

        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        botao.style.display = 'none';

        if (jaInstalado()) {
            texto.textContent = '✅ Você já está usando o PlaniFy como aplicativo.';
        } else if (promptInstalacao) {
            texto.textContent = 'Instale o PlaniFy no seu aparelho para abrir direto da tela inicial, em tela cheia, como um app.';
            botao.style.display = '';
        } else if (ios) {
            texto.textContent = 'No iPhone ou iPad: abra o site no Safari, toque em Compartilhar (o quadrado com a seta) e escolha "Adicionar à Tela de Início".';
        } else {
            texto.textContent = 'Seu navegador ainda não liberou a instalação direta. No Chrome ou no Edge, abra o menu ⋮ e escolha "Instalar app" (no celular, "Adicionar à tela inicial"). Se o botão de instalar aparecer aqui, é só tocar nele.';
        }
    }

    function ligarInstalacao() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            promptInstalacao = e;
            atualizarInstalacao();
        });
        window.addEventListener('appinstalled', () => {
            promptInstalacao = null;
            atualizarInstalacao();
        });

        const botao = $('btn-instalar-app');
        if (botao) {
            botao.addEventListener('click', async () => {
                if (!promptInstalacao) return;
                promptInstalacao.prompt();
                try { await promptInstalacao.userChoice; } catch (e) {}
                promptInstalacao = null;
                atualizarInstalacao();
            });
        }

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').catch(() => {});
            });
        }
        atualizarInstalacao();
    }

    // ---------- Admin: avisos publicados ----------
    function renderizarAvisosAdmin() {
        const alvo = $('admin-lista-avisos');
        if (!alvo || !usuarioEhAdmin) return;

        const avisos = [...listaHistoricoNotifs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (!avisos.length) {
            alvo.innerHTML = '<p class="vazio-extra">Nenhum aviso publicado.</p>';
            return;
        }

        alvo.innerHTML = '';
        avisos.forEach(aviso => {
            const quando = aviso.timestamp ? new Date(aviso.timestamp).toLocaleString('pt-BR') : '';
            const item = document.createElement('div');
            item.className = 'admin-aviso-item';
            item.innerHTML = `
                <div class="admin-aviso-texto">
                    <strong>${escapeXML(aviso.titulo || '')}</strong>
                    <span>${escapeXML(aviso.mensagem || '')}</span>
                    <small>${escapeXML(quando)}</small>
                </div>
            `;
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.textContent = 'Apagar';
            botao.addEventListener('click', () => apagarAviso(aviso.id));
            item.appendChild(botao);
            alvo.appendChild(item);
        });
    }

    async function apagarAviso(id) {
        if (!usuarioEhAdmin || !window.firebaseDB) return;
        if (!confirm('Apagar este aviso para todos os usuários?')) return;
        const { db, doc, deleteDoc } = window.firebaseDB;
        try {
            await deleteDoc(doc(db, 'avisos_globais', String(id)));
        } catch (erro) {
            alert('Erro ao apagar o aviso: ' + erro.message);
        }
    }

    async function apagarTodosAvisos() {
        if (!usuarioEhAdmin || !window.firebaseDB || !listaHistoricoNotifs.length) return;
        if (!confirm(`Apagar TODOS os ${listaHistoricoNotifs.length} avisos publicados, para todos os usuários?`)) return;
        const { db, doc, deleteDoc } = window.firebaseDB;
        try {
            for (const aviso of [...listaHistoricoNotifs]) {
                await deleteDoc(doc(db, 'avisos_globais', String(aviso.id)));
            }
        } catch (erro) {
            alert('Erro ao apagar os avisos: ' + erro.message);
        }
    }

    // ---------- API usada pelo script.js ----------
    window.PlanifyExtras = {
        payload() {
            return { config, metas };
        },

        aoCarregarDados(dados) {
            const c = (dados && dados.config) || {};
            config = { orcamentoSemanal: Number(c.orcamentoSemanal) || 0, alertas: c.alertas || {} };
            metas = (dados && Array.isArray(dados.metas)) ? dados.metas : [];
            renderizarMetas();
            renderizarOrcamento();
            renderizarGrafico();
        },

        aoLimparSessao() {
            config = { orcamentoSemanal: 0, alertas: {} };
            metas = [];
            renderizarMetas();
            renderizarOrcamento();
            renderizarGrafico();
        },

        aoRenderizarSemana() {
            destacarHoraAtual();
            renderizarOrcamento();
            renderizarGrafico();
            rolarParaHoraAtual();
        },

        aoAtualizarResumo() {
            renderizarOrcamento();
            renderizarGrafico();
        },

        aoMudarFinanceiro() {
            renderizarOrcamento();
            renderizarGrafico();
            verificarOrcamento();
        },

        aoAbrirAba(abaId) {
            if (abaId === 'aba-organizacao' || abaId === 'aba-financeiro') {
                destacarHoraAtual();
                setTimeout(rolarParaHoraAtual, 30);
            } else if (abaId === 'aba-metas') {
                renderizarMetas();
            } else if (abaId === 'aba-admin') {
                renderizarAvisosAdmin();
            }
        },

        aoAvisosAtualizados() {
            renderizarAvisosAdmin();
        },

        aoAbrirConfiguracoes() {
            mostrarAbaConfig('cfg-painel-aparencia');
            aplicarTema(document.documentElement.getAttribute('data-tema'));
            atualizarInstalacao();
        },

        categoriaDe,
        baixarExcel
    };

    // ---------- Inicialização ----------
    ligarTema();
    ligarAbasConfig();
    ligarInstalacao();
    ligarDica();
    ligarFormOrcamento();
    ligarMetas();
    ligarRepetir();

    const btnCopiar = $('btn-copiar-semana');
    if (btnCopiar) btnCopiar.addEventListener('click', copiarSemanaAnterior);

    const btnApagarTodos = $('btn-admin-apagar-todos-avisos');
    if (btnApagarTodos) btnApagarTodos.addEventListener('click', apagarTodosAvisos);

    // mantém o destaque da hora atual andando
    setInterval(destacarHoraAtual, 60000);
})();
