import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import {  AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import {  InputGroup } from "@/components/ui/InputGroup";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import IProduto from "@/interfaces/IProduto";
import ILancamentoEstoqueProduto from "@/interfaces/ILancamentoEstoqueProduto";
import { addDays, addMinutes, endOfMonth, format, startOfMonth } from "date-fns";
import CustomTable from "@/components/ui/CustomTable";
import AjusteEstoqueForm from "../AjusteEstoqueForm";
import IConferenciaEstoque from "@/interfaces/IConferenciaEstoque";


interface props {
    isOpen: boolean
    conferencia: IConferenciaEstoque
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface resultProps {
    produto?: IProduto
    lancamentos: ILancamentoEstoqueProduto[]
}
export default function DetalheConferenciaForm({ user, isOpen, conferencia, setClose, color }: props) {

    const [result, setResult] = useState<resultProps>()
    const [loading, setLoading] = useState<boolean>(true)
    const [ajuste, setAjuste] = useState(false);
    useEffect(() => {
         loadData();
    }, []);

    const loadData = async () => {
        api.get(`/Estoque/Select?ProdutoId=${conferencia.produtoId}&dataIn=${format((addMinutes(new Date(conferencia.dataConferencia), 1)), 'yyyy-MM-dd HH:mm')}&dataFim=${format(addDays(new Date(), 1), 'yyyy-MM-dd')}`)
            .then(({ data }: AxiosResponse<resultProps>) => {
                setResult(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
            })
        setLoading(false);
    }

    if(ajuste){
        return <AjusteEstoqueForm isOpen={ajuste} produto={result.produto} user={user} setClose={(v) => {
            if(v){
                loadData();
            }
            setAjuste(false);
        } }/>
    }
    function getTotal(isEntrada, isQntd){
        var valor = 0;
        result.lancamentos.map((lancamento) => {
                    if(lancamento.isEntrada == isEntrada){
                        valor += isQntd ? 1 : lancamento.custoUnitario * lancamento.quantidade
                    }
        })
        return valor;
    }

    return (
        <BaseModal height={'90vh'} width={'100vw'} color={color} title={'Relatorio de Estoque'} isOpen={isOpen} setClose={setClose}>
            {(loading || !result) ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.info}>
                        <InputGroup width={'10%'} title={'Cod'} value={result.produto.cod} />
                        <InputGroup width={'50%'} title={'Produto'} value={result.produto.nome} />
                        <InputGroup width={'10%'} title={'Estoque Atual'} value={result.produto.quantidade} />
                        <InputGroup width={'20%'} title={'Conferencia'} value={format(new Date(conferencia.dataConferencia), 'dd/MM/yyyy HH:mm')} />
                        <InputGroup width={'10%'} title={'Est. Informado'} value={conferencia.quantidadeInformada} />
                    </div>
                    <div className={styles.info}>
                        <div style={{ width: '49%', height: '100%' }}>
                            <h3>Entradas</h3>
                            <Entradas  lancamentos={result.lancamentos} />
                            <table className={"table"}>
                                <tbody>
                                    <tr>
                                        <td>
                                               Totais
                                        </td>
                                        <td style={{textAlign: 'end'}}> 
                                            <b>{getTotal(true, true).toFixed(2)}</b>
                                        </td>
                                        <td style={{textAlign: 'end'}}>
                                            <b>R$ {getTotal(true, false).toFixed(2)}</b>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{ width: '50%', height: '100%' }}>
                            <h3>Saidas</h3>
                            <Saidas lancamentos={result.lancamentos} />
                            <table className={"table"} style={{marginTop: 'auto'}}>
                                <tbody>
                                    <tr>
                                        <td>
                                               Totais
                                        </td>
                                        <td style={{textAlign: 'end'}}> 
                                            <b>{getTotal(false, true).toFixed(2)}</b>
                                        </td>
                                        <td style={{textAlign: 'end'}}>
                                            <b>R$ {getTotal(false, false).toFixed(2)}</b>
                                        </td>
                                    </tr>
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}


const Saidas = ({  lancamentos }: resultProps) => {

    function getSaidas() {
        var list = [];
        lancamentos.map((lancamento) => {
            if (!lancamento.isEntrada) {
                list.push({
                    tipo: 'Ajuste',
                    ref: lancamento.idLancamentoEstoque,
                    data: lancamento.dataLancamento,
                    qntd: lancamento.quantidade,
                    custo: lancamento.custoUnitario * lancamento.quantidade
                });
            }
        });

        return list;
    }

    const columns = [
        {
            name: 'Tipo',
            selector: row => row.tipo,
            sortable: true,
            grow: 1,
        },
        {
            name: 'Ref',
            selector: row => row.ref,
            sortable: true,
            grow: 1,
        },
        {
            name: 'Data',
            selector: row => row.data,
            cell: row => format(new Date(row.data), 'dd/MM/yyyy HH:mm'),
            sortable: true,
            grow: 1,
        },
        {
            name: 'Qntd',
            selector: row => row.data,
            cell: row => row.qntd.toFixed(2),
            sortable: true,
            grow: 1,
        },
        {
            name: 'Custo',
            selector: row => row.data,
            cell: row => `R$ ${row.custo.toFixed(2)}`,
            sortable: true,
            grow: 1,
        },
    ]

    return (
        <CustomTable data={getSaidas()} columns={columns} />
    )

}
const Entradas = ({ lancamentos }: resultProps) => {

    function getSaidas() {
        var list = [];
        lancamentos.map((lancamento) => {
            if (lancamento.isEntrada) {
                list.push({
                    tipo: 'Ajuste',
                    ref: lancamento.idLancamentoEstoque,
                    data: lancamento.dataLancamento,
                    qntd: lancamento.quantidade,
                    custo: lancamento.custoUnitario * lancamento.quantidade
                });
            }
        });

        return list;
    }

    const columns = [
        {
            name: 'Tipo',
            selector: row => row.tipo,
            sortable: true,
            grow: 1,
        },
        {
            name: 'Ref',
            selector: row => row.ref,
            sortable: true,
            grow: 1,
        },
        {
            name: 'Data',
            selector: row => row.data,
            cell: row => format(new Date(row.data), 'dd/MM/yyyy HH:mm'),
            sortable: true,
            grow: 1,
        },
        {
            name: 'Qntd',
            selector: row => row.data,
            cell: row => row.qntd.toFixed(2),
            sortable: true,
            grow: 1,
        },
        {
            name: 'Custo',
            selector: row => row.data,
            cell: row => `R$ ${row.custo.toFixed(2)}`,
            sortable: true,
            grow: 1,
        },
    ]

    return (
        <CustomTable data={getSaidas()} columns={columns} />
    )

}