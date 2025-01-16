import IPedidoOnline from './IPedidoOnline';
import IProduto from './IProduto';
import IPedidoOnlineProdutoAdicional from './IPedidoOnlineProdutoAdicional';

export default interface IPedidoOnlineProduto {
    id: number;
    idPedidoOnlineProduto: number;
    pedidoOnline: IPedidoOnline;
    pedidoOnlineId: number; // Relacionamento com PedidoOnline
    quantidade: number;
    valorUnitario: number;
    valorTotal: number; // Calculado no frontend
    nomeProduto: string;
    observacao: string;
    produtoId: number;
    produto: IProduto;
    adicionais: IPedidoOnlineProdutoAdicional[];
}