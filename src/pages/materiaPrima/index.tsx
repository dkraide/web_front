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
import IMateriaPrima from '@/interfaces/IMateriaPrima';
import MateriaPrimaForm from '@/components/Modals/MateriaPrima/CadastroForm';


export default function MateriaPrima() {
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<IMateriaPrima[]>([])
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
            .get(`/MateriaPrima/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setClasses(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getFiltered() {
        var res = classes.filter(p => {
            return (p.nome + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IMateriaPrima) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Local',
            selector: (row: IMateriaPrima) => row.idMateriaPrima ? 'SIM' : 'NAO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Nome',
            selector: (row: IMateriaPrima) => row.nome,
            sortable: true,
        },
        {
            name: 'Quantidade',
            selector: (row: IMateriaPrima) => row.quantidade,
            sortable: true,
            grow: 0
        },
        {
            name: 'Custo',
            selector: (row: IMateriaPrima) => row.valorCusto,
            sortable: true,
            grow: 0
        },
        {
            name: 'Venda',
            selector: (row: IMateriaPrima) => row.valorVenda,
            sortable: true,
            grow: 0
        }
    ]
    return (
        <div className={styles.container}>
            <h4>Ingredientes</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}} >Novo Ingrediente</CustomButton>
            <CustomButton style={{marginLeft: 5}} typeButton={'dark'} onClick={() => {window.location.href = '/materiaPrima/grupos'}} >Grupos</CustomButton>
            <hr/>
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <MateriaPrimaForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
