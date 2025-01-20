import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputGroup } from "@/components/ui/InputGroup";
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
import { ExportToExcel } from "@/utils/functions";


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
                console.log(data);
                setResult(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
            })
        setLoading(false);
    }

    if (ajuste) {
        return <AjusteEstoqueForm isOpen={ajuste} produto={result.produto} user={user} setClose={(v) => {
            if (v) {
                loadData();
            }
            setAjuste(false);
        }} />
    }

    const columns = [
        {
            name: 'Tipo',
            selector: (row: ILancamentoEstoqueProduto) => row.isEntrada,
            cell: (row: ILancamentoEstoqueProduto) => <>{row.isEntrada ? 'ENTRADA' : 'SAIDA'}</>,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Nro',
            selector: (row: ILancamentoEstoqueProduto) => row.idLancamentoEstoqueProduto,
            cell: (row: ILancamentoEstoqueProduto) => row.idLancamentoEstoqueProduto,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Observacao',
            selector: (row: ILancamentoEstoqueProduto) => row.observacao,
            cell: (row: ILancamentoEstoqueProduto) => row.observacao,
            sortable: true,
            width: '45%'
        },
        {
            name: 'Data',
            selector: (row: ILancamentoEstoqueProduto) => row.dataLancamento.toString(),
            cell: (row: ILancamentoEstoqueProduto) => format(new Date(row.dataLancamento ?? new Date()), 'dd/MM/yyyy HH:mm'),
            sortable: true,
            width: '15%'
        },
        {
            name: 'Qntd',
            selector: (row: ILancamentoEstoqueProduto) => row.quantidade,
            cell: (row: ILancamentoEstoqueProduto) => row.quantidade.toFixed(2),
            sortable: true,
            width: '10%'
        },
        {
            name: 'Custo',
            selector: (row: ILancamentoEstoqueProduto) => row.custoUnitario,
            cell: (row: ILancamentoEstoqueProduto) => `R$ ${(row.custoUnitario * row.quantidade).toFixed(2)}`,
            sortable: true,
            width: '10%'
        },
    ]

    const dataExcel = () => {
        return result.lancamentos.map((lancamento) => {
            return{
                tipo: lancamento.isEntrada ? 'ENTRADA' :"SAIDA",
                nro: lancamento.id,
                obs: lancamento.observacao,
                data: format(new Date(lancamento.dataLancamento), 'dd-MM-yy HH:mm'),
                qtd: lancamento.quantidade,
                custo: lancamento.custoUnitario * lancamento.quantidade
            }
        });

    }

    const headers = [
        {label: 'Tipo', key:'tipo'},
        {label: 'Nro', key:'nro'},
        {label: 'Obs', key:'obs'},
        {label: 'Data', key:'data'},
        {label: 'Qtd', key:'qtd'},
        {label: 'Custo', key:'custo'}
    ]

    return (
        <BaseModal height={'90vh'} width={'95vw'} color={color} title={'Relatorio de Estoque'} isOpen={isOpen} setClose={setClose}>
            {(loading || !result) ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.info}>
                        <InputGroup width={'10%'} title={'Cod'} value={result.produto.cod} />
                        <InputGroup width={'80%'} title={'Cod'} value={result.produto.nome} />
                    </div>
                    <div className={styles.info}>
                        <CustomButton onClick={() => { setAjuste(true) }} typeButton={'dark'}>Ajuste Rapido</CustomButton>
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                        <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
                    </div>
                    <hr/>
                    <CustomButton onClick={() => { ExportToExcel(headers, dataExcel(), 'relatorio_estoque') }} typeButton={'dark'}>Excel</CustomButton>
                    <div className={styles.info}>
                        <CustomTable
                            data={(result?.lancamentos) ?? []}
                            columns={columns} />
                    </div>
                </div>
            )}
        </BaseModal>
    )
}