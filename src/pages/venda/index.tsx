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
import { fGetNumber, printHTML , GetCurrencyBRL } from "@/utils/functions"
import Visualizar from "@/components/Modals/Venda/Visualizar"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import CustomButton from "@/components/ui/Buttons"
import { isMobile } from "react-device-detect"


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
    }, [])

    const loadData = async () => {
        var u: any;
       if(!user){
        var res = await getUser();
        setUser(res);
        u = res;
        }
        var url = '';
        if(!search){
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Venda/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}&vendedorId=$0}&movimentoCaixa=${0}&status=${0}`;
        }else{
            url = `/Venda/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}&vendedorId=${search.vendedorId}&movimentoCaixa=${search.movimentoCaixa}&status=${search.status}`;
        }
        await api.get(url)
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
            cell: ({ id, idVenda }: IVenda) => <a style={{textDecorationLine: 'underline', color: 'var(--main)'}}  href='#' onClick={() => {setShowVenda(id)}}>{idVenda}</a>,
            sortable: true,
            selector: row => row.idVenda,
            width: '10%',
        },
        {
            name: 'Caixa',
            cell: ({idMovimentoCaixa, movimentoCaixaId }: IVenda) => <a style={{textDecorationLine: 'underline', color: 'var(--main)'}} href='#' onClick={() => {setShowMovimento(movimentoCaixaId)}}>{idMovimentoCaixa}</a>,
            selector: row => row.idMovimentoCaixa,
            sortable: true,
            width: '10%',
        },
        {
            name: 'Data',
            cell: ({dataVenda }: IVenda) => <p>{format(new Date(dataVenda.toString()), 'dd/MM/yyyy HH:mm')}</p>,
            selector: row => row.dataVenda,
            sortable: true,
            width: '25%',
        },
        {
            name: 'Usuario',
            selector: row => row.usuario?.nome || '--',
            sortable: true,
            width: '25%',
        },
        {
            name: 'Tipo',
            selector: row => row['estd'] ? 'FATURADO': 'ORÇAMENTO',
            sortable: true,
            width: '10%',
        },
        {
            name: 'Status',
            selector: row => row['statusVenda'] ? 'OK' : 'CANCELADO',
            sortable: true,
            width: '10%',
        },
        {
            name: 'Valor',
            selector: row => GetCurrencyBRL(row.valorTotal),
            sortable: true,
            width: '10%',
        }
    ]

    const Item = (item: IVenda) => {
        return (
            <div className={styles.item} onClick={() => {setShowVenda(item.id)}}>
                <span className={styles.w20}>Venda<br /><b>{item.idVenda}</b></span>
                <span className={styles.w30}>Data<br /><b>{format(new Date(item.idVenda), 'dd/MM/yy HH:mm')}</b></span>
                <span className={styles.w30}>Status<br /><b>{item.statusVenda ? 'OK' : 'CANCELADA'}</b></span>
                <span className={styles.w20}>Valor<br /><b>{GetCurrencyBRL(item.valorTotal)}</b></span>
                <span className={styles.w20}>Caixa<br /><b>{item.idMovimentoCaixa}</b></span>
                <span className={styles.w20}>Usuario<br /><b>{item.usuario?.nome}</b></span>
                <span className={styles.w20}>Tipo<br /><b>{item.estd ? 'FATURADO' : 'ORCAMENTO'}</b></span>
            </div>
        )

    }

    if(loading){
        return <></>
    }

    return(
        <div className={styles.container}>
        <h4>Vendas</h4>
        <div className={styles.boxSearch}>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => {setSearch({...search, dateIn: v.target.value})}}  title={'Inicio'} width={'20%'}/>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()}  onChange={(v) => {setSearch({...search, dateFim: v.target.value})}}  title={'Final'} width={'20%'}/>
            <InputGroup type={'number'} value={search?.movimentoCaixa}  onChange={(v) => {setSearch({...search, movimentoCaixa: v.target.value})}}  title={'Caixa'} width={'20%'}/>
            <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
        </div>
        <hr/>
        {isMobile ? <>
           {vendas?.map((p) => Item(p))}
        </> : <>
            <CustomTable
            columns={columns}
            data={vendas}
            loading={loading}
        />
        </>}
        {showVenda > 0 && <Visualizar id={showVenda} isOpen={showVenda > 0} user={user} setClose={() => {setShowVenda(0)}} />}
        {showMovimento > 0 && <VisualizarMovimento id={showMovimento} isOpen={showMovimento > 0} user={user} setClose={() => {setShowMovimento(0)}} />}
    </div>
    )
}