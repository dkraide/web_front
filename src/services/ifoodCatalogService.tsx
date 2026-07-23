import { api } from "./apiClient";
import type {
  IFoodAtualizarPrecoProdutoBatchRequest,
  IFoodAtualizarStatusProdutoBatchRequest,
  IFoodBatchResposta,
  IFoodCategoriaDetalhe,
  IFoodCategoriaResumo,
  IFoodCatalogo,
  IFoodCriarCategoriaRequest,
  IFoodCriarOpcaoRequest,
  IFoodCriarPizzaRequest,
  IFoodCriarProdutoRequest,
  IFoodEditarCategoriaRequest,
  IFoodEditarExternalCodeOpcaoRequest,
  IFoodEditarItemRequest,
  IFoodEditarNomeGrupoComplementoRequest,
  IFoodEditarPrecoOpcaoRequest,
  IFoodEditarProdutoRequest,
  IFoodEditarStatusGrupoComplementoRequest,
  IFoodEditarStatusOpcaoRequest,
  IFoodEstoqueProduto,
  IFoodEstoqueProdutoResumo,
  IFoodExcluirEstoqueBatchRequest,
  IFoodGrupoComplemento,
  IFoodGrupoComplementoResumo,
  IFoodImagemUpload,
  IFoodItensDaCategoria,
  IFoodItensNaoVendaveis,
  IFoodItemVendavel,
  IFoodOpcaoCriada,
  IFoodProduto,
  IFoodResultadoBatch,
  IFoodSalvarEstoqueRequest,
  IFoodSalvarItemDto,
} from "../interfaces/ifoodCatalog";

type ApiResult<T> = { sucesso: boolean; dados: T; erro: string };

const BASE = (empresaId: number) => `/ifood/catalog/empresas/${empresaId}`;

export const ifoodCatalogService = {
  // ===========================================================================
  // #region Catálogos
  // ===========================================================================

  /** Lista todos os catálogos disponíveis para o merchant. */
  async listarCatalogos(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodCatalogo[]>>(
      `${BASE(empresaId)}/catalogos`
    );
    return data;
  },

  /** Retorna a versão do catálogo da loja. */
  async obterVersaoCatalogo(empresaId: number) {
    const { data } = await api.get<ApiResult<string>>(
      `${BASE(empresaId)}/catalogos/versao`
    );
    return data;
  },

  /** Lista todos os itens e categorias não vendáveis do catálogo. */
  async listarItensNaoVendaveis(empresaId: number, catalogId: string) {
    const { data } = await api.get<ApiResult<IFoodItensNaoVendaveis>>(
      `${BASE(empresaId)}/catalogos/${catalogId}/itens-nao-vendaveis`
    );
    return data;
  },

  /** Lista todos os itens vendáveis do catálogo com atributos completos e horários. */
  async listarItensVendaveis(empresaId: number, groupId: string) {
    const { data } = await api.get<ApiResult<IFoodItemVendavel[]>>(
      `${BASE(empresaId)}/catalogos/${groupId}/itens-vendaveis`
    );
    return data;
  },

  // ===========================================================================
  // #region Categorias
  // ===========================================================================

  /** Lista todas as categorias de um catálogo. */
  async listarCategorias(
    empresaId: number,
    catalogId: string,
    includeItems = false
  ) {
    const { data } = await api.get<ApiResult<IFoodCategoriaDetalhe[]>>(
      `${BASE(empresaId)}/catalogos/${catalogId}/categorias`,
      { params: { includeItems } }
    );
    return data;
  },

  /** Retorna os detalhes de uma categoria específica. */
  async obterCategoria(
    empresaId: number,
    catalogId: string,
    categoriaId: string,
    includeItems = false
  ) {
    const { data } = await api.get<ApiResult<IFoodCategoriaDetalhe>>(
      `${BASE(empresaId)}/catalogos/${catalogId}/categorias/${categoriaId}`,
      { params: { includeItems } }
    );
    return data;
  },

  /** Cria uma nova categoria dentro de um catálogo. */
  async criarCategoria(
    empresaId: number,
    catalogId: string,
    request: IFoodCriarCategoriaRequest
  ) {
    const { data } = await api.post<ApiResult<IFoodCategoriaResumo>>(
      `${BASE(empresaId)}/catalogos/${catalogId}/categorias`,
      request
    );
    return data;
  },

  /** Edita os dados de uma categoria. Campos não enviados mantêm o valor atual. */
  async editarCategoria(
    empresaId: number,
    catalogId: string,
    categoriaId: string,
    request: IFoodEditarCategoriaRequest
  ) {
    const { data } = await api.patch<ApiResult<IFoodCategoriaResumo>>(
      `${BASE(empresaId)}/catalogos/${catalogId}/categorias/${categoriaId}`,
      request
    );
    return data;
  },

  /** Lista todos os itens de uma categoria no formato flat. */
  async listarItensDaCategoria(empresaId: number, categoriaId: string) {
    const { data } = await api.get<ApiResult<IFoodItensDaCategoria>>(
      `${BASE(empresaId)}/categorias/${categoriaId}/itens`
    );
    return data;
  },

  /** Exclui uma categoria e todos os seus itens do merchant. */
  async excluirCategoria(empresaId: number, categoriaId: string) {
    const { data } = await api.delete<ApiResult<object>>(
      `${BASE(empresaId)}/categorias/${categoriaId}`
    );
    return data;
  },

  // ===========================================================================
  // #region Produtos
  // ===========================================================================

  /** Lista todos os produtos do merchant com paginação. */
  async listarProdutos(empresaId: number, limit = 50, page = 1) {
    const { data } = await api.get<ApiResult<IFoodProduto[]>>(
      `${BASE(empresaId)}/produtos`,
      { params: { limit, page } }
    );
    return data;
  },

  /** Retorna um produto pelo seu UUID. */
  async obterProduto(empresaId: number, productId: string) {
    const { data } = await api.get<ApiResult<IFoodProduto>>(
      `${BASE(empresaId)}/produtos/${productId}`
    );
    return data;
  },

  /** Lista todos os produtos que possuem o externalCode informado. */
  async listarProdutosPorExternalCode(empresaId: number, externalCode: string) {
    const { data } = await api.get<ApiResult<IFoodProduto[]>>(
      `${BASE(empresaId)}/produtos/externalCode/${externalCode}`
    );
    return data;
  },

  /** Cria um produto. Deve ser associado a uma categoria via criação de item após criado. */
  async criarProduto(empresaId: number, request: IFoodCriarProdutoRequest) {
    const { data } = await api.post<ApiResult<IFoodProduto>>(
      `${BASE(empresaId)}/produtos`,
      request
    );
    return data;
  },

  /** Edita um produto existente. Todos os itens e opções associados também serão atualizados. */
  async editarProduto(
    empresaId: number,
    productId: string,
    request: IFoodEditarProdutoRequest
  ) {
    const { data } = await api.put<ApiResult<IFoodEditarProdutoRequest>>(
      `${BASE(empresaId)}/produtos/${productId}`,
      request
    );
    return data;
  },

  /** Exclui um produto e todos os itens e opções associados em todos os catálogos. */
  async excluirProduto(empresaId: number, productId: string) {
    const { data } = await api.delete<ApiResult<object>>(
      `${BASE(empresaId)}/produtos/${productId}`
    );
    return data;
  },

  /** Atualiza o status de múltiplos produtos em batch (assíncrono). */
  async atualizarStatusProdutosBatch(
    empresaId: number,
    request: IFoodAtualizarStatusProdutoBatchRequest[],
    catalogContext?: string | null
  ) {
    const { data } = await api.patch<ApiResult<IFoodBatchResposta>>(
      `${BASE(empresaId)}/produtos/batch/status`,
      request,
      { params: catalogContext ? { catalogContext } : undefined }
    );
    return data;
  },

  /** Atualiza o preço de múltiplos produtos em batch (assíncrono). */
  async atualizarPrecoProdutosBatch(
    empresaId: number,
    request: IFoodAtualizarPrecoProdutoBatchRequest[],
    catalogContext?: string | null
  ) {
    const { data } = await api.patch<ApiResult<IFoodBatchResposta>>(
      `${BASE(empresaId)}/produtos/batch/preco`,
      request,
      { params: catalogContext ? { catalogContext } : undefined }
    );
    return data;
  },

  // ===========================================================================
  // #region Itens
  // ===========================================================================

  /** Retorna um item e todas as suas entidades vinculadas (produtos, grupos, opções). */
  async obterItemFlat(empresaId: number, itemId: string) {
    const { data } = await api.get<ApiResult<IFoodSalvarItemDto>>(
      `${BASE(empresaId)}/itens/${itemId}`
    );
    return data;
  },

  /** Cria ou atualiza um item e suas entidades vinculadas. */
  async salvarItem(empresaId: number, payload: IFoodSalvarItemDto) {
    const { data } = await api.put<ApiResult<IFoodSalvarItemDto>>(
      `${BASE(empresaId)}/itens`,
      payload
    );
    return data;
  },

  /**
   * Edita parcialmente um item (status, preço, externalCode ou combinações).
   * Substitui os antigos editarPrecoItem/editarStatusItem/editarExternalCodeItem.
   */
  async editarItem(
    empresaId: number,
    itemId: string,
    request: IFoodEditarItemRequest
  ) {
    const { data } = await api.patch<ApiResult<object>>(
      `${BASE(empresaId)}/itens/${itemId}`,
      request
    );
    return data;
  },


  // ===========================================================================
  // #region Grupos de Complementos
  // ===========================================================================

  /** Lista todos os grupos de complementos do merchant. */
  async listarGruposComplementos(
    empresaId: number,
    includeOptions = false,
    catalogContext?: string | null
  ) {
    const { data } = await api.get<ApiResult<IFoodGrupoComplemento[]>>(
      `${BASE(empresaId)}/grupos-complementos`,
      { params: { includeOptions, ...(catalogContext ? { catalogContext } : {}) } }
    );
    return data;
  },

  /** Edita o nome de um grupo de complementos. */
  async editarNomeGrupoComplemento(
    empresaId: number,
    optionGroupId: string,
    request: IFoodEditarNomeGrupoComplementoRequest
  ) {
    const { data } = await api.patch<ApiResult<IFoodGrupoComplementoResumo>>(
      `${BASE(empresaId)}/grupos-complementos/${optionGroupId}/nome`,
      request
    );
    return data;
  },

  /** Edita o status de um grupo de complementos. Afeta todos os produtos associados. */
  async editarStatusGrupoComplemento(
    empresaId: number,
    optionGroupId: string,
    request: IFoodEditarStatusGrupoComplementoRequest
  ) {
    const { data } = await api.patch<ApiResult<object>>(
      `${BASE(empresaId)}/grupos-complementos/${optionGroupId}/status`,
      request
    );
    return data;
  },

  /** Exclui um grupo de complementos. Todos os produtos associados deixarão de recebê-lo. */
  async excluirGrupoComplemento(empresaId: number, optionGroupId: string) {
    const { data } = await api.delete<ApiResult<object>>(
      `${BASE(empresaId)}/grupos-complementos/${optionGroupId}`
    );
    return data;
  },

  /** Desassocia um grupo de complementos de um produto específico. */
  async desassociarGrupoComplementoDoProduto(
    empresaId: number,
    optionGroupId: string,
    productId: string
  ) {
    const { data } = await api.delete<ApiResult<object>>(
      `${BASE(empresaId)}/grupos-complementos/${optionGroupId}/produtos/${productId}`
    );
    return data;
  },

  // ===========================================================================
  // #region Opções
  // ===========================================================================

  /**
   * Cria uma opção dentro de um grupo de complementos.
   * Informe productId para referenciar um produto existente,
   * ou preencha product para criar um produto inline.
   */
  async criarOpcao(
    empresaId: number,
    optionGroupId: string,
    request: IFoodCriarOpcaoRequest
  ) {
    const { data } = await api.post<ApiResult<IFoodOpcaoCriada>>(
      `${BASE(empresaId)}/grupos-complementos/${optionGroupId}/opcoes`,
      request
    );
    return data;
  },

  /** Exclui uma opção de um grupo de complementos. */
  async excluirOpcao(
    empresaId: number,
    optionGroupId: string,
    productId: string,
    catalogContext?: string | null
  ) {
    const { data } = await api.delete<ApiResult<object>>(
      `${BASE(empresaId)}/grupos-complementos/${optionGroupId}/produtos/${productId}/opcao`,
      { params: catalogContext ? { catalogContext } : undefined }
    );
    return data;
  },

  /**
   * Edita o preço de uma opção.
   * Para sabores de pizza, informe parentCustomizationOptionId com o UUID do tamanho.
   */
  async editarPrecoOpcao(
    empresaId: number,
    request: IFoodEditarPrecoOpcaoRequest
  ) {
    const { data } = await api.patch<ApiResult<IFoodEditarPrecoOpcaoRequest>>(
      `${BASE(empresaId)}/opcoes/preco`,
      request
    );
    return data;
  },

  /**
   * Edita o status de uma opção.
   * Para sabores de pizza, informe parentCustomizationOptionId com o UUID do tamanho.
   */
  async editarStatusOpcao(
    empresaId: number,
    request: IFoodEditarStatusOpcaoRequest
  ) {
    const { data } = await api.patch<ApiResult<object>>(
      `${BASE(empresaId)}/opcoes/status`,
      request
    );
    return data;
  },

  /**
   * Edita o código externo de uma opção.
   * Para sabores de pizza, informe parentCustomizationOptionId com o UUID do tamanho.
   */
  async editarExternalCodeOpcao(
    empresaId: number,
    request: IFoodEditarExternalCodeOpcaoRequest
  ) {
    const { data } = await api.patch<ApiResult<object>>(
      `${BASE(empresaId)}/opcoes/externalCode`,
      request
    );
    return data;
  },

  // ===========================================================================
  // #region Batch
  // ===========================================================================

  /** Retorna o resultado de uma operação batch. Use o batchId retornado pelos endpoints de atualização. */
  async obterResultadoBatch(empresaId: number, batchId: string) {
    const { data } = await api.get<ApiResult<IFoodResultadoBatch>>(
      `${BASE(empresaId)}/batch/${batchId}`
    );
    return data;
  },

  // ===========================================================================
  // #region Estoque
  // ===========================================================================

  /** Retorna o estoque atual de um produto. */
  async obterEstoqueProduto(empresaId: number, productId: string) {
    const { data } = await api.get<ApiResult<IFoodEstoqueProdutoResumo>>(
      `${BASE(empresaId)}/estoque/${productId}`
    );
    return data;
  },

  /** Cria ou atualiza o estoque de um produto. */
  async salvarEstoqueProduto(
    empresaId: number,
    request: IFoodSalvarEstoqueRequest
  ) {
    const { data } = await api.post<ApiResult<IFoodEstoqueProduto>>(
      `${BASE(empresaId)}/estoque`,
      request
    );
    return data;
  },

  /** Exclui o estoque de múltiplos produtos em lote. */
  async excluirEstoqueProdutos(
    empresaId: number,
    request: IFoodExcluirEstoqueBatchRequest
  ) {
    const { data } = await api.post<ApiResult<object>>(
      `${BASE(empresaId)}/estoque/batch/excluir`,
      request
    );
    return data;
  },

  // ===========================================================================
  // #region Imagem
  // ===========================================================================

  /**
   * Faz upload de uma imagem.
   * Retorna um imagePath para uso em criação ou edição de produtos.
   * @param base64Image Imagem em base64. Pode ser enviada com ou sem o prefixo data:image/png;base64,. Tamanho máximo: 5MB.
   */
  async uploadImagem(empresaId: number, base64Image: string) {
    const { data } = await api.post<ApiResult<IFoodImagemUpload>>(
      `${BASE(empresaId)}/imagens/upload`,
      { base64Image }
    );
    return data;
  },
};