export interface Food99Integracao {
  empresaId: number;
  appShopId: string;
  shopId?: string | null;
  status: "Pendente" | "Ativo" | "Erro";
  /** Página do 99Food onde o lojista autoriza a loja. Só vem ao conectar. */
  urlAutorizacao?: string | null;
  /** Motivo de a loja ainda estar pendente (resposta do 99Food). */
  mensagem?: string | null;
}

/** Resposta de /v1/shop/shop/detail (campos do 99Food, em snake_case). */
export interface Food99Loja {
  shop_id?: number | string;
  app_shop_id?: string;
  name?: string;
  addr?: string;
  /** 1 = online, 2 = offline. */
  biz_status?: number;
  /** 0 padrão, 1 aberta, 2 pausada, 3 fechada, 4 desconectada, 5 fechada no dia, 6 bloqueada, 7 fechada pelo sistema. */
  sub_biz_status?: number;
  auto_switch?: number;
  promise_produce_time?: number;
}

// ─── Cardápio (corpo do upload v3, em snake_case) ───────────────────────────

export interface Food99MenuItem {
  app_item_id: string;
  item_name: string;
  short_desc?: string | null;
  /** Centavos. */
  price: number;
  priority?: number;
  status: number;
  is_sold_separately: boolean;
  head_img?: string;
  app_modifier_group_ids?: string[];
}

export interface Food99MenuGrupoOpcao {
  app_item_id: string;
  price: number;
}

export interface Food99MenuGrupo {
  app_modifier_group_id: string;
  modifier_group_name: string;
  is_required: number;
  quantity_min_permitted: number;
  quantity_max_permitted: number;
  buy_mode: number;
  app_mg_items: Food99MenuGrupoOpcao[];
}

export interface Food99MenuCategoria {
  app_category_id: string;
  category_name: string;
  priority?: number;
  app_item_ids: string[];
}

export interface Food99MenuPayload {
  menus: { app_menu_id: string; menu_name: string; app_category_ids: string[] }[];
  categories: Food99MenuCategoria[];
  items: Food99MenuItem[];
  modifier_groups: Food99MenuGrupo[];
}

/** Item de pizza gerado do cadastro (sabor × tamanho, ou N sabores) com seu preço. */
export interface Food99ItemPreco {
  appItemId: string;
  nome: string;
  produtoId: number;
  tamanho?: string | null;
  /** PIZZA: um sabor, preço editável. PIZZA_MEIO: vários sabores, o preço vem da soma das frações. */
  tipo: "PIZZA" | "PIZZA_MEIO";
  editavel: boolean;
  /** Preço calculado do cadastro (tamanho + sabor). */
  precoPadrao: number;
  /** Preço escolhido pelo usuário; nulo = usa o padrão. */
  precoEscolhido?: number | null;
  precoEnviado: number;
}

/** Violação das regras do 99Food. ERRO impede o envio; AVISO só alerta. */
export interface Food99Problema {
  produtoId?: number | null;
  produtoNome?: string | null;
  nivel: "ERRO" | "AVISO";
  /** FOTO, LIMITE, PRECO... */
  codigo: string;
  mensagem: string;
}

export interface Food99MenuPreview {
  categorias: number;
  itensVendaveis: number;
  itensTotal: number;
  gruposModificadores: number;
  avisos: string[];
  itensPreco: Food99ItemPreco[];
  problemas: Food99Problema[];
  /** false quando há algum ERRO: o backend recusa o envio. */
  podeEnviar: boolean;
  cardapio: Food99MenuPayload;
}

export interface Food99MenuFalha {
  operationType?: string;
  message?: string;
  itemName?: string;
  appItemID?: string;
  cateName?: string;
  appCateID?: string;
  menuName?: string;
  appMenuID?: string;
  itemImageURL?: string;
}

export interface Food99MenuOperacao {
  operationType: string;
  successList?: string[];
  failedList?: Food99MenuFalha[];
}

export interface Food99MenuTarefa {
  taskId: string;
  /** 0 aguardando, 1 sucesso, 2 falhou, 3 nova tentativa, 4 executando, 5 sucesso parcial. */
  status: number;
  mensagem?: string | null;
  qtdCategorias: number;
  qtdItens: number;
  qtdGrupos: number;
  criadoEm: string;
  atualizadoEm: string;
  detalhe?: { operationList?: Food99MenuOperacao[] } | null;
  avisos?: string[] | null;
}
