import IPedidoOnlineProduto from "./IPedidoOnlineProduto";

export enum IPedidoStatus  {
    NOVO = "NOVO",
    PREPARANDO = "PREPARANDO",
    PRONTO = "PRONTO",
    ENTREGANDO = "ENTREGANDO",
    ENTREGUE = "ENTREGUE",
    CANCELADO = "CANCELADO",
    FINALIZADO="FINALIZADO"
}

export default interface IPedidoOnline {
    id: number;
    idPedidoOnline: number;
    cliente: string;
    telefone: string;
    empresaId: number;
    valorProdutos: number;
    valorFrete: number;
    valorTotal: number;
    valorDesconto: number;
    logradouro: string;
    cidade: string;
    bairro: string;
    cep: string;
    numero: string;
    complemento: string;
    isCancelado: boolean;
    isParaEntrega: boolean;
    troco: number;
    pagamento: string;
    idVenda: number;
    dataPedido: Date;
    produtos: IPedidoOnlineProduto[];
    status: IPedidoStatus;
}