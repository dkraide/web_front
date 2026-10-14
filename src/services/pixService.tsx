import { api } from "./apiClient";
import {
  IPixConfiguracao,
  IPixConfiguracaoSalvar,
  IPixEstornoRequest,
  IPixEstornoResultado,
  IPixTesteConexao,
} from "../interfaces/IPixConfiguracao";

export const pixService = {
  async obterConfig(empresaId: number) {
    const { data } = await api.get<IPixConfiguracao>(`/v2/PixConfiguracao`, {
      params: { empresaId },
    });
    return data;
  },

  async salvarConfig(dto: IPixConfiguracaoSalvar) {
    const { data } = await api.post<IPixConfiguracao>(`/v2/PixConfiguracao`, dto);
    return data;
  },

  /** Testa o token digitado (ou o salvo, se vazio) sem gravar nem cobrar nada. */
  async testarConexao(dto: { empresaId: number; provider: string; accessToken?: string; extras?: Record<string, string> }) {
    const { data } = await api.post<IPixTesteConexao>(`/v2/PixConfiguracao/Testar`, dto);
    return data;
  },

  async estornar(dto: IPixEstornoRequest) {
    const { data } = await api.post<IPixEstornoResultado>(`/v2/PixConfiguracao/Estornar`, dto);
    return data;
  },
};
