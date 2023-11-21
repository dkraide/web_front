import IVenda from "@/interfaces/IVenda"
import { useEffect, useState, useContext } from "react"
import {startOfMonth, endOfMonth, format} from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import styles from './styles.module.scss'
import CustomTable from "@/components/ui/CustomTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import { fGetNumber } from "@/utils/functions"
import Visualizar from "@/components/Modals/Venda/Visualizar"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"

interface searchProps{
    vendedorId: number
    dateIn: string
    dateFim: string
    movimentoCaixa: string
    status: number
    statusSat: 0

}

export default function Venda(){

    const [vendas, setVendas] = useState<IVenda[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [showVenda, setShowVenda] = useState(0)
    const [showMovimento, setShowMovimento] = useState(0)
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
       if(!search){ 
          setSearch({vendedorId: 0, dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'), movimentoCaixa: '', status: 0, statusSat: 0});
       }
       loadData();
    }, [search])

    const loadData = async () => {
        if(!search){
            return;
        }
        var u: any;
       if(!user){
        var res = await getUser();
        setUser(res);
        u = res;
        }
        await api.get(`/Venda/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}&vendedorId=${search.vendedorId}&movimentoCaixa=${search.movimentoCaixa}&status=${search.status}`)
        .then(({data}: AxiosResponse<IVenda[]>) => {
            setVendas(data);
            console.log(data);
        }).catch((err: AxiosError) => {
              toast.error(`Erro ao buscar vendas. ${err.response?.data || err.message}`);
        });
        setLoading(false);
    }

    const columns = [
        {
            name: 'Venda',
            cell: ({ id, idVenda }: IVenda) => <a  href='#' onClick={() => {setShowVenda(id)}}>{idVenda}</a>,
            sortable: true,
            selector: row => row.idVenda,
            grow: 0
        },
        {
            name: 'Caixa',
            cell: ({idMovimentoCaixa, movimentoCaixaId }: IVenda) => <a href='#' onClick={() => {setShowMovimento(movimentoCaixaId)}}>{idMovimentoCaixa}</a>,
            selector: row => row.idMovimentoCaixa,
            sortable: true,
            grow: 0,
        },
        {
            name: 'Data',
            cell: ({dataVenda }: IVenda) => <p>{format(new Date(dataVenda.toString()), 'dd/MM/yyyy HH:mm')}</p>,
            selector: row => row.dataVenda,
            sortable: true,
        },
        {
            name: 'Usuario',
            selector: row => row.usuario?.nome || '--',
            sortable: true,
        },
        {
            name: 'Tipo',
            selector: row => row['estd'] ? 'FATURADO': 'ORCAMENTO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Status',
            selector: row => row['statusVenda'] ? 'OK' : 'CANCELADO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Valor',
            selector: row => `${row.valorTotal.toFixed(2)}`,
            sortable: true,
            grow: 0
        }
    ]

    return(
        <div className={styles.container}>
        <h4>Vendas</h4>
        <div className={styles.boxSearch}>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => {setSearch({...search, dateIn: v.target.value})}}  title={'Inicio'} width={'20%'}/>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()}  onChange={(v) => {setSearch({...search, dateIn: v.target.value})}}  title={'Final'} width={'20%'}/>
            <InputGroup type={'number'} value={search?.movimentoCaixa}  onChange={(v) => {setSearch({...search, movimentoCaixa: v.target.value})}}  title={'Caixa'} width={'20%'}/>
        </div>
        <hr/>
        <CustomTable
            columns={columns}
            data={vendas}
            loading={loading}
        />
        {showVenda > 0 && <Visualizar id={showVenda} isOpen={showVenda > 0} user={user} setClose={() => {setShowVenda(0)}} />}
        {showMovimento > 0 && <VisualizarMovimento id={showMovimento} isOpen={showMovimento > 0} user={user} setClose={() => {setShowMovimento(0)}} />}
    </div>
    )
}