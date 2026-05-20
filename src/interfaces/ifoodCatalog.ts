// ─────────────────────────────────────────────────────────────────────────────
// #region Shared
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodPreco {
  value: number;
  originalValue?: number | null;
}

export interface IFoodShift {
  startTime: string;
  endTime: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface IFoodPeso {
  quantity: number;
  /** Ex: kg, g, lb */
  unit: string;
}

export interface IFoodSellingOption {
  minimum: number;
  incremental: number;
  availableUnits?: string[] | null;
  averageUnit?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Catálogo
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodCatalogo {
  catalogId: string;
  context: string[];
  status: string;
}

export interface IFoodItemNaoVendavel {
  id: string;
  productId: string;
  restrictions: string[];
}

export interface IFoodCategoriaNaoVendavel {
  id: string;
  status: string;
  template: string;
  restrictions: string[];
  unsellableItems: IFoodItemNaoVendavel[];
}

export interface IFoodItensNaoVendaveis {
  categories: IFoodCategoriaNaoVendavel[];
}

export interface IFoodItemVendavel {
  itemId: string;
  categoryId: string;
  itemName: string;
  itemDescription?: string | null;
  categoryName: string;
  categoryIndex: number;
  itemIndex: number;
  itemPrice: IFoodPreco;
  logosUrls?: string[] | null;
  itemEan?: string | null;
  itemExternalCode?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Categoria
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodCriarCategoriaRequest {
  id?: string | null;
  name: string;
  externalCode?: string | null;
  status: string;
  index: number;
  template: string;
}

export interface IFoodEditarCategoriaRequest {
  name?: string | null;
  externalCode?: string | null;
  status?: string | null;
  index?: number | null;
}

export interface IFoodCategoriaResumo {
  id: string;
  name: string;
  externalCode?: string | null;
  status: string;
  index: number;
  template: string;
}

export interface IFoodItemContextModifier {
  catalogContext: string;
  itemContextId: string;
}

export interface IFoodCustomizationModifier {
  id: string;
  customizationOptionId: string;
  parentCustomizationOptionId?: string | null;
  catalogItemId: string;
  status: string;
  externalCode?: string | null;
  price: number;
  originalPrice?: number | null;
}

export interface IFoodGrupoOpcaoResumo {
  id: string;
  name: string;
  externalCode?: string | null;
  status: string;
  options?: IFoodOpcaoResumo[] | null;
}

export interface IFoodOpcaoResumo {
  id: string;
  status: string;
  productId: string;
  name: string;
  description?: string | null;
  externalCode?: string | null;
  imagePath?: string | null;
  price: IFoodPreco;
  ean?: string | null;
}

export interface IFoodItemDaCategoria {
  id: string;
  name: string;
  description?: string | null;
  additionalInformation?: string | null;
  externalCode?: string | null;
  status: string;
  productId: string;
  index: number;
  imagePath?: string | null;
  price: IFoodPreco;
  serving?: string | null;
  dietaryRestrictions?: string[] | null;
  ean?: string | null;
  tags?: string[] | null;
  hasOptionGroups: boolean;
  shifts?: IFoodShift[] | null;
  optionGroups?: IFoodGrupoOpcaoResumo[] | null;
  sellingOption?: IFoodSellingOption | null;
  contextModifiers?: IFoodItemContextModifier[] | null;
  customizationModifiers?: IFoodCustomizationModifier[] | null;
}

export interface IFoodPizzaTamanhoCategoria {
  id: string;
  name: string;
  index: number;
  status: string;
  externalCode?: string | null;
  slices: number;
  acceptedFractions?: number[] | null;
  price: IFoodPreco;
}

export interface IFoodPizzaMassaCategoria {
  id: string;
  name: string;
  status: string;
  externalCode?: string | null;
  index: number;
  price: IFoodPreco;
}

export interface IFoodPizzaBordaCategoria {
  id: string;
  name: string;
  status: string;
  externalCode?: string | null;
  index: number;
  price: IFoodPreco;
}

export interface IFoodPizzaSaborCategoria {
  id: string;
  name: string;
  description?: string | null;
  imagePath?: string | null;
  status: string;
  externalCode?: string | null;
  index: number;
  dietaryRestrictions?: string[] | null;
  prices?: Record<string, IFoodPreco> | null;
}

export interface IFoodPizzaCategoria {
  id: string;
  sizes?: IFoodPizzaTamanhoCategoria[] | null;
  crusts?: IFoodPizzaMassaCategoria[] | null;
  edges?: IFoodPizzaBordaCategoria[] | null;
  toppings?: IFoodPizzaSaborCategoria[] | null;
  shifts?: IFoodShift[] | null;
}

export interface IFoodCategoriaDetalhe {
  id: string;
  index: number;
  name: string;
  externalCode?: string | null;
  status: string;
  template?: string | null;
  items?: IFoodItemDaCategoria[] | null;
  pizza?: IFoodPizzaCategoria | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Itens da Categoria (flat)
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodItemFlatContextModifier {
  status: string;
  price?: IFoodPreco | null;
  externalCode?: string | null;
  catalogContext: string;
  itemContextId?: string | null;
}

export interface IFoodItemFlat {
  id: string;
  type: string;
  categoryId: string;
  status: string;
  price?: IFoodPreco | null;
  externalCode?: string | null;
  index: number;
  productId: string;
  tags?: string[] | null;
  shifts?: IFoodShift[] | null;
  contextModifiers?: IFoodItemFlatContextModifier[] | null;
}

export interface IFoodOptionGroupRef {
  id: string;
  min: number;
  max: number;
}

export interface IFoodProdutoFlat {
  id: string;
  name: string;
  externalCode?: string | null;
  description?: string | null;
  additionalInformation?: string | null;
  imagePath?: string | null;
  ean?: string | null;
  serving?: string | null;
  dietaryRestrictions?: string[] | null;
  tags?: string[] | null;
  quantity?: number | null;
  optionGroups?: IFoodOptionGroupRef[] | null;
  industrialized?: boolean | null;
}

export interface IFoodGrupoOpcaoFlat {
  id: string;
  name: string;
  status: string;
  externalCode?: string | null;
  optionGroupType?: string | null;
  optionIds: string[];
}

export interface IFoodOpcaoFlatContextModifier {
  status: string;
  price?: IFoodPreco | null;
  externalCode?: string | null;
  catalogContext: string;
  parentOptionId?: string | null;
}

export interface IFoodOpcaoFlat {
  id: string;
  status: string;
  productId: string;
  price?: IFoodPreco | null;
  fractions?: string[] | null;
  externalCode?: string | null;
  contextModifiers?: IFoodOpcaoFlatContextModifier[] | null;
}

export interface IFoodItensDaCategoria {
  categoryId: string;
  items: IFoodItemFlat[];
  products: IFoodProdutoFlat[];
  optionGroups: IFoodGrupoOpcaoFlat[];
  options: IFoodOpcaoFlat[];
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Produtos
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodCriarProdutoRequest {
  id?: string | null;
  name: string;
  description?: string | null;
  additionalInformation?: string | null;
  externalCode?: string | null;
  /** Imagem em base64. Use imagePath se preferir referenciar um upload já feito. */
  image?: string | null;
  /** Caminho retornado pelo endpoint de upload. */
  imagePath?: string | null;
  /** Ex: SERVES_1, SERVES_2, NOT_APPLICABLE */
  serving?: string | null;
  /** Ex: ORGANIC, VEGAN, VEGETARIAN, GLUTEN_FREE */
  dietaryRestrictions?: string[] | null;
  ean?: string | null;
  weight?: IFoodPeso | null;
  multipleImages?: string[] | null;
}

export interface IFoodEditarProdutoRequest {
  name: string;
  description?: string | null;
  additionalInformation?: string | null;
  externalCode?: string | null;
  image?: string | null;
  imagePath?: string | null;
  serving?: string | null;
  dietaryRestrictions?: string[] | null;
  ean?: string | null;
  weight?: IFoodPeso | null;
  multipleImages?: string[] | null;
}

export interface IFoodProduto {
  id: string;
  name: string;
  description?: string | null;
  additionalInformation?: string | null;
  externalCode?: string | null;
  image?: string | null;
  serving?: string | null;
  dietaryRestrictions?: string[] | null;
  tags?: unknown[] | null;
  ean?: string | null;
  sellingOption?: IFoodSellingOption | null;
  weight?: IFoodPeso | null;
  multipleImages?: string | null;
  optionGroups?: IFoodGrupoOpcaoResumo | null;
  industrialized?: boolean | null;
}

export interface IFoodAtualizarStatusProdutoBatchRequest {
  /** UUID do produto. Informe productId ou externalCode. */
  productId?: string | null;
  /** Código externo do produto. Informe productId ou externalCode. */
  externalCode?: string | null;
  /** Ex: AVAILABLE, UNAVAILABLE */
  status: string;
  /** Valores aceitos: ITEM, OPTION. Se omitido, ambos são atualizados. */
  resources?: string[] | null;
  /** Restringe a atualização a um catálogo específico. Opcional. */
  catalogId?: string | null;
}

export interface IFoodAtualizarPrecoProdutoBatchRequest {
  /** UUID do produto. Informe productId ou externalCode. */
  productId?: string | null;
  /** Código externo do produto. Informe productId ou externalCode. */
  externalCode?: string | null;
  price: IFoodPreco;
  /** Valores aceitos: ITEM, OPTION. Se omitido, ambos são atualizados. */
  resources?: string[] | null;
  /** Restringe a atualização a um catálogo específico. Opcional. */
  catalogId?: string | null;
}

export interface IFoodBatchResposta {
  batchId: string;
  url?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Itens
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodOptionContextModifier {
  parentOptionId?: string | null;
  catalogContext: string;
  status?: string | null;
  price?: IFoodPreco | null;
  externalCode?: string | null;
}

export interface IFoodItemPayload {
  id: string;
  type: string;
  /** Na criação de pizza pode ser null — o iFood cria a categoria automaticamente. */
  categoryId: string | null;
  status: string;
  price?: IFoodPreco | null;
  externalCode?: string | null;
  index: number;
  productId: string;
  tags?: string[] | null;
  shifts?: IFoodShift[] | null;
  contextModifiers?: IFoodItemFlatContextModifier[] | null;
}

export interface IFoodProdutoPayload {
  id: string;
  name: string;
  externalCode?: string | null;
  description?: string | null;
  additionalInformation?: string | null;
  imagePath?: string | null;
  ean?: string | null;
  serving?: string | null;
  dietaryRestrictions?: string[] | null;
  tags?: string[] | null;
  quantity?: number | null;
  optionGroups?: IFoodOptionGroupRef[] | null;
  industrialized?: boolean | null;
}

export interface IFoodGrupoOpcaoPayload {
  id: string;
  name: string;
  status: string;
  externalCode?: string | null;
  /** Use IFoodOptionGroupType. Ex: SIZE, TOPPING, CRUST, EDGE */
  optionGroupType?: string | null;
  optionIds: string[];
  index?: number;
  min?: number;
  max?: number;
}

export interface IFoodOpcaoPayload {
  id: string;
  status: string;
  index: number;
  productId: string;
  price?: IFoodPreco | null;
  fractions?: number[] | null;
  externalCode?: string | null;
  contextModifiers?: IFoodOptionContextModifier[] | null;
}

export interface IFoodSalvarItemDto {
  item: IFoodItemPayload;
  products: IFoodProdutoPayload[];
  optionGroups: IFoodGrupoOpcaoPayload[];
  options: IFoodOpcaoPayload[];
}

export interface IFoodPrecoPorCatalogo {
  value: number;
  originalValue?: number | null;
  /** Ex: DEFAULT, WHITELABEL, INDOOR */
  catalogContext: string;
}

export interface IFoodStatusPorCatalogo {
  /** Ex: AVAILABLE, UNAVAILABLE */
  status: string;
  /** Ex: DEFAULT, WHITELABEL, INDOOR */
  catalogContext: string;
}

export interface IFoodExternalCodePorCatalogo {
  externalCode: string;
  /** Ex: DEFAULT, WHITELABEL, INDOOR */
  catalogContext: string;
}

export interface IFoodEditarPrecoItemRequest {
  itemId: string;
  price?: IFoodPreco | null;
  priceByCatalog?: IFoodPrecoPorCatalogo[] | null;
}

export interface IFoodEditarStatusItemRequest {
  itemId: string;
  /** Ex: AVAILABLE, UNAVAILABLE */
  status?: string | null;
  statusByCatalog?: IFoodStatusPorCatalogo[] | null;
}

export interface IFoodEditarExternalCodeItemRequest {
  itemId: string;
  externalCode?: string | null;
  externalCodeByCatalog?: IFoodExternalCodePorCatalogo[] | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Grupos de Complementos
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodGrupoComplemento {
  id: string;
  name: string;
  externalCode?: string | null;
  status: string;
  /** Preenchido apenas quando includeOptions = true */
  options?: IFoodOpcaoDoGrupo[] | null;
}

export interface IFoodOpcaoDoGrupo {
  id: string;
  status: string;
  productId: string;
  name: string;
  description?: string | null;
  externalCode?: string | null;
  imagePath?: string | null;
  price: IFoodPreco;
  ean?: string | null;
}

export interface IFoodGrupoComplementoResumo {
  id: string;
  name: string;
}

export interface IFoodEditarNomeGrupoComplementoRequest {
  name: string;
}

export interface IFoodEditarStatusGrupoComplementoRequest {
  /** Ex: AVAILABLE, UNAVAILABLE */
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Opções
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodContextModifierOpcao {
  status?: string | null;
  price?: IFoodPreco | null;
  externalCode?: string | null;
  /** Ex: DEFAULT, WHITELABEL, INDOOR */
  catalogContext: string;
  parentOptionId?: string | null;
}

export interface IFoodProdutoInlineOpcaoRequest {
  name: string;
  externalCode?: string | null;
  description?: string | null;
  additionalInformation?: string | null;
  imagePath?: string | null;
  ean?: string | null;
  /** Ex: SERVES_1, SERVES_2, NOT_APPLICABLE */
  serving?: string | null;
  /** Ex: ORGANIC, VEGAN, VEGETARIAN, GLUTEN_FREE */
  dietaryRestrictions?: string[] | null;
  tags?: string[] | null;
  quantity?: number | null;
}

export interface IFoodCriarOpcaoRequest {
  /** Ex: AVAILABLE, UNAVAILABLE */
  status: string;
  /** UUID de produto existente. Use este ou product, não ambos. */
  productId?: string | null;
  /** Produto inline. Use este ou productId, não ambos. */
  product?: IFoodProdutoInlineOpcaoRequest | null;
  externalCode?: string | null;
  price?: IFoodPreco | null;
  index: number;
  /**
   * Modificadores de contexto.
   * Usado em pizzas para definir preço por tamanho × catálogo.
   */
  contextOptionModifiers?: IFoodContextModifierOpcao[] | null;
}

export interface IFoodOpcaoCriada {
  id: string;
  status: string;
  index: number;
  productId: string;
  price?: IFoodPreco | null;
  externalCode?: string | null;
  contextOptionModifiers?: IFoodContextModifierOpcao[] | null;
}

export interface IFoodEditarPrecoOpcaoRequest {
  optionId: string;
  price?: IFoodPreco | null;
  /** UUID do tamanho. Obrigatório para sabores de pizza. */
  parentCustomizationOptionId?: string | null;
  priceByCatalog?: IFoodPrecoPorCatalogo[] | null;
}

export interface IFoodEditarStatusOpcaoRequest {
  optionId: string;
  /** Ex: AVAILABLE, UNAVAILABLE */
  status?: string | null;
  /** UUID do tamanho. Obrigatório para sabores de pizza. */
  parentCustomizationOptionId?: string | null;
  statusByCatalog?: IFoodStatusPorCatalogo[] | null;
}

export interface IFoodEditarExternalCodeOpcaoRequest {
  optionId: string;
  externalCode?: string | null;
  /** UUID do tamanho. Obrigatório para sabores de pizza. */
  parentCustomizationOptionId?: string | null;
  externalCodeByCatalog?: IFoodExternalCodePorCatalogo[] | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Pizza
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodPizzaTamanhoRequest {
  nome: string;
  quantidade?: number | null;
  /** Ex: [1] para inteira, [1,2] para meio a meio */
  fracoes: number[];
  imagemBase64?: string | null;
  optionId?: string | null;
  productId?: string | null;
  externalCode?: string | null;
}

/**
 * Preço de um sabor para um tamanho específico.
 * A ordem deve corresponder à ordem de tamanhos enviados.
 */
export interface IFoodPizzaSaborPrecoRequest {
  tamanhoOptionId?: string | null;
  precoDefault: number;
  precoOriginalDefault?: number | null;
  precoWhitelabel?: number | null;
  precoOriginalWhitelabel?: number | null;
}

export interface IFoodPizzaSaborRequest {
  nome: string;
  descricao?: string | null;
  precosPorTamanho: IFoodPizzaSaborPrecoRequest[];
  optionId?: string | null;
  productId?: string | null;
  externalCode?: string | null;
}

export interface IFoodPizzaMassaRequest {
  nome: string;
  preco: number;
  precoOriginal?: number | null;
  optionId?: string | null;
  productId?: string | null;
  externalCode?: string | null;
}

export interface IFoodPizzaBordaRequest {
  nome: string;
  preco: number;
  precoOriginal?: number | null;
  optionId?: string | null;
  productId?: string | null;
  externalCode?: string | null;
}

/**
 * Payload de criação ou edição de pizza.
 * Na criação, deixe itemId/productId/grupoIds como null.
 * Na edição, informe todos os IDs existentes.
 */
export interface IFoodCriarPizzaRequest {
  nome: string;
  descricao?: string | null;
  imagemBase64?: string | null;
  produtoKrdId?: number | null;
  tamanhos: IFoodPizzaTamanhoRequest[];
  /** Pode ser vazio na criação — sabores são adicionados depois via opções. */
  sabores: IFoodPizzaSaborRequest[];
  massas: IFoodPizzaMassaRequest[];
  bordas: IFoodPizzaBordaRequest[];
  /** Preencher apenas na edição */
  itemId?: string | null;
  productId?: string | null;
  grupoTamanhoId?: string | null;
  grupoSaborId?: string | null;
  grupoMassaId?: string | null;
  grupoBordaId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Batch
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodBatchItemResultado {
  resourceId: string;
  result: string;
  failureReason?: string | null;
}

export interface IFoodResultadoBatch {
  /** Ex: COMPLETED, PROCESSING, FAILED */
  batchStatus: string;
  results: IFoodBatchItemResultado[];
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Estoque
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodSalvarEstoqueRequest {
  productId: string;
  amount: number;
}

export interface IFoodExcluirEstoqueBatchRequest {
  productIds: string[];
}

export interface IFoodEstoqueProduto {
  ownerId: string;
  productId: string;
  amount: number;
  globalStock?: boolean | null;
  allowNegativeStock?: boolean | null;
  inStock?: boolean | null;
}

export interface IFoodEstoqueProdutoResumo {
  ownerId: string;
  productId: string;
  amount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Imagem
// ─────────────────────────────────────────────────────────────────────────────

export interface IFoodImagemUpload {
  /** Passe este valor no campo imagePath ao criar ou editar um produto. */
  imagePath: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// #region Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function parseVinculo(externalCode?: string | null) {
  if (!externalCode) return null;
  const [prefixo, id] = externalCode.split(":");
  if (!prefixo || !id || isNaN(Number(id))) return null;
  return { tipo: prefixo as "produto" | "classe" | "materia", id: Number(id) };
}

export function externalCodeProduto(id: number) { return `produto:${id}`; }
export function externalCodeClasse(id: number)  { return `classe:${id}`; }
export function externalCodeMateria(id: number) { return `materia:${id}`; }