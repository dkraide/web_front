import IPedidoOnline from "./IPedidoOnline";
import IPedidoOnlineProduto from "./IPedidoOnlineProduto";
import IMateriaPrima from "./IMateriaPrima";

export default interface IPedidoOnlineProdutoAdicional {
    id: number;
    idPedidoOnlineProdutoAdicional: number;
    pedidoOnlineProdutoId: number;
    pedidoOnlineProduto: IPedidoOnlineProduto;
    nome: string;
    valorUnitario: number;
    quantidade: number;
    valorTotal: number; // Calculado no frontend
    materiaPrimaId: number;
    materiaPrima: IMateriaPrima;
}