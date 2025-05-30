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
import AjusteEstoqueForm from "../IngredienteAjusteEstoqueForm";
import { ExportToExcel } from "@/utils/functions";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { useSetState } from "rooks";
import IngredienteAjusteEstoqueForm from "../IngredienteAjusteEstoqueForm";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface searchProps {
    dateIn: string
    dateFim: string
}
export default function IngredienteEstoqueForm({ user, isOpen, id, setClose, color }: props) {

    const [result, setResult] = useState<ILancamentoEstoqueProduto[]>([])
    const [ingrediente, setIngrediente] = useState<IMateriaPrima>()
    const [loading, setLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<searchProps>({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') })
    const [ajuste, setAjuste] = useState(false);
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await api.get(`/Estoque/Select?dataIn=${search?.dateIn}&dataFim=${search?.dateFim}&IngredienteId=${id}`)
            .then(({ data }: AxiosResponse<ILancamentoEstoqueProduto[]>) => {
                setResult(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
            });
        await api.get(`/MateriaPrima/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IMateriaPrima>) => {
                setIngrediente(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
            });
        setLoading(false);
    }

    if (ajuste) {
        return <IngredienteAjusteEstoqueForm isOpen={ajuste} ingrediente={ingrediente} user={user} setClose={(v) => {
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
        return result.map((lancamento) => {
            return {
                tipo: lancamento.isEntrada ? 'ENTRADA' : "SAIDA",
                nro: lancamento.id,
                obs: lancamento.observacao,
                data: format(new Date(lancamento.dataLancamento), 'dd-MM-yy HH:mm'),
                qtd: lancamento.quantidade,
                custo: lancamento.custoUnitario * lancamento.quantidade
            }
        });

    }

    const headers = [
        { label: 'Tipo', key: 'tipo' },
        { label: 'Nro', key: 'nro' },
        { label: 'Obs', key: 'obs' },
        { label: 'Data', key: 'data' },
        { label: 'Qtd', key: 'qtd' },
        { label: 'Custo', key: 'custo' }
    ]

    return (
        <BaseModal height={'90vh'} width={'95vw'} color={color} title={'Relatorio de Estoque de Ingrediente'} isOpen={isOpen} setClose={setClose}>
            {(loading || !result) ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.info}>
                        <InputGroup width={'10%'} title={'Cod'} value={ingrediente?.id} />
                        <InputGroup width={'80%'} title={'Nome'} value={ingrediente?.nome} />
                    </div>
                    <div className={styles.info}>
                        <CustomButton onClick={() => { setAjuste(true) }} typeButton={'dark'}>Ajuste Rapido</CustomButton>
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                        <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
                    </div>
                    <hr />
                    <CustomButton onClick={() => { ExportToExcel(headers, dataExcel(), 'relatorio_estoque_ingrediente') }} typeButton={'dark'}>Excel</CustomButton>
                    <div className={styles.info}>
                        <CustomTable
                            data={result}
                            columns={columns} />
                    </div>
                </div>
            )}
        </BaseModal>
    )
}