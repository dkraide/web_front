import { api } from "./apiClient";
import {
  IFoodAutorizarDto,
  IFoodAtualizarHorariosDto,
  IFoodCriarInterrupcaoDto,
  IFoodHorario,
  IFoodIntegracaoStatus,
  IFoodInterrupcao,
  IFoodMerchant,
  IFoodStatusLoja,
  IFoodUserCode,
} from "../interfaces/ifood";

type ApiResult<T> = { sucesso: boolean; dados: T; erro: string };

export const ifoodService = {
  
  // Auth
  async getStatus(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodIntegracaoStatus>>(
      `/ifood/empresas/${empresaId}/status`
    );
    return data;
  },

  async iniciarAutorizacao(empresaId: number) {
    const { data } = await api.post<ApiResult<IFoodUserCode>>(
      `/ifood/empresas/${empresaId}/iniciar`
    );
    return data;
  },

  async autorizar(empresaId: number, dto: IFoodAutorizarDto) {
    const { data } = await api.post<ApiResult<IFoodIntegracaoStatus>>(
      `/ifood/empresas/${empresaId}/autorizar`,
      dto
    );
    return data;
  },

  async revogar(empresaId: number) {
    const { data } = await api.delete<ApiResult<object>>(
      `/ifood/empresas/${empresaId}`
    );
    return data;
  },

  // Merchant
  async getMerchant(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodMerchant>>(
      `/ifood/empresas/${empresaId}/merchant`
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
  async listarMerchants(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodMerchant[]>>(
        `/ifood/empresas/${empresaId}/merchants`
    );
    return data;
},

async vincularMerchant(empresaId: number, merchantId: string) {
    const { data } = await api.post<ApiResult<IFoodIntegracaoStatus>>(
        `/ifood/empresas/${empresaId}/merchants/${merchantId}/vincular`
    );
    return data;
},
};