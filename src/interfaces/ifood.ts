export interface IFoodIntegracaoStatus {
  empresaId: number;
  merchantId: string;
  status: "Pendente" | "Ativo" | "Erro";
}

export interface IFoodCriarIntegracaoDto {
  merchantId: string;
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
