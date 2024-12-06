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
import ProdutoForm from '@/components/Modals/Produto';
import AjusteEmMassa from '@/components/Modals/Produto/AjusteEmMassa';


export default function Produto() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IProduto[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState(-1);
    const [ajuste, setAjuste] = useState(false);
    const [user, setUser] = useState<IUsuario>()

    const loadData = async () => {
       var u: any;
       if(!user){
        var res = await getUser();
        setUser(res);
        u = res;
        }
        await api
            .get(`/Produto/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
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
            return (p.nome + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IProduto) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Local',
            selector: row => row['idProduto'] >= 0 ? 'SIM' : 'NAO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Cod',
            selector: row => row['cod'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Nome',
            selector: row => row['nome'],
            sortable: true,
        },
        {
            name: 'Estoque',
            selector: row => row['quantidade'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Custo',
            selector: row => row['valorCompra'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Venda',
            selector: row => row['valor'],
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

    const handleNovaPizza = () => {
        window.location.href = '/produto/novaPizza';
    }
    return (
        <div className={styles.container}>
            <h4>Produtos</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}} >Novo Produto</CustomButton>
            <CustomButton typeButton={'dark'} onClick={handleNovaPizza}  style={{marginLeft: '10px'}} >Nova Pizza</CustomButton>
            <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}} style={{marginLeft: '10px'}}  >Novo Prato</CustomButton>
            <CustomButton typeButton={'dark'} onClick={() => {window.location.href = '/produto/franquia'}} style={{marginLeft: '10px'}} >Franquia</CustomButton>
            <CustomButton typeButton={'dark'} onClick={() => {setAjuste(true)}}  style={{marginLeft: '10px'}}>Ajuste Massa</CustomButton>
            <hr/>
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <ProdutoForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}
            {ajuste && <AjusteEmMassa isOpen={ajuste} setClose={(v) => {
                if(v){
                    loadData();
                }
                setAjuste(false);
            }}/>}

        </div>
    )
}
