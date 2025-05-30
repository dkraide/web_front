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
import IMateriaPrima from '@/interfaces/IMateriaPrima';
import MateriaPrimaForm from '@/components/Modals/MateriaPrima/CadastroForm';
import { isMobile } from 'react-device-detect';
import { GetCurrencyBRL } from '@/utils/functions';
import IngredienteEstoqueForm from '@/components/Modals/MateriaPrima/IngredienteEstoqueForm';

type searchProps = {
    str: string
    edit: number
    estoque: number
}
export default function Ingredientes() {
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<IMateriaPrima[]>([])
    const { getUser } = useContext(AuthContext)
    const [searchProps, setSearchProps] = useState<searchProps>({
        str: '',
        edit: -1,
        estoque: -1
    })
    const [user, setUser] = useState<IUsuario>()

    const loadData = async () => {
        var u: any;
        if (!user) {
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
            return (p.nome + p.id.toString()).toLowerCase().includes(searchProps.str.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            selector: (row: IMateriaPrima) => row.id,
            cell: ({ id }: IMateriaPrima) => <CustomButton onClick={() => { setSearchProps({...searchProps, edit: id}) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit} /></CustomButton>,
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
            cell: (row: IMateriaPrima) => <a style={{color: 'var(--main)'}} href={'#'} onClick={() => {setSearchProps({...searchProps, estoque: row.id})}}>{row.quantidade.toFixed(2)}</a>,
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

    const Item = (item: IMateriaPrima) => {
        return (
            <div className={styles.item} onClick={() => { setSearchProps({...searchProps, edit: item.id}) }}>
                <span className={styles.w100}>Descrição<br /><b>{item.nome}</b></span>
                <span className={styles.w30}>Qtd<br /><b>{item.quantidade.toFixed(2)}</b></span>
                <span className={styles.w30}>Custo<br /><b>{GetCurrencyBRL(item.valorCusto)}</b></span>
                <span className={styles.w30}>Venda<br /><b>{GetCurrencyBRL(item.valorVenda)}</b></span>
            </div>
        )
    }

    if(loading){
        return <></>
    }
    return (
        <div className={styles.container}>
            <h4>Ingredientes</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={searchProps.str} onChange={(e) => { setSearchProps({...searchProps, str: e.currentTarget.value}) }} />
            <CustomButton typeButton={'dark'} onClick={() => { setSearchProps({...searchProps, edit: 0}) }} >Novo Ingrediente</CustomButton>
            <CustomButton style={{ marginLeft: 5 }} typeButton={'dark'} onClick={() => { window.location.href = '/materiaPrima/grupos' }} >Grupos</CustomButton>
            <hr />
            {isMobile ? <>
                {getFiltered()?.map((item) => Item(item))}
            </> : <>
                <CustomTable
                    columns={columns}
                    data={getFiltered()}
                    loading={loading}
                />
            </>}

            {(searchProps.edit >= 0) && <MateriaPrimaForm user={user} isOpen={searchProps.edit >= 0} id={searchProps.edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setSearchProps({...searchProps, edit: -1})
            }} />}
             {(searchProps.estoque >= 0) && <IngredienteEstoqueForm user={user} isOpen={searchProps.estoque >= 0} id={searchProps.estoque} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setSearchProps({...searchProps, estoque: -1})
            }} />}

        </div>
    )
}
