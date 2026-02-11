import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import BaseModal from "../../Base/Index";
import _ from "lodash";
import IPedidoOnline from "@/interfaces/IPedidoOnline";
import { LabelGroup } from "@/components/ui/LabelGroup";
import { format } from "date-fns";
import { Tab, Tabs } from "react-bootstrap";
import { GetCurrencyBRL } from "@/utils/functions";
import IPedidoOnlineProduto from "@/interfaces/IPedidoOnlineProduto";

interface props {
    isOpen: boolean
    pedido: IPedidoOnline
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function Visualizar({ user, isOpen, pedido, setClose, color }: props) {

    return (
        <BaseModal height={'80%'} width={'80%'} color={color} title={'Visualizar Pedido'} isOpen={isOpen} setClose={setClose}>
              <div className={styles.container}>
                    <Tabs
                        id="controlled-tab-example"
                        className="mb-3"
                        justify
                    >
                        <Tab eventKey="home" title="Detalhe">
                            <div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th colSpan={2}>Pedido: {pedido.id} - {pedido.cliente}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Data:</td>
                                            <td>
                                                {pedido.dataPedido
                                                    ? format(new Date(pedido.dataPedido), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'Data inválida'}
                                            </td>
                                        </tr>
                                        <tr>
                                        <td>Status Pedido:</td>
                                        <td>
                                            {(() => {
                                                switch (pedido.status) {
                                                    case 'NOVO':
                                                        return 'NOVO';
                                                    case 'PREPARANDO':
                                                        return 'PREPARANDO';
                                                    case 'PRONTO':
                                                        return 'PRONTO';
                                                    case 'ENTREGANDO':
                                                        return 'EM ENTREGA';
                                                    case 'ENTREGUE':
                                                        return 'ENTREGUE';
                                                    case 'CANCELADO':
                                                        return 'CANCELADO';
                                                    case 'FINALIZADO':
                                                        return 'FINALIZADO';
                                                    default:
                                                        return 'STATUS INDEFINIDO';
                                                }
                                            })()}
                                        </td>
                                        </tr>
                                        <tr>
                                            <td>Valor frete:</td>
                                            <td>
                                                {pedido.valorFrete ? GetCurrencyBRL(pedido.valorFrete) : 'R$ 0,00'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Valor produtos:</td>
                                            <td>
                                                {pedido.valorProdutos ? GetCurrencyBRL(pedido.valorProdutos) : 'R$ 0,00'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Valor Total:</td>
                                            <td>
                                                {pedido.valorTotal ? GetCurrencyBRL(pedido.valorTotal) : 'R$ 0,00'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Tab>
                        <Tab eventKey="profile" title="Produtos">
                            <div>
                                {Array.isArray(pedido.produtos) && pedido.produtos.length > 0 ? (
                                    pedido.produtos.map((item) => (
                                        <div key={item.id} className="produto-section">
                                            {/* Observação do produto */}
                                            {item.observacao && item.observacao.trim() !== '' && (
                                                <div className="observacao-container">
                                                    <p className="observacao">
                                                    <strong>Observação: </strong>{item.observacao}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Tabela do produto */}
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>Produto</th>
                                                            <th>Qntd</th>
                                                            <th>Valor Un.</th>
                                                            <th>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>{item.nomeProduto}</td>
                                                            <td>{item.quantidade.toFixed(2)}</td>
                                                            <td>{GetCurrencyBRL(item.valorUnitario)}</td>
                                                            <td>{GetCurrencyBRL(item.valorTotal)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                        </div>
                                    ))
                                ) : (
                                    <p>Nenhum produto disponível</p>
                                )}
                            </div>
                        </Tab>
                        <Tab eventKey="contact" title="Pagamentos">
                            <div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Forma de Pagamento</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Verifique se 'pagamento' existe e mostre as informações */}
                                        {pedido.pagamento ? (
                                            <tr>
                                                <td>{pedido.pagamento}</td> {/* Forma de pagamento */}
                                                <td>{pedido.valorTotal ? GetCurrencyBRL(pedido.valorTotal) : '0.00'}</td> {/* Valor total */}
                                            </tr>
                                        ) : (
                                            <tr>
                                                <td colSpan={2}>Nenhum pagamento registrado</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
        </BaseModal>
    )
}