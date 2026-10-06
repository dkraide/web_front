import {
    IModasSecao, IModasSecaoEstilo, IModasSite, MODAS_SCHEMA, ModasSecaoTipo,
} from '@/interfaces/IModasSite';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const FONTES = [
    'Inter', 'Poppins', 'Montserrat', 'Lato', 'Open Sans', 'Raleway', 'Nunito', 'DM Sans',
    'Playfair Display', 'Cormorant Garamond', 'Lora', 'Merriweather', 'Libre Baskerville',
    'Bebas Neue', 'Oswald', 'Archivo', 'Work Sans', 'Josefin Sans',
];

export const SECAO_META: Record<ModasSecaoTipo, { label: string; descricao: string }> = {
    banner: { label: 'Banner / Slides', descricao: 'Imagens grandes com texto e botão, em carrossel.' },
    vitrine: { label: 'Vitrine de produtos', descricao: 'Novidades, promoções, categoria, coleção ou seleção manual.' },
    categorias: { label: 'Categorias', descricao: 'Cards de categorias com imagem.' },
    colecao: { label: 'Coleção em destaque', descricao: 'Imagem grande + texto para uma campanha ou coleção.' },
    beneficios: { label: 'Faixa de benefícios', descricao: 'Frete, troca, parcelamento… com ícones.' },
    texto: { label: 'Texto', descricao: 'Bloco de texto com botão opcional.' },
    video: { label: 'Vídeo', descricao: 'YouTube, Vimeo ou arquivo.' },
    depoimentos: { label: 'Depoimentos', descricao: 'Avaliações de clientes.' },
    instagram: { label: 'Instagram', descricao: 'Grade de fotos com link.' },
    newsletter: { label: 'Newsletter', descricao: 'Captura de e-mail.' },
    espaco: { label: 'Espaço / divisor', descricao: 'Espaço em branco ou linha divisória.' },
};

export const ICONES_BENEFICIO = ['truck', 'refresh', 'shield', 'credit-card', 'gift', 'heart', 'star', 'whatsapp', 'tag'] as const;

const estiloPadrao = (): IModasSecaoEstilo => ({
    fundo: '',
    corTexto: '',
    paddingY: 40,
    larguraTotal: false,
    alinhamento: 'centro',
    ocultarNoMobile: false,
    ocultarNoDesktop: false,
});

export function novaSecao(tipo: ModasSecaoTipo): IModasSecao {
    const base = { id: uid(), ativa: true, titulo: '', subtitulo: '', estilo: estiloPadrao() };
    switch (tipo) {
        case 'banner':
            return {
                ...base, tipo, estilo: { ...base.estilo, paddingY: 0, larguraTotal: true },
                alturaDesktop: 520, alturaMobile: 360, autoplay: true, intervaloSegundos: 5,
                mostrarSetas: true, mostrarPontos: true,
                slides: [novoSlide()],
            };
        case 'vitrine':
            return {
                ...base, tipo, titulo: 'Novidades', origem: 'novidades', origemId: '', produtoIds: [],
                quantidade: 8, layout: 'grade', colunasDesktop: 4, colunasMobile: 2, textoBotaoVerTodos: 'Ver todos',
            };
        case 'categorias':
            return {
                ...base, tipo, titulo: 'Compre por categoria', formato: 'retrato', colunasDesktop: 4, colunasMobile: 2,
                mostrarRotuloSobreImagem: true, cards: [novoCardCategoria()],
            };
        case 'colecao':
            return {
                ...base, tipo, titulo: 'Nova coleção', subtitulo: 'Descubra as peças da temporada.',
                imagem: '', imagemMobile: '', textoBotao: 'Conferir', linkTipo: 'novidades', linkDestino: '',
                posicaoImagem: 'esquerda',
            };
        case 'beneficios':
            return {
                ...base, tipo, estilo: { ...base.estilo, paddingY: 24 },
                itens: [
                    { id: uid(), icone: 'truck', titulo: 'Entrega rápida', descricao: 'Receba em casa ou retire na loja' },
                    { id: uid(), icone: 'refresh', titulo: 'Troca fácil', descricao: 'Primeira troca grátis' },
                    { id: uid(), icone: 'credit-card', titulo: 'Parcele em até 6x', descricao: 'Sem juros no cartão' },
                ],
            };
        case 'texto':
            return { ...base, tipo, titulo: 'Sobre a loja', conteudo: '', textoBotao: '', linkTipo: 'url', linkDestino: '' };
        case 'video':
            return { ...base, tipo, url: '', autoplay: false, proporcao: '16:9' };
        case 'depoimentos':
            return {
                ...base, tipo, titulo: 'O que dizem nossas clientes',
                itens: [{ id: uid(), nome: '', texto: '', foto: '', nota: 5 }],
            };
        case 'instagram':
            return { ...base, tipo, titulo: 'Siga a gente', usuario: '', imagens: [] };
        case 'newsletter':
            return {
                ...base, tipo, titulo: 'Receba novidades', subtitulo: 'Cadastre seu e-mail e fique por dentro.',
                textoBotao: 'Cadastrar', placeholder: 'Seu melhor e-mail', mensagemSucesso: 'Obrigado! Você está na lista.',
            };
        case 'espaco':
            return { ...base, tipo, estilo: { ...base.estilo, paddingY: 0 }, altura: 40, mostrarLinha: false };
    }
}

export const novoSlide = () => ({
    id: uid(), imagemDesktop: '', imagemMobile: '', titulo: 'Título do banner', subtitulo: '',
    textoBotao: 'Ver agora', linkTipo: 'novidades' as const, linkDestino: '',
    posicaoTexto: 'esquerda' as const, escurecerImagem: 20,
});

export const novoCardCategoria = () => ({
    id: uid(), rotulo: 'Categoria', imagem: '', linkTipo: 'categoria' as const, linkDestino: '',
});

export function criarSitePadrao(nomeLoja = ''): IModasSite {
    return {
        schema: MODAS_SCHEMA,
        identidade: {
            nomeLoja, slogan: '', logoUrl: '', logoEscuraUrl: '', faviconUrl: '',
            whatsapp: '', email: '', telefone: '', endereco: '', horarioAtendimento: '',
        },
        tema: {
            cores: {
                primaria: '#111111', primariaTexto: '#ffffff', secundaria: '#8a7a6a', destaque: '#c0392b',
                fundo: '#ffffff', superficie: '#faf8f6', texto: '#1a1a1a', textoSuave: '#6b6b6b',
                borda: '#e6e2dd', sucesso: '#2e7d32', erro: '#c62828',
            },
            tipografia: {
                fonteTitulo: 'Playfair Display', fonteCorpo: 'Inter', tamanhoBase: 16, pesoTitulo: 600,
                caixaAltaTitulos: false, espacamentoLetrasTitulo: 0,
            },
            forma: {
                raioBotao: 2, raioCard: 0, raioImagem: 0, estiloBotao: 'solido', sombraCards: 'nenhuma', larguraMaxima: 1280,
            },
            modoCor: 'claro',
        },
        cabecalho: {
            layout: 'logo-centro', fixo: true, transparenteNaHome: false, mostrarBusca: true, mostrarConta: true,
            mostrarSacola: true, mostrarFavoritos: false, alturaLogo: 40,
            barraAviso: { ativa: false, texto: 'Frete grátis acima de R$ 299', link: '', corFundo: '#111111', corTexto: '#ffffff' },
            menu: [
                { id: uid(), rotulo: 'Novidades', tipo: 'novidades', destino: '', destaque: false, filhos: [] },
                { id: uid(), rotulo: 'Promoções', tipo: 'promocoes', destino: '', destaque: true, filhos: [] },
            ],
        },
        home: { secoes: [novaSecao('banner'), novaSecao('beneficios'), novaSecao('vitrine')] },
        catalogo: {
            colunasDesktop: 4, colunasMobile: 2, proporcaoImagem: '3:4', trocarImagemNoHover: true,
            mostrarCoresNoCard: true, mostrarParcelamento: true, parcelasMaximas: 6, parcelaMinima: 50,
            mostrarBadgeDesconto: true, mostrarBadgeNovidade: true, ordenacaoPadrao: 'recentes', produtosPorPagina: 24,
            filtros: { categoria: true, tamanho: true, cor: true, preco: true },
        },
        produto: {
            estiloGaleria: 'miniaturas-lateral', zoomImagem: true, estiloSeletorCor: 'bolinha', estiloSeletorTamanho: 'quadrado',
            mostrarTabelaMedidas: false, tabelaMedidas: '', mostrarAvisoEstoqueBaixo: true, limiteEstoqueBaixo: 3,
            mostrarFreteCep: true, mostrarRelacionados: true, textoTrocas: '', mostrarCompartilhar: true,
        },
        checkout: {
            permitirEntrega: true, permitirRetirada: true, exigirCpf: false, pedirObservacao: true,
            mensagemRetirada: '', mensagemConfirmacao: 'Pedido recebido! Avisaremos você pelo WhatsApp.',
            pedidoMinimo: 0, permitirCupom: true, finalizarPeloWhatsapp: false,
            taxaEntrega: 0, freteGratisAcima: 0, aceitaPix: true, aceitaDinheiro: true, aceitaCartao: true,
        },
        rodape: {
            colunas: [], redes: [], mostrarLogo: true, mostrarContato: true, mostrarFormasPagamento: true,
            formasPagamento: ['pix', 'visa', 'mastercard'], textoLegal: '', corFundo: '', corTexto: '',
        },
        paginas: [],
        seo: { titulo: '', descricao: '', imagemCompartilhamento: '', indexavel: true },
        integracoes: {
            googleAnalyticsId: '', metaPixelId: '', botaoWhatsappFlutuante: true,
            mensagemWhatsapp: 'Olá! Vim pelo site e gostaria de ajuda.', cssPersonalizado: '',
        },
    };
}

const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

// Objetos: mescla recursivamente (o salvo vence). Arrays: o salvo substitui.
function mesclar(padrao: any, salvo: any): any {
    if (!isObj(padrao) || !isObj(salvo)) return salvo === undefined ? padrao : salvo;
    const out: any = { ...padrao };
    for (const k of Object.keys(salvo)) out[k] = k in padrao ? mesclar(padrao[k], salvo[k]) : salvo[k];
    return out;
}

// Documentos antigos continuam validos quando o contrato ganha campos novos.
export function mergeComPadrao(json: string | null | undefined, nomeLoja = ''): IModasSite {
    const padrao = criarSitePadrao(nomeLoja);
    if (!json) return padrao;
    let salvo: any;
    try { salvo = JSON.parse(json); } catch { return padrao; }
    if (!isObj(salvo)) return padrao;
    const site: IModasSite = mesclar(padrao, salvo);
    site.home.secoes = (salvo.home?.secoes ?? padrao.home.secoes).map((s: any) =>
        s?.tipo in SECAO_META ? mesclar(novaSecao(s.tipo), s) : null).filter(Boolean);
    site.schema = MODAS_SCHEMA;
    return site;
}
