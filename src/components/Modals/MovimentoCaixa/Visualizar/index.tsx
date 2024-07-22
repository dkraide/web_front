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
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { Spinner, Tab, Tabs } from "react-bootstrap";

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface valorProps {
    forma: string
    qntd: number
    valor: number
}
type prodProps = {
    nome: string
    qntd: number
    valor: number
}
export default function Visualizar({ user, isOpen, id, setClose, color }: props) {


    const [obj, setObj] = useState<IMovimentoCaixa>({} as IMovimentoCaixa)
    const [totais, setTotais] = useState<valorProps[]>()
    const [produtos, setProdutos] = useState<prodProps[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        api.get(`/MovimentoCaixa/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IMovimentoCaixa>) => {
                setObj(data);
                setLoading(false);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
                setLoading(false);
            })
        api.get(`/MovimentoCaixa/GetTotais?id=${id}`)
            .then(({ data }: AxiosResponse<valorProps[]>) => {
                setTotais(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar totais. ${err.message}`)
            })
            api.get(`/MovimentoCaixa/Produtos?MovimentoCaixaId=${id}`)
            .then(({ data }: AxiosResponse<prodProps[]>) => {
                setProdutos(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar totais. ${err.message}`)
            })
    }, []);

    function calcularVendas() {
        if (!totais) {
            return 0;
        }
        var total = 0;
        totais.map(p => {
            if (p.forma.toUpperCase().includes('DINHEIRO')) {
                total += p.valor
            }
        });
        return total;
    }
    function calcularSangrias() {
        if (!obj || !obj.sangrias) {
            return 0;
        }
        var total = _.sumBy(obj.sangrias, o => o.isSangria ? o.valorMovimento : 0);
        return total;
    }
    function calculaEntradas() {
        if (!obj || !obj.sangrias) {
            return 0;
        }
        var total = _.sumBy(obj.sangrias, o => !o.isSangria ? o.valorMovimento : 0);
        return total;
    }
    function calculaEsperado() {
        var sangrias = calcularSangrias();
        var entradas = calculaEntradas();
        var vendas = calcularVendas();
        var resultado = obj.valorDinheiro + vendas + entradas - sangrias;
        return resultado;
    }
    function calculaDiferenca() {
        var resultado = calculaEsperado();
        return obj.valorDinheiroFinal - resultado ;
    }

    return (
        <BaseModal height={'80%'} width={'80%'} color={color} title={'Visualizar Movimento Caixa'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.detail}>
                        <div style={{width: '45%'}}>
                            <table className={"table"}>
                                <thead>
                                    <tr>
                                        <th colSpan={2}>Detalhe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Nro</td>
                                        <td>{obj.idMovimentoCaixa || obj.id}</td>
                                    </tr>
                                    <tr>
                                        <td>Abertura</td>
                                        <td>{format(new Date(obj.dataMovimento || new Date()), 'dd/MM/yyyy HH:mm')}</td>
                                    </tr>
                                    <tr>
                                        <td>Usuario</td>
                                        <td>{obj.usuario?.nome || obj.idUsuario}</td>
                                    </tr>
                                    <tr>
                                        <td>Status</td>
                                        <td>{obj.status ? 'FECHADO' : 'ABERTO'}</td>
                                    </tr>
                                    <tr>
                                        <td>Fechamento</td>
                                        <td>{obj.status ? format(new Date(obj.dataFechamento), 'dd/MM/yyyy HH:mm') : '--'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{width: '45%'}}>
                            <table className={"table"}>
                                <thead>
                                    <tr>
                                        <th colSpan={2}>Totais</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Abertura (+)</td>
                                        <td>R$ {obj.valorDinheiro.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Vendas (+)</td>
                                        <td>R$ {calcularVendas().toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Entradas (+)</td>
                                        <td>R$ {calculaEntradas().toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Sangrias (-)</td>
                                        <td>R$ {calcularSangrias().toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Informado (=)</td>
                                        <td>R$ {obj.status ? obj.valorDinheiroFinal.toFixed(2) : '--'}</td>
                                    </tr>
                                    <tr>
                                        <td>Esperado (=)</td>
                                        <td>R$ {obj.status ? calculaEsperado().toFixed(2) : '--'}</td>
                                    </tr>
                                    <tr>
                                        <td>Diferenca (=)</td>
                                        <td>R$ {obj.status ? calculaDiferenca().toFixed(2) : '--'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div style={{ width: '100%' }}>
                        <Tabs
                            id="controlled-tab-example"
                            className="mb-3"
                            justify
                        >
                            <Tab eventKey="home" title="Totais">
                                <div>
                                    <table className={"table"}>
                                        <thead>
                                            <tr>
                                                <th>Forma de Pagamento</th>
                                                <th>Qntd</th>
                                                <th>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {totais?.map((item, index) =>
                                                <tr key={index}>
                                                    <td>{item.forma}</td>
                                                    <td>{item.qntd}</td>
                                                    <td>R$ {item.valor.toFixed(2)}</td>
                                                </tr>)}
                                            <tr >
                                                <td><b>TOTAL</b></td>
                                                <td>{_.sumBy(totais, t => t.qntd)}</td>
                                                <td>R$ {_.sumBy(totais, t => t.valor)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Tab>
                            <Tab eventKey="profile" title="Vendas">
                                <div>
                                    <table className={"table"}>
                                        <thead>
                                            <tr>
                                                <th>Nro</th>
                                                <th>Usuario</th>
                                                <th>Data</th>
                                                <th>Status</th>
                                                <th>Tipo</th>
                                                <th>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {obj.vendas?.map((item) =>
                                                <tr key={item.id}>
                                                    <td>{item.id}</td>
                                                    <td>{item.usuario?.nome || '--'}</td>
                                                    <td>{format(new Date(item.dataVenda), 'dd/MM/yyyy HH:mm')}</td>
                                                    <td>{item.statusVenda ? 'OK' : 'Cancelada'}</td>
                                                    <td>{item.estd ? 'FATURADA' : 'ORCAMENTO'}</td>
                                                    <td>{item.valorTotal.toFixed(2)}</td>
                                                </tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </Tab>
                            <Tab eventKey="produtos" title="Produtos">
                                <div>
                                    <table className={"table"}>
                                        <thead>
                                            <tr>
                                                <th style={{width: '60%'}}>Produto</th>
                                                <th style={{width: '20%'}}>Quantidade</th>
                                                <th style={{width: '20%'}}>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {produtos?.map((item, index) =>
                                                <tr key={index}>
                                                    <td>{item.nome}</td>
                                                    <td>{item.qntd}</td>
                                                    <td>R${item.valor.toFixed(2)}</td>
                                                </tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </Tab>
                            <Tab eventKey="contact" title="Sangrias">
                                <div>
                                    <table className={"table"}>
                                        <thead>
                                            <tr>
                                                <th>Nro</th>
                                                <th>Tipo</th>
                                                <th>Data</th>
                                                <th>Motivo</th>
                                                <th>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {obj.sangrias?.map((item) =>
                                                <tr key={item.id}>
                                                    <td>{item.id}</td>
                                                    <td>{item.isSangria ? 'SANGRIA' : 'ENTRADA'}</td>
                                                    <td>{format(new Date(item.dataSangria), 'dd/MM/yyyy HH:mm')}</td>
                                                    <td>{item.motivo}</td>
                                                    <td>{item.valorMovimento.toFixed(2)}</td>
                                                </tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}