import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import BaseModal from "../../Base/Index";
import _ from "lodash";
import IVenda from "@/interfaces/IVenda";
import { LabelGroup } from "@/components/ui/LabelGroup";
import { format } from "date-fns";
import { Tab, Tabs } from "react-bootstrap";

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function Visualizar({ user, isOpen, id, setClose, color }: props) {


    const [obj, setObj] = useState<IVenda>({} as IVenda)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        api.get(`/Venda/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IVenda>) => {
                setObj(data);
                setLoading(false);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
                setLoading(false);
            })
    }, []);
    return (
        <BaseModal height={'80%'} width={'80%'} color={color} title={'Visualizar Venda'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <Tabs
                        id="controlled-tab-example"
                        className="mb-3"
                        justify
                    >
                        <Tab eventKey="home" title="Detalhe">
                            <div>
                                <table className={"table"}>
                                    <thead>
                                        <tr>
                                            <th colSpan={2}>Venda</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Nro</td>
                                            <td>{obj.id}</td>
                                        </tr>
                                        <tr>
                                            <td>Caixa</td>
                                            <td>{obj.movimentoCaixaId || obj.movimentoCaixaId}</td>
                                        </tr>
                                        <tr>
                                            <td>Data</td>
                                            <td>{format(new Date(obj.dataVenda), 'dd/MM/yyyy HH:mm')}</td>
                                        </tr>
                                        <tr>
                                            <td>Usuario</td>
                                            <td>{obj.usuario?.nome || obj.idUsuario}</td>
                                        </tr>
                                        <tr>
                                            <td>Tipo</td>
                                            <td>{obj.estd ? 'FATURADO' : 'ORCAMENTO'}</td>
                                        </tr>
                                        <tr>
                                            <td>Status</td>
                                            <td>{obj.statusVenda ? 'OK' : 'CANCELADO'}</td>
                                        </tr>
                                        <tr hidden={obj.statusVenda}>
                                            <td>Cancelamento</td>
                                            <td>{obj.statusVenda ? '--' : format(new Date(obj.dataCancelamento), 'dd/MM/yyyy HH:mm')}</td>
                                        </tr>
                                        <tr hidden={obj.statusVenda}>
                                            <td>Movimento Cancelamento</td>
                                            <td>{obj.statusVenda ? '--' : obj.motivoCancelamento}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Tab>
                        <Tab eventKey="profile" title="Produtos">
                            <div>
                                <table className={"table"}>
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Qntd</th>
                                            <th>Valor Un.</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {obj.produtos.map((item) => <tr key={item.id}>
                                            <td>{item.nomeProduto}</td>
                                            <td>{item.quantidade.toFixed(2)}</td>
                                            <td>R$ {item.valorUnitario.toFixed(2)}</td>
                                            <td>R$ {item.valorTotal.toFixed(2)}</td>
                                        </tr>)}

                                    </tbody>
                                </table>
                            </div>
                        </Tab>
                        <Tab eventKey="contact" title="Pagamentos">
                            <div>
                                <table className={"table"}>
                                    <thead>
                                        <tr>
                                            <th>Forma de Pagamento</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {obj.pagamentos.map((item) => <tr key={item.id}>
                                            <td>{item.descricao}</td>
                                            <td>R$ {item.valor.toFixed(2)}</td>
                                        </tr>)}

                                    </tbody>
                                </table>
                            </div>

                        </Tab>
                    </Tabs>
                </div>
            )}
        </BaseModal>
    )
}