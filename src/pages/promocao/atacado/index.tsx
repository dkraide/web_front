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
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import IUsuario from '@/interfaces/IUsuario';
import IProduto from '@/interfaces/IProduto';
import IPromocao from '@/interfaces/IPromocao';
import AtacadoForm from '@/components/Modals/Promocao/AtacadoForm';


export default function Atacado() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IPromocao[]>([])
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
            .get(`/Promocao/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
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
            return ((p.produto?.nome || '') + (p.classeMaterial?.nomeClasse || '') + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IPromocao) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'warning'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Local',
            selector: row => row['idPromocao'] > 0 ? 'SIM' : 'NAO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Tipo',
            selector: row => row['produtoId'] > 0 ? 'PRODUTO' : 'CLASSE',
            sortable: true,
            grow: 0
        },
        {
            name: 'Item',
            selector: row => row['produto'] ? row.produto.nome : row.classeMaterial.nomeClasse,
            sortable: true,
        },
        {
            name: 'Quantidade',
            selector: row => row['quantidade'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Valor',
            selector: row => row['valorFinal'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Status',
            selector: row => row['status'] ? 'Ativo' : 'Inativo',
            sortable: true,
            grow: 0
        }
    ]
    return (
        <div className={styles.container}>
            <h4>Promocoes</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}} >Nova Promocao</CustomButton>
            <hr/>
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <AtacadoForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
