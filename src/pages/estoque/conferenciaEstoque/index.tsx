import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import IUsuario from '@/interfaces/IUsuario';
import _ from 'lodash';
import IConferenciaEstoque from '@/interfaces/IConferenciaEstoque';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import DetalheConferenciaForm from '@/components/Modals/Produto/DetalheConferenciaForm';

interface searchProps {
    dateIn: string
    dateFim: string
    searchStr: string
}
export default function ConferenciaEstoque() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IConferenciaEstoque[]>([])
    const { getUser } = useContext(AuthContext)
    const [edit, setEdit] = useState<IConferenciaEstoque | undefined>(undefined);
    const [user, setUser] = useState<IUsuario>()
    const [search, setSearch] = useState<searchProps>()


    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        if (!loading) {
            setLoading(true);
        }
        var url = '';
        if(!search){
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/ConferenciaEstoque/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        }else{
            url = `/ConferenciaEstoque/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<IConferenciaEstoque[]>) => {
                setList(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar relatorio. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        if (!search) {
            setSearch({searchStr: '', dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
        }
        setTimeout(() => {
            loadData();
        }, 1000);
    }, [])

    function getFiltered() {
        var res = list.filter(p => {
            return (p?.produto?.nome).toLowerCase().includes(search.searchStr.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: (row: IConferenciaEstoque) => <CustomButton onClick={() => { setEdit(row) }} typeButton={'primary'}><FontAwesomeIcon icon={faEye} /></CustomButton>,
            sortable: true,
            width: '5%'
        },
        {
            name: 'Usuario',
            selector: (row: IConferenciaEstoque) => row.usuarioNome || '--',
            sortable: true,
            width: '10%'
        },
        {
            name: 'Produto',
            selector: (row: IConferenciaEstoque) => row.produto?.nome || '--',
            sortable: true,
            width: '30%'
        },
        {
            name: 'Data',
            selector: (row) => row.dataConferencia,
            cell: (row: IConferenciaEstoque) => <>{format(new Date(row.dataConferencia), 'dd/MM/yy HH:mm')}</>,
            sortable: true,
            width: '15%'
        },
        {
            name: 'Qte Inf.',
            selector: (row: IConferenciaEstoque) => row['quantidadeInformada'],
            cell: (row: IConferenciaEstoque) => row.quantidadeInformada.toFixed(2),
            sortable: true,
            width: '15%'
        },
        {
            name: 'Qte Esp.',
            selector: (row: IConferenciaEstoque) => row.quantidadeReal,
            cell: (row: IConferenciaEstoque) => row.quantidadeReal.toFixed(2),
            sortable: true,
            width: '15%'
        },
        {
            name: 'Diferenca',
            selector: (row: IConferenciaEstoque) => (row.quantidadeInformada - row.quantidadeReal),
            cell: (row: IConferenciaEstoque) => (row.quantidadeInformada - row.quantidadeReal).toFixed(2),
            sortable: true,
            width: '10%'
        },
    ]
    return (
        <div className={styles.container}>
            <h4>Conferencia de Estoque</h4>
            <div className={styles.box}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search?.searchStr} onChange={(e) => { setSearch({...search, searchStr:e.target.value}) }} />
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />
            {!!edit && <DetalheConferenciaForm user={user} conferencia={edit} isOpen={!!edit} setClose={() => {
                setEdit(undefined);
            }}/>}
        </div>
    )
}
