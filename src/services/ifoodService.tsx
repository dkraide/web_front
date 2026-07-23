import { api } from "./apiClient";
import {
  IFoodAtualizarHorariosDto,
  IFoodCriarInterrupcaoDto,
  IFoodCriarIntegracaoDto,
  IFoodHorario,
  IFoodIntegracaoStatus,
  IFoodInterrupcao,
  IFoodMerchant,
  IFoodStatusLoja,
} from "../interfaces/ifood";

type ApiResult<T> = { sucesso: boolean; dados: T; erro: string };

export const ifoodService = {

  // Merchants disponíveis no app centralizado
  async listarMerchantsDisponiveis() {
    const { data } = await api.get<ApiResult<IFoodMerchant[]>>(
      `/ifood/merchants`
    );
    return data;
  },

  async obterMerchant(merchantId: string) {
    const { data } = await api.get<ApiResult<IFoodMerchant>>(
      `/ifood/merchants/${merchantId}`
    );
    return data;
  },

  // Integrações por empresa
  async listarIntegracoes(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodIntegracaoStatus[]>>(
      `/ifood/empresas/${empresaId}/integracoes`
    );
    return data;
  },

  async adicionarIntegracao(empresaId: number, dto: IFoodCriarIntegracaoDto) {
    const { data } = await api.post<ApiResult<IFoodIntegracaoStatus>>(
      `/ifood/empresas/${empresaId}/integracoes`,
      dto
    );
    return data;
  },

  async verificarIntegracao(empresaId: number, merchantId: string) {
    const { data } = await api.post<ApiResult<IFoodIntegracaoStatus>>(
      `/ifood/empresas/${empresaId}/integracoes/${merchantId}/verificar`
    );
    return data;
  },

  async removerIntegracao(empresaId: number, merchantId: string) {
    const { data } = await api.delete<ApiResult<object>>(
      `/ifood/empresas/${empresaId}/integracoes/${merchantId}`
    );
    return data;
  },

  // Status da loja
  async getStatusLoja(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodStatusLoja[]>>(
      `/ifood/empresas/${empresaId}/status-loja`
    );
    return data;
  },

  // Interrupções
  async getInterrupcoes(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodInterrupcao[]>>(
      `/ifood/empresas/${empresaId}/interrupcoes`
    );
    return data;
  },

  async criarInterrupcao(empresaId: number, dto: IFoodCriarInterrupcaoDto) {
    const { data } = await api.post<ApiResult<IFoodInterrupcao>>(
      `/ifood/empresas/${empresaId}/interrupcoes`,
      dto
    );
    return data;
  },

  async removerInterrupcao(empresaId: number, interruptionId: string) {
    const { data } = await api.delete<ApiResult<object>>(
      `/ifood/empresas/${empresaId}/interrupcoes/${interruptionId}`
    );
    return data;
  },

  // Horários
  async getHorarios(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodHorario[]>>(
      `/ifood/empresas/${empresaId}/horarios`
    );
    return data;
  },

  async atualizarHorarios(empresaId: number, dto: IFoodAtualizarHorariosDto) {
    const { data } = await api.put<ApiResult<IFoodHorario[]>>(
      `/ifood/empresas/${empresaId}/horarios`,
      dto
    );
    return data;
  },
};
