export interface IFoodIntegracaoStatus {
  empresaId: number;
  merchantId: string | null;
  status: 0 | 1 | 2 | 3; // 0=Pendente, 1=Ativo, 2=Erro, 3=Revogado
  expiresAt: string | null;
  tokenValido: boolean;
}

export interface IFoodUserCode {
  verificationUrl: string;
  authorizationCodeVerifier: string;
}

export interface IFoodAutorizarDto {
  authorizationCode: string; // verifier fica no backend agora
}
export interface IFoodIntegracaoStatus {
  empresaId: number;
  merchantId: string | null;
  status: 0 | 1 | 2 | 3;
  expiresAt: string | null;
  tokenValido: boolean;
}

export interface IFoodAutorizarDto {
  authorizationCode: string;
}

export interface IFoodUserCode {
  verificationUrl: string;
  authorizationCodeVerifier: string;
}

export interface IFoodMerchant {
  id: string;
  name: string;
  corporateName: string;
}

export interface IFoodStatusMessage {
  title: string;
  subtitle: string;
  description: string;
}

export interface IFoodValidacao {
  id: string;
  code: string;
  state: "OK" | "WARNING" | "CLOSED" | "ERROR";
  message: IFoodStatusMessage | null;
}

export interface IFoodStatusLoja {
  operation: string;
  salesChannel: string;
  available: boolean;
  state: "OK" | "WARNING" | "CLOSED" | "ERROR";
  message: IFoodStatusMessage;
  validations: IFoodValidacao[];
}

export interface IFoodInterrupcao {
  id: string;
  description: string;
  start: string;
  end: string;
}

export interface IFoodCriarInterrupcaoDto {
  description: string;
  start: string;
  end: string;
}

export interface IFoodHorario {
  id: string | null;
  dayOfWeek: string;
  start: string;
  duration: number;
}

export interface IFoodAtualizarHorariosDto {
  shifts: IFoodHorario[];
}