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
import ClasseForm from '@/components/Modals/ClasseMaterial/CreateEditForm';
import IUsuario from '@/interfaces/IUsuario';
import IFormaPagamento from '@/interfaces/IFormaPagamento';
import FormaPagamentoForm from '@/components/Modals/FormaPagamentoForm';


export default function FormaPagamento() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IFormaPagamento[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState(-1);
    const [user, setUser] = useState<IUsuario>()

    const loadData = async () => {
       var u: any;
       if(!user){
        var res = await getUser();
        setUser(res);
        u = res;
        }
        await api
            .get(`/FormaPagamento/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setList(data);
                console.log(data);
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
            return (p.nome + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IFormaPagamento) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'warning'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Local',
            selector: row => row['idFormaPagamento'] > 0 ? 'SIM' : 'NAO',
            sortable: true,
            width: '10%'
        },
        {
            name: 'Nome',
            selector: row => row['nome'],
            sortable: true,
            width: '60%'
        },
        {
            name: 'Faturamento',
            selector: row => row['geraFaturamento'] ? 'SIM' : 'NAO',
            sortable: true,
            width: '10%'
        },
        {
            name: 'Status',
            selector: row => row['isVisivel'] ? 'Ativo' : 'Inativo',
            sortable: true,
            width: '10%'
        }
    ]
    return (
        <div className={styles.container}>
            <h4>Formas de Pagamento</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}}>Nova Forma</CustomButton>
            <hr/>
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <FormaPagamentoForm user={user} isOpen={edit >= 0} classeId={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
