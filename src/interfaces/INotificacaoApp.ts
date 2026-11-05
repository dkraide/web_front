export default interface INotificacaoApp {
  id: number;
  criadoEm: string;
  tipo: string;
  titulo: string;
  mensagem?: string;
  /** Rota lógica de destino enviada pelo backend (despesas, recebiveis, tarefas...). */
  rota?: string;
  entidadeId?: string;
  lida: boolean;
}

export interface INotificacaoTipo {
  tipo: string;
  nome: string;
  descricao: string;
  categoria: string;
  obrigatorio: boolean;
  naTela: boolean;
  push: boolean;
}

/** Rota lógica da notificação -> página do sistema. */
export const ROTAS_NOTIFICACAO: Record<string, string> = {
  despesas: '/despesa',
  recebiveis: '/recebiveis',
  tarefas: '/tarefas',
};
