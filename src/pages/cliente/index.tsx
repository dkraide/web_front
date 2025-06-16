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
import ClasseMaterialMobile from '@/components/Mobile/Pages/ClasseMaterialMobile';
import { useWindowSize } from 'rooks';
import ICliente from '@/interfaces/ICliente';
import ClienteForm from '@/components/Modals/Cliente/ClienteForm';
import { Spinner } from 'react-bootstrap';
import { isMobile } from 'react-device-detect';


export default function Cliente() {
    const [loading, setLoading] = useState(true)
    const [clientes, setClientes] = useState<ICliente[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState(-1);
    const [user, setUser] = useState<IUsuario>()
    const [mobile, setMobile] = useState(false);
    const { innerWidth } = useWindowSize();

    useEffect(() => {
        if (!innerWidth) {
            return;
        }
        setMobile(innerWidth < 600);

    }, [innerWidth])

    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api
            .get(`/Cliente/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setClientes(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getFiltered() {
        var res = clientes.filter(p => {
            return `${p.nome} ${p.telefone} ${p.cpf}`.toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: ICliente) => <CustomButton onClick={() => { setEdit(id) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit} /></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Local',
            selector: row => row['idCliente'] >= 0 ? 'SIM' : 'NAO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Nome',
            selector: row => row['nome'],
            sortable: true,
        },
        {
            name: 'CPF',
            selector: row => row['cpf'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Telefone',
            selector: row => row['telefone'],
            sortable: true,
        },
        {
            name: 'Pontos',
            selector: row => row['pontos'],
            sortable: true,
        },
    ]


    const Item = (item: ICliente) => {
        return (
            <div onClick={() => {setEdit(item.id)}} key={item.id} className={styles.item}>
                <span className={styles.w80}>Nome<br /><b>{item.nome}</b></span>
                <span className={styles.w20}>Pontos<br /><b>{item.pontos}</b></span>
                <span className={styles.w60}>CPF<br /><b>{item.cpf}</b></span>
                <span className={styles.w40}>Telefone<br /><b>{item.telefone}</b></span>
            </div>
        )
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <Spinner />
            </div>
        )
    }
    return (
        <div className={styles.container}>
            <h4>Clientes</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => { setEdit(0) }} >Novo Cliente</CustomButton>
            <CustomButton typeButton={'dark'} onClick={() => { window.location.href = '/cliente/franquia' }} style={{ marginLeft: '10px' }} >Franquia</CustomButton>
            <hr />
            {isMobile ? (
                <>
                    {clientes?.map((cliente) => Item(cliente))}
                </>
            ) : (
                <>
                    <CustomTable
                        columns={columns}
                        data={getFiltered()}
                        loading={loading}
                    />
                </>
            )}
            {(edit >= 0) && <ClienteForm user={user} isOpen={edit >= 0} clienteId={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
