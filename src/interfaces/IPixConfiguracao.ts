export type PixProvider = 'MERCADO_PAGO';

export interface IPixConfiguracao {
  empresaId: number;
  ativo: boolean;
  provider: PixProvider;
  temAccessToken: boolean;
  /** Ultimos 4 caracteres do token salvo (o token nunca volta da API). */
  accessTokenFinal?: string | null;
  temWebhookSecret: boolean;
  emailPadrao?: string | null;
  expiracaoMinutos: number;
  extras: Record<string, string>;
  /** URL a cadastrar no painel do provider (somente leitura). */
  webhookUrl: string;
}

export interface IPixConfiguracaoSalvar {
  empresaId: number;
  ativo: boolean;
  provider: PixProvider;
  /** Vazio = mantem o token ja salvo. */
  accessToken?: string;
  /** Vazio = mantem o segredo ja salvo. */
  webhookSecret?: string;
  emailPadrao?: string;
  expiracaoMinutos: number;
  extras?: Record<string, string>;
}

export interface IPixTesteConexao {
  ok: boolean;
  mensagem: string;
  /** Resposta tecnica do provedor (sem credenciais), para suporte. */
  detalhe?: string | null;
  ambiente?: "PRODUCAO" | "TESTE" | null;
  conta?: string | null;
}

export interface IPixEstornoRequest {
  pedidoId: number;
  /** Omitido = estorno total do que resta. */
  valor?: number;
  motivo?: string;
  cancelarPedido: boolean;
}

export interface IPixEstornoResultado {
  valorEstornado: number;
  totalEstornado: number;
  statusCobranca: string;
  pedidoCancelado: boolean;
  mensagem: string;
}
