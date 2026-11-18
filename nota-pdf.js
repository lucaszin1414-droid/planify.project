// Gerador da "Nota de Movimentação Financeira Semanal" em PDF.
// Não depende de nenhuma biblioteca externa: monta o arquivo PDF direto no navegador.
(function (global) {
    'use strict';

    // ---------- Medidas da página (A4, em pontos) ----------
    const LARGURA = 595.28;
    const ALTURA = 841.89;
    const MARGEM = 40;
    const LARGURA_UTIL = LARGURA - 2 * MARGEM;
    const LIMITE_INFERIOR = ALTURA - 64; // acima do rodapé de cada página

    const COR = {
        verde: '#1b382b',
        verdeClaro: '#a8d5bd',
        verdeMedio: '#8fc7a8',
        fundo: '#f4f8f5',
        faixa: '#e6efe9',
        borda: '#cfdcd3',
        texto: '#1b2a22',
        cinza: '#6b7c72',
        entrada: '#1e8449',
        saida: '#c0392b',
        branco: '#ffffff'
    };

    const NOMES_DIA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const ABREV_DIA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    // ---------- Larguras dos caracteres (Helvetica e Helvetica-Bold, ASCII 32 a 126) ----------
    const LARG_HELV = [
        278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
        556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
        1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
        667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
        333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
        556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
    ];
    const LARG_BOLD = [
        278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
        556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
        975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
        667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
        333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
        611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584
    ];

    function larguraTexto(texto, fonte, tamanho) {
        const str = String(texto);
        if (fonte === 'F3') return str.length * 0.6 * tamanho; // Courier: todas as letras têm a mesma largura
        const tabela = fonte === 'F2' ? LARG_BOLD : LARG_HELV;
        const semAcento = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let total = 0;
        for (const ch of semAcento) {
            const c = ch.charCodeAt(0);
            total += (c >= 32 && c <= 126) ? tabela[c - 32] : 556;
        }
        return total * tamanho / 1000;
    }

    // ---------- Codificação do texto para o PDF (WinAnsi) ----------
    const ESPECIAIS = { 0x2013: 0x96, 0x2014: 0x97, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2026: 0x85, 0x20AC: 0x80 };

    function codificar(texto) {
        let saida = '';
        for (const ch of String(texto)) {
            let c = ch.codePointAt(0);
            if (ESPECIAIS[c] !== undefined) c = ESPECIAIS[c];
            else if (c > 255) c = 63; // caractere que o PDF não suporta (ex.: emoji) vira "?"

            if (c === 40 || c === 41 || c === 92) saida += '\\' + String.fromCharCode(c);
            else if (c < 32 || c > 126) saida += '\\' + c.toString(8).padStart(3, '0');
            else saida += String.fromCharCode(c);
        }
        return saida;
    }

    // ---------- Utilidades ----------
    function dd(n) { return String(n).padStart(2, '0'); }
    function dataBR(d) { return `${dd(d.getDate())}/${dd(d.getMonth() + 1)}/${d.getFullYear()}`; }
    function horaBR(d) { return `${dd(d.getHours())}:${dd(d.getMinutes())}:${dd(d.getSeconds())}`; }
    function somarDias(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }

    // Valores sempre em centavos (inteiros) para não ter erro de arredondamento
    function moeda(centavos) {
        const abs = Math.abs(centavos);
        const inteiro = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `R$ ${inteiro},${String(abs % 100).padStart(2, '0')}`;
    }

    function moedaComSinal(centavos) {
        return centavos < 0 ? `- ${moeda(centavos)}` : moeda(centavos);
    }

    function hexParaRGB(hex) {
        const n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => (v / 255).toFixed(3)).join(' ');
    }

    function quebrarTexto(texto, fonte, tamanho, larguraMax, maxLinhas) {
        const palavras = String(texto).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
        const linhas = [];
        let linha = '';

        palavras.forEach(original => {
            let palavra = original;

            // palavra maior que a coluna inteira: corta em pedaços
            while (palavra.length > 1 && larguraTexto(palavra, fonte, tamanho) > larguraMax) {
                let corte = palavra.length;
                while (corte > 1 && larguraTexto(palavra.slice(0, corte), fonte, tamanho) > larguraMax) corte--;
                if (linha) { linhas.push(linha); linha = ''; }
                linhas.push(palavra.slice(0, corte));
                palavra = palavra.slice(corte);
            }

            const tentativa = linha ? `${linha} ${palavra}` : palavra;
            if (larguraTexto(tentativa, fonte, tamanho) <= larguraMax) {
                linha = tentativa;
            } else {
                linhas.push(linha);
                linha = palavra;
            }
        });

        if (linha) linhas.push(linha);
        if (!linhas.length) linhas.push('');

        if (maxLinhas && linhas.length > maxLinhas) {
            const cortadas = linhas.slice(0, maxLinhas);
            cortadas[maxLinhas - 1] = truncar(cortadas[maxLinhas - 1] + ' ...', fonte, tamanho, larguraMax);
            return cortadas;
        }
        return linhas;
    }

    function truncar(texto, fonte, tamanho, larguraMax) {
        let str = String(texto).replace(/\s+/g, ' ').trim();
        if (larguraTexto(str, fonte, tamanho) <= larguraMax) return str;
        while (str.length > 1 && larguraTexto(str + '...', fonte, tamanho) > larguraMax) str = str.slice(0, -1);
        return str + '...';
    }

    // ---------- Totais ----------
    function resumir(dados) {
        let registros = 0;
        let entradas = 0;
        let saidas = 0;
        const porDia = [];

        for (let i = 0; i < 7; i++) {
            const dia = (dados.dias && dados.dias[i]) || { itens: [] };
            let e = 0;
            let s = 0;

            (dia.itens || []).forEach(item => {
                registros++;
                const centavos = Math.round((Number(item.valor) || 0) * 100);
                if (centavos > 0) {
                    if (item.tipo === 'saida') s += centavos;
                    else if (item.tipo === 'entrada') e += centavos;
                }
            });

            porDia.push({ entradas: e, saidas: s, saldo: e - s });
            entradas += e;
            saidas += s;
        }

        return { registros, entradas, saidas, saldo: entradas - saidas, porDia };
    }

    // ---------- Montagem do arquivo PDF ----------
    function montarArquivoPDF(paginas, meta) {
        const objetos = [];
        const total = paginas.length;
        const primeiraPagina = 7;

        objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        objetos[2] = `<< /Type /Pages /Kids [${paginas.map((_, i) => `${primeiraPagina + 2 * i} 0 R`).join(' ')}] /Count ${total} >>`;
        objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        objetos[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        objetos[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>';

        const criacao = meta.emissao;
        const dataPDF = `D:${criacao.getFullYear()}${dd(criacao.getMonth() + 1)}${dd(criacao.getDate())}${dd(criacao.getHours())}${dd(criacao.getMinutes())}${dd(criacao.getSeconds())}`;
        objetos[6] = `<< /Title (${codificar(meta.titulo)}) /Author (PlaniFy) /Creator (PlaniFy) /Producer (PlaniFy) /CreationDate (${dataPDF}) >>`;

        paginas.forEach((ops, i) => {
            const conteudo = ops.join('\n');
            objetos[primeiraPagina + 2 * i] =
                `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGURA} ${ALTURA}] ` +
                `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${primeiraPagina + 2 * i + 1} 0 R >>`;
            objetos[primeiraPagina + 2 * i + 1] = `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`;
        });

        let arquivo = '%PDF-1.4\n%' + String.fromCharCode(0xE2, 0xE3, 0xCF, 0xD3) + '\n';
        const posicoes = [];

        for (let n = 1; n < objetos.length; n++) {
            posicoes[n] = arquivo.length;
            arquivo += `${n} 0 obj\n${objetos[n]}\nendobj\n`;
        }

        const inicioXref = arquivo.length;
        arquivo += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
        for (let n = 1; n < objetos.length; n++) {
            arquivo += `${String(posicoes[n]).padStart(10, '0')} 00000 n \n`;
        }
        arquivo += `trailer\n<< /Size ${objetos.length} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;

        const bytes = new Uint8Array(arquivo.length);
        for (let i = 0; i < arquivo.length; i++) bytes[i] = arquivo.charCodeAt(i) & 255;
        return bytes;
    }

    // ---------- Geração da nota ----------
    // dados = { usuario, semanaInicio: Date (segunda-feira), emissao: Date,
    //           dias: [ { itens: [ { hora, atividade, tipo: 'entrada' | 'saida' | '', valor } ] } x 7 ] }
    function gerarNotaPDF(dados) {
        const emissao = dados.emissao || new Date();
        const inicio = new Date(dados.semanaInicio);
        const fim = somarDias(inicio, 6);
        const resumo = resumir(dados);
        const usuario = String(dados.usuario || '').trim() || 'Usuário não identificado';
        const numero = `PF-${inicio.getFullYear()}${dd(inicio.getMonth() + 1)}${dd(inicio.getDate())}-${dd(emissao.getHours())}${dd(emissao.getMinutes())}${dd(emissao.getSeconds())}`;
        const textoEmissao = `${dataBR(emissao)} às ${horaBR(emissao)}`;

        const paginas = [];
        let ops = null;

        function novaPagina() {
            ops = [];
            paginas.push(ops);
        }

        const Y = (y) => (ALTURA - y).toFixed(2);

        function texto(x, y, str, opcoes) {
            const { fonte = 'F1', tamanho = 9, cor = COR.texto, alinhar = 'left' } = opcoes || {};
            let px = x;
            if (alinhar === 'right') px = x - larguraTexto(str, fonte, tamanho);
            else if (alinhar === 'center') px = x - larguraTexto(str, fonte, tamanho) / 2;
            ops.push(`${hexParaRGB(cor)} rg BT /${fonte} ${tamanho} Tf ${px.toFixed(2)} ${Y(y)} Td (${codificar(str)}) Tj ET`);
        }

        function retangulo(x, y, w, h, opcoes) {
            const { preenchimento, borda, espessura = 0.5 } = opcoes || {};
            let op = '';
            if (preenchimento) op += `${hexParaRGB(preenchimento)} rg `;
            if (borda) op += `${hexParaRGB(borda)} RG ${espessura} w `;
            op += `${x.toFixed(2)} ${(ALTURA - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re `;
            op += preenchimento && borda ? 'B' : (preenchimento ? 'f' : 'S');
            ops.push(op);
        }

        function linha(x1, y1, x2, y2, opcoes) {
            const { cor = COR.borda, espessura = 0.5 } = opcoes || {};
            ops.push(`${hexParaRGB(cor)} RG ${espessura} w ${x1.toFixed(2)} ${Y(y1)} m ${x2.toFixed(2)} ${Y(y2)} l S`);
        }

        // ----- Cabeçalho da primeira página -----
        novaPagina();
        retangulo(0, 0, LARGURA, 96, { preenchimento: COR.verde });
        retangulo(0, 96, LARGURA, 4, { preenchimento: COR.verdeMedio });
        texto(MARGEM, 54, 'PlaniFy', { fonte: 'F2', tamanho: 32, cor: COR.branco });
        texto(MARGEM, 76, 'NOTA DE MOVIMENTAÇÃO FINANCEIRA SEMANAL', { fonte: 'F2', tamanho: 10, cor: COR.verdeClaro });
        texto(LARGURA - MARGEM, 38, 'NOTA Nº', { fonte: 'F2', tamanho: 8, cor: COR.verdeClaro, alinhar: 'right' });
        texto(LARGURA - MARGEM, 56, numero, { fonte: 'F3', tamanho: 13, cor: COR.branco, alinhar: 'right' });

        // ----- Bloco de identificação -----
        const topoInfo = 116;
        retangulo(MARGEM, topoInfo, LARGURA_UTIL, 78, { preenchimento: COR.fundo, borda: COR.borda });
        const colEsq = MARGEM + 14;
        const colDir = MARGEM + LARGURA_UTIL / 2 + 14;
        const larguraCol = LARGURA_UTIL / 2 - 28;
        const rotulo = (x, y, t) => texto(x, y, t, { fonte: 'F2', tamanho: 7, cor: COR.cinza });
        const valor = (x, y, t) => texto(x, y, truncar(t, 'F2', 10.5, larguraCol), { fonte: 'F2', tamanho: 10.5, cor: COR.texto });

        rotulo(colEsq, topoInfo + 18, 'EMITIDO PARA');
        valor(colEsq, topoInfo + 33, usuario);
        rotulo(colEsq, topoInfo + 50, 'PERÍODO DA SEMANA');
        valor(colEsq, topoInfo + 65, `${ABREV_DIA[0]}, ${dataBR(inicio)} a ${ABREV_DIA[6]}, ${dataBR(fim)}`);

        rotulo(colDir, topoInfo + 18, 'DATA DE EMISSÃO');
        valor(colDir, topoInfo + 33, dataBR(emissao));
        rotulo(colDir, topoInfo + 50, 'HORÁRIO DO DOWNLOAD');
        valor(colDir, topoInfo + 65, horaBR(emissao));

        // ----- Tabela de detalhamento -----
        const colunas = [
            { titulo: 'Nº', largura: 26, alinhar: 'center' },
            { titulo: 'DATA', largura: 88, alinhar: 'left' },
            { titulo: 'HORÁRIO', largura: 52, alinhar: 'left' },
            { titulo: 'ATIVIDADE', largura: 0, alinhar: 'left' },
            { titulo: 'TIPO', largura: 52, alinhar: 'left' },
            { titulo: 'VALOR', largura: 88, alinhar: 'right' }
        ];
        const fixas = colunas.reduce((soma, c) => soma + c.largura, 0);
        colunas[3].largura = LARGURA_UTIL - fixas;
        let xAtual = MARGEM;
        colunas.forEach(c => { c.x = xAtual; xAtual += c.largura; });

        const PAD_X = 6;
        const TAM_LINHA = 8.5;
        const ALT_LINHA_TEXTO = 11;
        const PAD_Y = 5;

        function posicaoTexto(coluna) {
            if (coluna.alinhar === 'right') return coluna.x + coluna.largura - PAD_X;
            if (coluna.alinhar === 'center') return coluna.x + coluna.largura / 2;
            return coluna.x + PAD_X;
        }

        function cabecalhoContinuacao() {
            retangulo(0, 0, LARGURA, 34, { preenchimento: COR.verde });
            texto(MARGEM, 22, 'PlaniFy', { fonte: 'F2', tamanho: 14, cor: COR.branco });
            texto(LARGURA - MARGEM, 22, `Nota Nº ${numero} (continuação)`, { fonte: 'F3', tamanho: 8.5, cor: COR.verdeClaro, alinhar: 'right' });
            return 52;
        }

        function barraSecao(y, titulo, direita) {
            retangulo(MARGEM, y, LARGURA_UTIL, 20, { preenchimento: COR.faixa });
            texto(MARGEM + 8, y + 14, titulo, { fonte: 'F2', tamanho: 9, cor: COR.verde });
            if (direita) texto(MARGEM + LARGURA_UTIL - 8, y + 14, direita, { tamanho: 8, cor: COR.cinza, alinhar: 'right' });
            return y + 20;
        }

        function cabecalhoTabela(y) {
            retangulo(MARGEM, y, LARGURA_UTIL, 20, { preenchimento: COR.verde });
            colunas.forEach(c => {
                texto(posicaoTexto(c), y + 13, c.titulo, { fonte: 'F2', tamanho: 7.5, cor: COR.branco, alinhar: c.alinhar });
            });
            return y + 20;
        }

        let y = barraSecao(topoInfo + 78 + 18, 'DETALHAMENTO DA SEMANA', `${resumo.registros} ${resumo.registros === 1 ? 'registro' : 'registros'}`) + 6;
        y = cabecalhoTabela(y);

        // monta a lista cronológica
        const linhasTabela = [];
        for (let i = 0; i < 7; i++) {
            const dia = (dados.dias && dados.dias[i]) || { itens: [] };
            const data = somarDias(inicio, i);
            (dia.itens || []).forEach(item => {
                linhasTabela.push({
                    data: `${ABREV_DIA[i]} ${dataBR(data)}`,
                    hora: item.hora || '-',
                    atividade: String(item.atividade || '').trim(),
                    tipo: item.tipo,
                    centavos: Math.round((Number(item.valor) || 0) * 100)
                });
            });
        }

        if (linhasTabela.length === 0) {
            retangulo(MARGEM, y, LARGURA_UTIL, 30, { preenchimento: COR.branco });
            texto(MARGEM + LARGURA_UTIL / 2, y + 19, 'Nenhuma atividade ou movimentação registrada nesta semana.', { tamanho: 9, cor: COR.cinza, alinhar: 'center' });
            y += 30;
        }

        linhasTabela.forEach((item, indice) => {
            const larguraAtividade = colunas[3].largura - 2 * PAD_X;
            const linhasAtividade = item.atividade
                ? quebrarTexto(item.atividade, 'F1', TAM_LINHA, larguraAtividade, 30)
                : ['-'];
            const altura = linhasAtividade.length * ALT_LINHA_TEXTO + 2 * PAD_Y;

            if (y + altura > LIMITE_INFERIOR) {
                novaPagina();
                y = cabecalhoContinuacao() + 14;
                y = cabecalhoTabela(y);
            }

            if (indice % 2 === 0) retangulo(MARGEM, y, LARGURA_UTIL, altura, { preenchimento: COR.fundo });

            const base = y + PAD_Y + 8;
            const cinza = { tamanho: TAM_LINHA, cor: COR.cinza };

            texto(posicaoTexto(colunas[0]), base, String(indice + 1), Object.assign({ alinhar: 'center' }, cinza));
            texto(posicaoTexto(colunas[1]), base, item.data, { tamanho: TAM_LINHA });
            texto(posicaoTexto(colunas[2]), base, item.hora, { tamanho: TAM_LINHA });

            linhasAtividade.forEach((trecho, k) => {
                texto(posicaoTexto(colunas[3]), base + k * ALT_LINHA_TEXTO, trecho, item.atividade ? { tamanho: TAM_LINHA } : cinza);
            });

            if (item.centavos > 0 && (item.tipo === 'entrada' || item.tipo === 'saida')) {
                const entrada = item.tipo === 'entrada';
                texto(posicaoTexto(colunas[4]), base, entrada ? 'Entrada' : 'Saída', { tamanho: TAM_LINHA, cor: entrada ? COR.entrada : COR.saida, fonte: 'F2' });
                texto(posicaoTexto(colunas[5]), base, `${entrada ? '+' : '-'} ${moeda(item.centavos)}`, { tamanho: TAM_LINHA, cor: entrada ? COR.entrada : COR.saida, fonte: 'F2', alinhar: 'right' });
            } else {
                texto(posicaoTexto(colunas[4]), base, '-', cinza);
                texto(posicaoTexto(colunas[5]), base, '-', Object.assign({ alinhar: 'right' }, cinza));
            }

            y += altura;
            linha(MARGEM, y, MARGEM + LARGURA_UTIL, y, { cor: COR.borda, espessura: 0.4 });
        });

        // ----- Resumo por dia -----
        y += 22;
        const alturaResumo = 20 + 6 + 20 + 7 * 18;
        if (y + alturaResumo > LIMITE_INFERIOR) {
            novaPagina();
            y = cabecalhoContinuacao() + 14;
        }

        y = barraSecao(y, 'RESUMO POR DIA') + 6;

        const colResumo = [
            { titulo: 'DIA', largura: LARGURA_UTIL - 3 * 112, alinhar: 'left' },
            { titulo: 'ENTRADAS', largura: 112, alinhar: 'right' },
            { titulo: 'SAÍDAS', largura: 112, alinhar: 'right' },
            { titulo: 'SALDO', largura: 112, alinhar: 'right' }
        ];
        let xr = MARGEM;
        colResumo.forEach(c => { c.x = xr; xr += c.largura; });
        const posResumo = (c) => c.alinhar === 'right' ? c.x + c.largura - PAD_X : c.x + PAD_X;

        retangulo(MARGEM, y, LARGURA_UTIL, 20, { preenchimento: COR.verde });
        colResumo.forEach(c => texto(posResumo(c), y + 13, c.titulo, { fonte: 'F2', tamanho: 7.5, cor: COR.branco, alinhar: c.alinhar }));
        y += 20;

        resumo.porDia.forEach((d, i) => {
            if (i % 2 === 0) retangulo(MARGEM, y, LARGURA_UTIL, 18, { preenchimento: COR.fundo });
            const base = y + 12.5;
            texto(posResumo(colResumo[0]), base, `${NOMES_DIA[i]}, ${dataBR(somarDias(inicio, i))}`, { tamanho: TAM_LINHA });
            texto(posResumo(colResumo[1]), base, moeda(d.entradas), { tamanho: TAM_LINHA, cor: d.entradas ? COR.entrada : COR.cinza, alinhar: 'right' });
            texto(posResumo(colResumo[2]), base, moeda(d.saidas), { tamanho: TAM_LINHA, cor: d.saidas ? COR.saida : COR.cinza, alinhar: 'right' });
            texto(posResumo(colResumo[3]), base, moedaComSinal(d.saldo), {
                tamanho: TAM_LINHA, fonte: 'F2', alinhar: 'right',
                cor: d.saldo > 0 ? COR.entrada : (d.saldo < 0 ? COR.saida : COR.cinza)
            });
            y += 18;
            linha(MARGEM, y, MARGEM + LARGURA_UTIL, y, { cor: COR.borda, espessura: 0.4 });
        });

        // ----- Totais -----
        y += 20;
        const alturaTotais = 96 + 40;
        if (y + alturaTotais > LIMITE_INFERIOR) {
            novaPagina();
            y = cabecalhoContinuacao() + 14;
        }

        retangulo(MARGEM, y, LARGURA_UTIL, 96, { preenchimento: COR.verde });
        const xr1 = MARGEM + 18;
        const xr2 = MARGEM + LARGURA_UTIL - 18;
        texto(xr1, y + 26, 'TOTAL DE ENTRADAS', { fonte: 'F2', tamanho: 9, cor: COR.verdeClaro });
        texto(xr2, y + 26, moeda(resumo.entradas), { fonte: 'F2', tamanho: 11, cor: '#7be0a5', alinhar: 'right' });
        texto(xr1, y + 46, 'TOTAL DE SAÍDAS', { fonte: 'F2', tamanho: 9, cor: COR.verdeClaro });
        texto(xr2, y + 46, moeda(resumo.saidas), { fonte: 'F2', tamanho: 11, cor: '#ff9d92', alinhar: 'right' });
        linha(xr1, y + 56, xr2, y + 56, { cor: '#3f6b57', espessura: 0.7 });
        texto(xr1, y + 80, 'SALDO DA SEMANA', { fonte: 'F2', tamanho: 11, cor: COR.branco });
        texto(xr2, y + 80, moedaComSinal(resumo.saldo), { fonte: 'F2', tamanho: 16, cor: COR.branco, alinhar: 'right' });
        y += 96 + 16;

        const notas = [
            'Documento informativo gerado automaticamente pelo PlaniFy, sem valor fiscal.',
            `Os valores e as atividades refletem as planilhas no momento do download (${textoEmissao}).`
        ];
        notas.forEach((nota, i) => texto(MARGEM, y + i * 11, nota, { tamanho: 7.5, cor: COR.cinza }));

        // ----- Rodapé de todas as páginas -----
        const totalPaginas = paginas.length;
        paginas.forEach((pagina, i) => {
            ops = pagina;
            linha(MARGEM, ALTURA - 46, LARGURA - MARGEM, ALTURA - 46, { cor: COR.borda, espessura: 0.6 });
            texto(MARGEM, ALTURA - 32, `PlaniFy  |  Nota Nº ${numero}  |  Emitida em ${textoEmissao}`, { tamanho: 7.5, cor: COR.cinza });
            texto(LARGURA - MARGEM, ALTURA - 32, `Página ${i + 1} de ${totalPaginas}`, { tamanho: 7.5, cor: COR.cinza, alinhar: 'right' });
        });

        const bytes = montarArquivoPDF(paginas, {
            emissao,
            titulo: `Nota de Movimentação Financeira ${numero}`
        });

        const nomeArquivo = `PlaniFy_Nota_${dd(inicio.getDate())}-${dd(inicio.getMonth() + 1)}-${inicio.getFullYear()}_a_${dd(fim.getDate())}-${dd(fim.getMonth() + 1)}-${fim.getFullYear()}.pdf`;

        return { bytes, nomeArquivo, numero, totalPaginas, resumo };
    }

    const api = { gerarNotaPDF, resumir, moeda, moedaComSinal };
    global.PlanifyNota = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);