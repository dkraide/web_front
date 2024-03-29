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
import { endOfMonth, format, startOfMonth } from "date-fns";
import CustomTable from "@/components/ui/CustomTable";
import AjusteEstoqueForm from "../AjusteEstoqueForm";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface resultProps {
    produto?: IProduto
    lancamentos: ILancamentoEstoqueProduto[]
}
interface searchProps {
    dateIn: string
    dateFim: string
}
export default function EstoqueForm({ user, isOpen, id, setClose, color }: props) {

    const [result, setResult] = useState<resultProps>()
    const [loading, setLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<searchProps>()
    const [ajuste, setAjuste] = useState(false);
    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
        }
        setTimeout(() => {
            loadData();
        }, 1000);
    }, []);

    const loadData = async () => {
        api.get(`/Estoque/Select?ProdutoId=${id}&dataIn=${search?.dateIn || format(startOfMonth(new Date()), 'yyyy-MM-dd')}&dataFim=${search?.dateFim || format(endOfMonth(new Date()), 'yyyy-MM-dd')}`)
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

    return (
        <BaseModal height={'90%'} width={'95%'} color={color} title={'Relatorio de Estoque'} isOpen={isOpen} setClose={setClose}>
            {(loading || !result) ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.info}>
                        <InputGroup width={'20%'} title={'Cod'} value={result.produto.cod} />
                        <InputGroup width={'80%'} title={'Cod'} value={result.produto.nome} />
                    </div>
                    <div className={styles.info}>
                        <CustomButton onClick={() => { setAjuste(true) }} typeButton={'dark'}>Ajuste Rapido</CustomButton>
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                        <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
                    </div>
                    <div className={styles.info}>
                        <div style={{ width: '49%' }}>
                            <h3>Entradas</h3>
                            <Entradas  lancamentos={result.lancamentos} />
                        </div>
                        <div style={{ width: '50%' }}>
                            <h3>Saidas</h3>
                            <Saidas lancamentos={result.lancamentos} />
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