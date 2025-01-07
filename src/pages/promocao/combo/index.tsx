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
import IPromocao from '@/interfaces/IPromocao';
import ComboForm from '@/components/Modals/Promocao/ComboForm';
import ICombo from '@/interfaces/ICombo';
import { isMobile } from 'react-device-detect';


export default function Combo() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<ICombo[]>([])
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
            .get(`/Combo/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
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
            return (p.codigo + p.descricao + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IPromocao) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Local',
            selector: row => row['idCombo'] >= 0 ? 'SIM' : 'NAO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Codigo',
            selector: row => row['codigo'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Descricao',
            selector: row => row['descricao'],
            sortable: true,
        },
        {
            name: 'Status',
            selector: row => row['status'] ? 'Ativo' : 'Inativo',
            sortable: true,
            grow: 0
        }
    ]

    const Item = (item: ICombo) => {
        return(
            <div key={item.id} className={styles.item} onClick={() => {setEdit(item.id)}} >
                 <span className={styles.w60}>Codigo<br /><b>{item.codigo}</b></span>
                 <span className={item.status ? styles.ativo : styles.inativo}>{item.status ? 'ATIVO' : 'INATIVO'}</span>
                 <span className={styles.w100}>Descricao<br /><b>{item.descricao}</b></span>
            </div>
        )

    }

    if(loading){
        return <></>
    }
    return (
        <div className={styles.container}>
            <h4>Combos</h4>
            <InputGroup width={isMobile ? '100%' :'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}} >Novo Combo</CustomButton>
            <hr/>
             {isMobile ? <>
             {getFiltered()?.map((item) => Item(item))}
             </> : <>
                <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            /></>}

            {(edit >= 0) && <ComboForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
