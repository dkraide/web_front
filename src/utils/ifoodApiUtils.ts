import { AxiosError } from "axios";

export type CatalogContext = "DEFAULT" | "WHITELABEL" | "INDOOR";

export const CATALOG_CONTEXTS: { value: CatalogContext; label: string }[] = [
  { value: "DEFAULT", label: "Padrão" },
  { value: "WHITELABEL", label: "White label" },
  { value: "INDOOR", label: "Indoor" },
];

type ApiResult<T> = { sucesso: boolean; dados: T; erro: string };

const STATUS_RETRYAVEIS = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Executa uma chamada de serviço iFood tratando o padrão do backend: erros de
 * negócio voltam como HTTP 400 com corpo `{ sucesso: false, erro }`, o que faz
 * o axios lançar em vez de resolver. Aqui, esse corpo é devolvido normalmente;
 * só falhas transitórias (rede, timeout, 429, 5xx) são tentadas de novo — nunca
 * um 4xx de validação, que vai falhar sempre do mesmo jeito.
 */
export async function withRetry<T>(
  fn: () => Promise<ApiResult<T>>,
  tentativas = 3,
  delayBaseMs = 1000
): Promise<ApiResult<T>> {
  let ultimoErro: unknown;

  for (let tentativa = 0; tentativa <= tentativas; tentativa++) {
    try {
      return await fn();
    } catch (err) {
      ultimoErro = err;
      const axiosErr = err as AxiosError<ApiResult<T>>;
      const status = axiosErr?.response?.status;

      if (status && !STATUS_RETRYAVEIS.has(status) && axiosErr.response?.data) {
        return axiosErr.response.data;
      }

      if (tentativa < tentativas) {
        await new Promise(resolve => setTimeout(resolve, delayBaseMs * Math.pow(2, tentativa)));
      }
    }
  }

  throw ultimoErro;
}

const PADROES_ERRO: { teste: RegExp; mensagem: string }[] = [
  { teste: /concurrently modified/i, mensagem: "Este item está sendo modificado em outro lugar. Aguarde alguns segundos e tente novamente." },
  { teste: /multiple ['"]?main['"]? optiongroups/i, mensagem: "Só é permitido um grupo principal no combo." },
  { teste: /associationtype/i, mensagem: "Erro na configuração dos grupos do combo. Marque exatamente um grupo como principal." },
  { teste: /categoryid should not be null|selecione uma categoria/i, mensagem: "Selecione uma categoria para o item." },
  { teste: /not valid|invalidinput|validation/i, mensagem: "Dados inválidos. Verifique os campos preenchidos e tente novamente." },
  { teste: /not.?found/i, mensagem: "Item não encontrado. Ele pode ter sido removido." },
  { teste: /conflict/i, mensagem: "Conflito ao salvar. Atualize a página e tente novamente." },
  { teste: /too many requests|rate limit|429/i, mensagem: "Muitas requisições seguidas. Aguarde um instante e tente novamente." },
  { teste: /network error/i, mensagem: "Sem conexão com o servidor. Verifique sua internet e tente novamente." },
];

export function humanizarErro(erro?: string | null): string {
  if (!erro) return "Ocorreu um erro inesperado. Tente novamente.";
  const padrao = PADROES_ERRO.find(p => p.teste.test(erro));
  return padrao?.mensagem ?? erro;
}

export function validarProduto(dados: {
  nome: string;
  descricao: string;
  preco: number;
  categoriaId: string;
}): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  if (!dados.nome?.trim()) erros.push("Informe o nome do produto.");
  else if (dados.nome.length > 100) erros.push("O nome deve ter no máximo 100 caracteres.");
  if (dados.descricao && dados.descricao.length > 500) erros.push("A descrição deve ter no máximo 500 caracteres.");
  if (!dados.categoriaId) erros.push("Selecione uma categoria.");
  if (!dados.preco || Number(dados.preco) <= 0) erros.push("O preço deve ser maior que zero.");
  return { valido: erros.length === 0, erros };
}
