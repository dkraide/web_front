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
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import ILancamentoEstoque from "@/interfaces/ILancamentoEstoque"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEdit } from "@fortawesome/free-solid-svg-icons"
import LancamentoEstoqueForm from "@/components/Modals/Produto/LancamentoEstoqueForm"

interface searchProps{
    dateIn: string
    dateFim: string
}

export default function EstoqueLancamento(){

    const [vendas, setVendas] = useState<ILancamentoEstoque[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [edit, setEdit] = useState(-1)
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
        var url = ``;
        if(!search){
            var dataIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dataFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/LancamentoEstoque/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dataIn}&dataFim=${dataFim}`;
        }else{
            url = `/LancamentoEstoque/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
       
        await api.get(url)
        .then(({data}: AxiosResponse<ILancamentoEstoque[]>) => {
            setVendas(data);
        }).catch((err: AxiosError) => {
              toast.error(`Erro ao buscar lancamentos. ${err.response?.data || err.message}`);
        });
        setLoading(false);
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Online',
            selector: row => row['id'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Local',
            selector: row => row['idLancamentoEstoque'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Data',
            selector: row => row['dataLancamento'],
            cell: row => format(new Date(row.dataLancamento), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Tipo',
            selector: row => row['isEntrada'],
            cell: row => row.isEntrada? 'ENTRADA': 'SAIDA',
            sortable: true,
        },
    ]

    return(
        <div className={styles.container}>
        <h4>Lancamentos De Estoque</h4>
        <div className={styles.boxSearch}>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => {setSearch({...search, dateIn: v.target.value})}}  title={'Inicio'} width={'20%'}/>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()}  onChange={(v) => {setSearch({...search, dateFim: v.target.value})}}  title={'Final'} width={'20%'}/>
            <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
        </div>
        <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}} style={{marginRight: 10}} >Novo Lancamento</CustomButton>
        <CustomButton typeButton={'dark'} onClick={() => {document.location.href = `/estoqueLancamento/xml`}} >Carregar de XML</CustomButton>
        <hr/>
        <CustomTable
            columns={columns}
            data={vendas}
            loading={loading}
        />
          {(edit >= 0) && <LancamentoEstoqueForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}
    </div>
    )
}