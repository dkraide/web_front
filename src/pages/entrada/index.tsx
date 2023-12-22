import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import IUsuario from '@/interfaces/IUsuario';
import IDespesa from '@/interfaces/IDespesa';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import DespesaForm from '@/components/Modals/Financeiro/DespesaForm';
import { Badge } from 'react-bootstrap';
import BoxInfo from '@/components/ui/BoxInfo';
import _ from 'lodash';
import IEntrada from '@/interfaces/IEntrada';
import SelectStatusRecebimento from '@/components/Selects/SelectStatusRecebimento';
import EntradaForm from '@/components/Modals/Financeiro/EntradaForm';

interface searchProps{
    dateIn: string
    dateFim: string
    status: number
    filter: string
}

export default function Entrada() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IEntrada[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState<searchProps>()
    const [edit, setEdit] = useState(-1);
    const [user, setUser] = useState<IUsuario>()

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
            setSearch({...search, dateIn: dateIn, dateFim: dateFim, status: 0});
            url = `/Entrada/List?status=${0}&empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        }else{
          url = `/Entrada/List?status=${search.status || 0}&empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api
            .get(url)
            .then(({ data }: AxiosResponse) => {
                setList(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getFiltered() {
        var res = list.filter(p => {
            return (p.descricao + p.id.toString()).toLowerCase().includes(search?.filter?.toLowerCase() || '')
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IDespesa) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            width: '10%',
        },
        {
            name: 'Local',
            selector: row => row['idEntrada'] > 0 ? 'SIM' : 'NAO',
            sortable: true,
            width: '10%',
        },
        {
            name: 'Descricao',
            selector: row => row.descricao,
            sortable: true,
            width: '40%',
        },
        {
            name: 'Lancamento',
            selector: row => row.dataLancamento,
            cell: row => format(new Date(row.dataLancamento ||  new Date()), 'dd/MM/yyyy'),
            sortable: true,
            width: '10%',
        },
        {
            name: 'Recebimento',
            selector: row => row.dataRecebimento,
            cell: (row: IEntrada) => row.statusRecebimento ? format(new Date(row.dataRecebimento||  new Date()), 'dd/MM/yyyy') : '--' ,
            sortable: true,
            width: '10%',
        },
        {
            name: 'Valor',
            selector: row => row.valorTotal,
            cell: (row: IEntrada) => row.valorTotal.toFixed(2),
            sortable: true,
            width: '10%',
        },
        {
            name: 'Status',
            selector: (row: IEntrada) => <StatusBadge dataRecebimento={row.dataRecebimento} statusLancamento={row.statusRecebimento} />,
            sortable: true,
            width: '10%',
        }
    ]

    return (
        <div className={styles.container}>
            <h4>Entradas</h4>
            <div className={styles.boxSearch}>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => {setSearch({...search, dateIn: v.target.value})}}  title={'Inicio'} width={'20%'}/>
            <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()}  onChange={(v) => {setSearch({...search, dateFim: v.target.value})}}  title={'Final'} width={'20%'}/>
            <SelectStatusRecebimento width={'30%'} selected={search?.status || 0} setSelected={(v) => {setSearch({...search, status:v })}}/>
            <CustomButton style={{height: '40px', marginLeft: 10, marginTop: '14px'}} typeButton={'dark'} onClick={loadData}>Pesquisar</CustomButton>
           <InputGroup width={'100%'} placeholder={'Filtro'} title={'Pesquisar'} value={search?.filter || ''} onChange={(e) => { setSearch({...search, filter: e.target.value}) }} />
            </div>
            <CustomButton style={{marginBottom: '10px'}} typeButton={'dark'} onClick={() => {setEdit(0)}}>Nova Entrada</CustomButton>
           <div className={styles.boxSearch}>
           <BoxInfo style={{marginRight: '10px'}} title={'Geral'} value={`R$ ${_.sumBy(list, p => p.valorTotal).toFixed(2)}`}/>
           <BoxInfo style={{marginRight: '10px'}} title={'A Receber'} value={`R$ ${_.sumBy(list, p => {
            if(new Date(p.dataRecebimento) < new Date || p.statusRecebimento){
                 return 0
            }
            return p.valorTotal;
           }).toFixed(2)}`}/>
           <BoxInfo style={{marginRight: '10px'}} title={'Recebido'} value={`R$ ${_.sumBy(list, p =>  p.statusRecebimento ?  p.valorTotal : 0).toFixed(2)}`}/>
           </div>
            <hr/>
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <EntradaForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}

const StatusBadge = ({dataRecebimento, statusLancamento}) => {
    if(statusLancamento){
        return <Badge style={{padding: '7px', fontSize: '12px'}} bg={'success'}>PAGO</Badge>
    }
    if(new Date(dataRecebimento) < new Date()){
        return <Badge style={{padding: '7px', fontSize: '12px'}} bg={'danger'}>VENCIDO</Badge>
    }
    return <Badge style={{padding: '7px', fontSize: '12px'}} bg={'primary'}>EM ABERTO</Badge>
}
