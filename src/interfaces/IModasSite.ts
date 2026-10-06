// Contrato do documento do site da loja de moda (web-modas).
// E gravado como JSON em ModasConfiguracao.Rascunho/Publicado (WEBApi) e lido
// pelo web-modas. Mudou o formato? Incremente `schema` e trate em mergeComPadrao.

export const MODAS_SCHEMA = 1;

// ── Tema ────────────────────────────────────────────────────────────────────
export interface IModasCores {
    primaria: string;
    primariaTexto: string;     // texto sobre a cor primaria (botoes)
    secundaria: string;
    destaque: string;          // badges, promocao, etiquetas
    fundo: string;
    superficie: string;        // cards, header
    texto: string;
    textoSuave: string;
    borda: string;
    sucesso: string;
    erro: string;
}

export interface IModasTipografia {
    fonteTitulo: string;       // familia Google Fonts
    fonteCorpo: string;
    tamanhoBase: number;       // px
    pesoTitulo: 400 | 500 | 600 | 700 | 800;
    caixaAltaTitulos: boolean;
    espacamentoLetrasTitulo: number; // em/100 (ex.: 5 = 0.05em)
}

export interface IModasForma {
    raioBotao: number;         // px
    raioCard: number;
    raioImagem: number;
    estiloBotao: 'solido' | 'contorno' | 'minimalista';
    sombraCards: 'nenhuma' | 'suave' | 'forte';
    larguraMaxima: number;     // px do container
}

export interface IModasTema {
    cores: IModasCores;
    tipografia: IModasTipografia;
    forma: IModasForma;
    modoCor: 'claro' | 'escuro' | 'auto';
}

// ── Identidade ──────────────────────────────────────────────────────────────
export interface IModasIdentidade {
    nomeLoja: string;
    slogan: string;
    logoUrl: string;
    logoEscuraUrl: string;     // logo para fundo escuro/transparente (opcional)
    faviconUrl: string;
    whatsapp: string;
    email: string;
    telefone: string;
    endereco: string;
    horarioAtendimento: string;
}

// ── Cabecalho ───────────────────────────────────────────────────────────────
export type ModasLinkTipo = 'categoria' | 'colecao' | 'pagina' | 'url' | 'novidades' | 'promocoes';

export interface IModasMenuItem {
    id: string;
    rotulo: string;
    tipo: ModasLinkTipo;
    destino: string;           // id/slug da categoria, colecao, pagina ou URL
    destaque: boolean;         // renderiza em cor de destaque (ex.: "Outlet")
    filhos: IModasMenuItem[];
}

export interface IModasBarraAviso {
    ativa: boolean;
    texto: string;
    link: string;
    corFundo: string;
    corTexto: string;
}

export interface IModasCabecalho {
    layout: 'logo-esquerda' | 'logo-centro' | 'menu-abaixo';
    fixo: boolean;
    transparenteNaHome: boolean;
    mostrarBusca: boolean;
    mostrarConta: boolean;
    mostrarSacola: boolean;
    mostrarFavoritos: boolean;
    alturaLogo: number;        // px
    barraAviso: IModasBarraAviso;
    menu: IModasMenuItem[];
}

// ── Home: secoes ────────────────────────────────────────────────────────────
export type ModasSecaoTipo =
    | 'banner'
    | 'vitrine'
    | 'categorias'
    | 'colecao'
    | 'beneficios'
    | 'texto'
    | 'video'
    | 'depoimentos'
    | 'instagram'
    | 'newsletter'
    | 'espaco';

export interface IModasSecaoEstilo {
    fundo: string;             // '' = herda do tema
    corTexto: string;
    paddingY: number;          // px
    larguraTotal: boolean;     // ignora larguraMaxima do tema
    alinhamento: 'esquerda' | 'centro' | 'direita';
    ocultarNoMobile: boolean;
    ocultarNoDesktop: boolean;
}

export interface IModasSecaoBase {
    id: string;
    tipo: ModasSecaoTipo;
    ativa: boolean;
    titulo: string;            // titulo da secao (quando aplicavel)
    subtitulo: string;
    estilo: IModasSecaoEstilo;
}

export interface IModasBannerSlide {
    id: string;
    imagemDesktop: string;
    imagemMobile: string;
    titulo: string;
    subtitulo: string;
    textoBotao: string;
    linkTipo: ModasLinkTipo;
    linkDestino: string;
    posicaoTexto: 'esquerda' | 'centro' | 'direita';
    escurecerImagem: number;   // 0-80 (% overlay)
}

export interface IModasBanner extends IModasSecaoBase {
    tipo: 'banner';
    alturaDesktop: number;     // px
    alturaMobile: number;
    autoplay: boolean;
    intervaloSegundos: number;
    mostrarSetas: boolean;
    mostrarPontos: boolean;
    slides: IModasBannerSlide[];
}

export type ModasVitrineOrigem = 'novidades' | 'promocoes' | 'destaques' | 'mais-vendidos' | 'categoria' | 'colecao' | 'manual';

export interface IModasVitrine extends IModasSecaoBase {
    tipo: 'vitrine';
    origem: ModasVitrineOrigem;
    origemId: string;          // categoria/colecao quando aplicavel
    produtoIds: number[];      // quando origem = manual
    quantidade: number;
    layout: 'grade' | 'carrossel';
    colunasDesktop: number;
    colunasMobile: number;
    textoBotaoVerTodos: string;
}

export interface IModasCategoriaCard {
    id: string;
    rotulo: string;
    imagem: string;
    linkTipo: ModasLinkTipo;
    linkDestino: string;
}

export interface IModasCategorias extends IModasSecaoBase {
    tipo: 'categorias';
    formato: 'quadrado' | 'redondo' | 'retrato' | 'paisagem';
    colunasDesktop: number;
    colunasMobile: number;
    mostrarRotuloSobreImagem: boolean;
    cards: IModasCategoriaCard[];
}

export interface IModasColecao extends IModasSecaoBase {
    tipo: 'colecao';
    imagem: string;
    imagemMobile: string;
    textoBotao: string;
    linkTipo: ModasLinkTipo;
    linkDestino: string;
    posicaoImagem: 'esquerda' | 'direita' | 'fundo';
}

export interface IModasBeneficio {
    id: string;
    icone: 'truck' | 'refresh' | 'shield' | 'credit-card' | 'gift' | 'heart' | 'star' | 'whatsapp' | 'tag';
    titulo: string;
    descricao: string;
}

export interface IModasBeneficios extends IModasSecaoBase {
    tipo: 'beneficios';
    itens: IModasBeneficio[];
}

export interface IModasTexto extends IModasSecaoBase {
    tipo: 'texto';
    conteudo: string;          // texto simples; quebras de linha viram paragrafos
    textoBotao: string;
    linkTipo: ModasLinkTipo;
    linkDestino: string;
}

export interface IModasVideo extends IModasSecaoBase {
    tipo: 'video';
    url: string;               // YouTube/Vimeo/arquivo
    autoplay: boolean;
    proporcao: '16:9' | '9:16' | '1:1';
}

export interface IModasDepoimento {
    id: string;
    nome: string;
    texto: string;
    foto: string;
    nota: number;              // 1-5
}

export interface IModasDepoimentos extends IModasSecaoBase {
    tipo: 'depoimentos';
    itens: IModasDepoimento[];
}

export interface IModasInstagram extends IModasSecaoBase {
    tipo: 'instagram';
    usuario: string;
    imagens: { id: string; imagem: string; link: string }[];
}

export interface IModasNewsletter extends IModasSecaoBase {
    tipo: 'newsletter';
    textoBotao: string;
    placeholder: string;
    mensagemSucesso: string;
}

export interface IModasEspaco extends IModasSecaoBase {
    tipo: 'espaco';
    altura: number;
    mostrarLinha: boolean;
}

export type IModasSecao =
    | IModasBanner
    | IModasVitrine
    | IModasCategorias
    | IModasColecao
    | IModasBeneficios
    | IModasTexto
    | IModasVideo
    | IModasDepoimentos
    | IModasInstagram
    | IModasNewsletter
    | IModasEspaco;

// ── Catalogo / produto / checkout ───────────────────────────────────────────
export interface IModasCatalogo {
    colunasDesktop: number;
    colunasMobile: number;
    proporcaoImagem: '1:1' | '3:4' | '4:5' | '2:3';
    trocarImagemNoHover: boolean;
    mostrarCoresNoCard: boolean;
    mostrarParcelamento: boolean;
    parcelasMaximas: number;
    parcelaMinima: number;     // R$
    mostrarBadgeDesconto: boolean;
    mostrarBadgeNovidade: boolean;
    ordenacaoPadrao: 'recentes' | 'menor-preco' | 'maior-preco' | 'nome';
    produtosPorPagina: number;
    filtros: {
        categoria: boolean;
        tamanho: boolean;
        cor: boolean;
        preco: boolean;
    };
}

export interface IModasProduto {
    estiloGaleria: 'miniaturas-lateral' | 'miniaturas-abaixo' | 'rolagem';
    zoomImagem: boolean;
    estiloSeletorCor: 'bolinha' | 'miniatura' | 'texto';
    estiloSeletorTamanho: 'quadrado' | 'redondo' | 'lista';
    mostrarTabelaMedidas: boolean;
    tabelaMedidas: string;     // texto livre (ou HTML simples)
    mostrarAvisoEstoqueBaixo: boolean;
    limiteEstoqueBaixo: number;
    mostrarFreteCep: boolean;
    mostrarRelacionados: boolean;
    textoTrocas: string;
    mostrarCompartilhar: boolean;
}

export interface IModasCheckout {
    permitirEntrega: boolean;
    permitirRetirada: boolean;
    exigirCpf: boolean;
    pedirObservacao: boolean;
    mensagemRetirada: string;
    mensagemConfirmacao: string;
    pedidoMinimo: number;
    permitirCupom: boolean;
    finalizarPeloWhatsapp: boolean;
    taxaEntrega: number;        // R$ fixo; 0 = entrega gratis
    freteGratisAcima: number;   // R$; 0 = desligado
    aceitaPix: boolean;
    aceitaDinheiro: boolean;
    aceitaCartao: boolean;      // maquininha na entrega/retirada (nao ha pagamento online)
}

// ── Rodape / paginas / SEO ──────────────────────────────────────────────────
export interface IModasRodapeColuna {
    id: string;
    titulo: string;
    links: { id: string; rotulo: string; tipo: ModasLinkTipo; destino: string }[];
}

export interface IModasRedeSocial {
    id: string;
    rede: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'pinterest' | 'x' | 'whatsapp';
    url: string;
}

export interface IModasRodape {
    colunas: IModasRodapeColuna[];
    redes: IModasRedeSocial[];
    mostrarLogo: boolean;
    mostrarContato: boolean;
    mostrarFormasPagamento: boolean;
    formasPagamento: string[]; // 'pix' | 'visa' | ...
    textoLegal: string;
    corFundo: string;          // '' = herda do tema
    corTexto: string;
}

export interface IModasPagina {
    id: string;
    slug: string;
    titulo: string;
    conteudo: string;
    publicada: boolean;
}

export interface IModasSeo {
    titulo: string;
    descricao: string;
    imagemCompartilhamento: string;
    indexavel: boolean;
}

export interface IModasIntegracoes {
    googleAnalyticsId: string;
    metaPixelId: string;
    botaoWhatsappFlutuante: boolean;
    mensagemWhatsapp: string;
    cssPersonalizado: string;
}

// ── Raiz ────────────────────────────────────────────────────────────────────
export interface IModasSite {
    schema: number;
    identidade: IModasIdentidade;
    tema: IModasTema;
    cabecalho: IModasCabecalho;
    home: { secoes: IModasSecao[] };
    catalogo: IModasCatalogo;
    produto: IModasProduto;
    checkout: IModasCheckout;
    rodape: IModasRodape;
    paginas: IModasPagina[];
    seo: IModasSeo;
    integracoes: IModasIntegracoes;
}

// Resposta do endpoint /ModasConfiguracao
export interface IModasConfiguracaoResposta {
    rascunho: string | null;
    publicado: string | null;
    publicadoEm: string | null;
    versao: number;
    temAlteracoes: boolean;
}
