import ICliente from "./ICliente";
import IPremio from "./IPremio";

export interface IPremioretirado {
  id: number;
  idpremioretirado: number;
  descricao?: string;
  idvenda: number;
  pontos: number;
  data?: string; // ou Date, se preferir trabalhar com objetos de data
  idcliente: number;
  idpremio: number;
  premioid: number;
  premio?: IPremio
  vendaid: number;
  clienteid: number;
  cliente?: ICliente
  empresaid: number;
}
