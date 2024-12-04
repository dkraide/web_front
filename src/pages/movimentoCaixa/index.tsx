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
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import { GetCurrencyBRL } from "@/utils/functions"

interface searchProps{
    dateIn: string
    dateFim: string
}

export default function MovimentoCaixa(){

    const [vendas, setVendas] = useState<IMovimentoCaixa[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [showVenda, setShowVenda] = useState(0)
    const [showMovimento, setShowMovimento] = useState(0)
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
       if(!search){ 
          setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd')});
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
            url = `/MovimentoCaixa/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        }else{
          url = `/MovimentoCaixa/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
       
        await api.get(url)
        .then(({data}: AxiosResponse<IMovimentoCaixa[]>) => {
            setVendas(data);
        }).catch((err: AxiosError) => {
              toast.error(`Erro ao buscar vendas. ${err.response?.data || err.message}`);
        });
        setLoading(false);
    }

    const columns = [
        {
            name: 'Caixa',
            cell: ({idMovimentoCaixa, id }: IMovimentoCaixa) => <a style={{textDecorationLine: 'underline', color: 'var(--main)'}} href='#' onClick={() => {setShowMovimento(id)}}>{idMovimentoCaixa}</a>,
            selector: row => row.idMovimentoCaixa,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Usuario',
            selector: row => row.usuario?.nome || '--',
            sortable: true,
            width: '10%'
        },
        {
            name: 'Status',
            selector: row => row['status'] ? 'FECHADO': 'ABERTO',
            sortable: true,
            width: '10%'
        },
        {
            name: 'Abertura',
            cell: ({dataMovimento }: IMovimentoCaixa) => <p>{format(new Date(dataMovimento.toString()), 'dd/MM/yyyy HH:mm')}</p>,
            selector: row => row.dataMovimento,
            sortable: true,
            width: '20%'
        },
        {
            name: 'Fechamento',
            cell: ({dataFechamento }: IMovimentoCaixa) => <p>{format(new Date(dataFechamento.toString()), 'dd/MM/yyyy HH:mm')}</p>,
            selector: row => row.dataFechamento,
            sortable: true,
            width: '20%'
        },
        {
            name: 'R$ Abertura',
            cell: ({valorDinheiro }: IMovimentoCaixa) => <p>{GetCurrencyBRL(valorDinheiro)}</p>,
            selector: (row: IMovimentoCaixa) => row.valorDinheiro,
            sortable: true,
            width: '15%'
        },
        {
            name: 'R$ Fechamento',
            cell: ({valorDinheiroFinal }: IMovimentoCaixa) =>  <p>{GetCurrencyBRL(valorDinheiroFinal)}</p>,
            selector: (row: IMovimentoCaixa) => row.valorDinheiroFinal,
            sortable: true,
            width: '15%'
        },
      
    ]

    return(
        <div className={styles.container}>
        <h4>Caixas</h4>
        <div className={styles.boxSearch}>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => {setSearch({...search, dateIn: v.target.value})}}  title={'Inicio'} width={'20%'}/>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()}  onChange={(v) => {setSearch({...search, dateFim: v.target.value})}}  title={'Final'} width={'20%'}/>
            <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
        </div>
        <hr/>
        <CustomTable
            columns={columns}
            data={vendas}
            loading={loading}
        />
        {showMovimento > 0 && <VisualizarMovimento id={showMovimento} isOpen={showMovimento > 0} user={user} setClose={() => {setShowMovimento(0)}} />}
    </div>
    )
}