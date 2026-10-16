import { api } from "./apiClient";
import {
  Food99Integracao,
  Food99Loja,
  Food99MenuPreview,
  Food99MenuTarefa,
} from "../interfaces/food99";

export type Food99ApiResult<T> = { sucesso: boolean; dados: T; erro: string };

/**
 * A API devolve 4xx com o mesmo envelope { sucesso, dados, erro }. O axios lança nesses casos,
 * então aqui o erro vira resultado normal para a tela mostrar a mensagem real do 99Food.
 */
async function chamar<T>(fn: () => Promise<{ data: Food99ApiResult<T> }>): Promise<Food99ApiResult<T>> {
  try {
    const { data } = await fn();
    return data;
  } catch (e: any) {
    const corpo = e?.response?.data;
    if (corpo && typeof corpo.sucesso === "boolean") return corpo;
    return { sucesso: false, dados: null as unknown as T, erro: "Erro de comunicação com o servidor." };
  }
}

export const food99Service = {
  // Integração
  obterIntegracao: (empresaId: number) =>
    chamar(() => api.get<Food99ApiResult<Food99Integracao>>(`/food99/empresas/${empresaId}/integracao`)),

  conectar: (empresaId: number) =>
    chamar(() => api.post<Food99ApiResult<Food99Integracao>>(`/food99/empresas/${empresaId}/integracao`)),

  verificar: (empresaId: number) =>
    chamar(() => api.post<Food99ApiResult<Food99Integracao>>(`/food99/empresas/${empresaId}/integracao/verificar`)),

  desconectar: (empresaId: number) =>
    chamar(() => api.delete<Food99ApiResult<object>>(`/food99/empresas/${empresaId}/integracao`)),

  // Loja
  detalheLoja: (empresaId: number) =>
    chamar(() => api.get<Food99ApiResult<Food99Loja>>(`/food99/empresas/${empresaId}/loja`)),

  /** bizStatus: 1 online / 2 offline. autoSwitch: 1 abre sozinha, 2 fecha sozinha, 3 abre e fecha sozinha. */
  definirStatusLoja: (empresaId: number, bizStatus: 1 | 2, autoSwitch: 1 | 2 | 3) =>
    chamar(() =>
      api.put<Food99ApiResult<object>>(`/food99/empresas/${empresaId}/loja/status`, { bizStatus, autoSwitch })
    ),

  // Cardápio
  previewCardapio: (empresaId: number) =>
    chamar(() => api.get<Food99ApiResult<Food99MenuPreview>>(`/food99/empresas/${empresaId}/cardapio/preview`)),

  enviarCardapio: (empresaId: number) =>
    chamar(() => api.post<Food99ApiResult<Food99MenuTarefa>>(`/food99/empresas/${empresaId}/cardapio/enviar`)),

  listarTarefas: (empresaId: number) =>
    chamar(() => api.get<Food99ApiResult<Food99MenuTarefa[]>>(`/food99/empresas/${empresaId}/cardapio/tarefas`)),

  consultarTarefa: (empresaId: number, taskId: string) =>
    chamar(() =>
      api.get<Food99ApiResult<Food99MenuTarefa>>(`/food99/empresas/${empresaId}/cardapio/tarefas/${taskId}`)
    ),

  /** Escolhe o preço de um item de pizza. valor nulo volta ao preço padrão do cadastro. */
  definirPrecoItem: (empresaId: number, appItemId: string, valor: number | null) =>
    chamar(() =>
      api.put<Food99ApiResult<object>>(`/food99/empresas/${empresaId}/cardapio/precos`, { appItemId, valor })
    ),

  /** status: 1 disponível, 2 indisponível. Ids: "p{produtoId}" (produto) ou "o_{id}" (adicional). */
  atualizarStatusItens: (empresaId: number, appItemIds: string[], status: 1 | 2) =>
    chamar(() =>
      api.put<Food99ApiResult<{ success?: string[]; failed?: string[] }>>(
        `/food99/empresas/${empresaId}/cardapio/itens/status`,
        { appItemIds, status }
      )
    ),
};
