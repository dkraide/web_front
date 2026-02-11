import IEmpresa from "./IEmpresa";

export default interface IMerchantOpenDelivery {
  id: string;
  empresaId: number;
  empresa?: IEmpresa;

  name: string;
  document: string;
  corporateName: string;
  description: string;

  averageTicket: number;
  averagePreparationTime: number;
  minOrderValue: number;
  minOrderValueCurrency: string;

  merchantType: string;
  merchantCategories?: string;

  country: string;
  state: string;
  city: string;
  district: string;
  street: string;
  number: string;
  postalCode: string;
  complement: string;
  reference?: string;

  latitude: number;
  longitude: number;

  contactEmails?: string;
  commercialPhone?: string;
  whatsappNumber?: string;

  logoUrl: string;
  logoCrc32: string;
  bannerUrl: string;
  bannerCrc32: string;

  createdAt: Date;

  acceptedCards?: string;

  facebook?: string;
  instagram?: string;
  urlIFood?: string
  urlGoomer?: string
  url99?: string
  urlUberEats?: string
  urlKeeta?: string

}
