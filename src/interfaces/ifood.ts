export interface IFoodIntegracaoStatus {
  empresaId: number;
  merchantId: string;
  status: "Pendente" | "Ativo" | "Erro";
}

export interface IFoodCriarIntegracaoDto {
  merchantId: string;
}

export interface IFoodMerchantEndereco {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  district?: string | null;
  street?: string | null;
  number?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface IFoodMerchantSalesChannel {
  name?: string | null;
  enabled?: boolean | null;
}

export interface IFoodMerchantOperacao {
  name?: string | null;
  salesChannels?: IFoodMerchantSalesChannel[] | null;
}

export interface IFoodMerchant {
  id: string;
  name: string;
  corporateName: string;
  description?: string | null;
  /** Ticket médio em reais */
  averageTicket?: number | null;
  exclusive?: boolean | null;
  /** Ex: RESTAURANT, GROCERY */
  type?: string | null;
  status?: string | null;
  createdAt?: string | null;
  address?: IFoodMerchantEndereco | null;
  operations?: IFoodMerchantOperacao[] | null;
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
