export enum WhatsappIntegracaoTipo {
  Oficial = 1,
  NaoOficial = 2,
}

export enum WhatsappIntegracaoStatus {
  NaoConfigurado = 0,
  AguardandoQrCode = 1,
  Conectado = 2,
  Desconectado = 3,
  Erro = 4,
}

export interface WhatsappIntegracao {
  id: number;
  empresaId: number;
  tipo: WhatsappIntegracaoTipo;
  status: WhatsappIntegracaoStatus;
  instanceId: string | null;
  instanceToken: string | null;
  instanceName: string | null;
  numeroWhatsapp: string | null;
  ultimoErro: string | null;
  criadoEm: string;
  atualizadoEm: string;
  conectadoEm: string | null;
  desconectadoEm: string | null;
}

export interface WhatsappCriarIntegracaoDto {
  empresaId: number;
  tipo: WhatsappIntegracaoTipo;
}

export interface WhatsappQrCodeResponse {
  qrCode: string;
}
