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
import IAutomacao from '@/interfaces/IAutomacao';
import AutomacaoForm from '@/components/Modals/Automacao/CreateEditForm';

export const DESCRICAO_GATILHO: Record<string, string> = {
    ESTOQUE: 'Estoque do produto na venda',
    VENDA_ERRO: 'Erro na venda',
    VENDA_FINALIZADA: 'Venda finalizada',
}

export const DESCRICAO_ACAO: Record<string, string> = {
    ESTOQUE: 'Lançar estoque',
    EMAIL: 'Enviar e-mail',
    APLICATIVO: 'Notificar aplicativo',
}

export default function Automacoes() {
    const [loading, setLoading] = useState(true)
    const [automacoes, setAutomacoes] = useState<IAutomacao[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState(-1);
    const [user, setUser] = useState<IUsuario>()

    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api
            .get(`/v2/Automacao?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setAutomacoes(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getFiltered() {
        return automacoes.filter(a => {
            return ((a.nome || '') + a.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IAutomacao) => <CustomButton onClick={() => { setEdit(id) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit} /></CustomButton>,
            grow: 0
        },
        {
            name: 'Nome',
            selector: (row: IAutomacao) => row.nome,
            sortable: true,
        },
        {
            name: 'Quando',
            selector: (row: IAutomacao) => DESCRICAO_GATILHO[row.tipoGatilho] || row.tipoGatilho,
            sortable: true,
        },
        {
            name: 'Então',
            selector: (row: IAutomacao) => DESCRICAO_ACAO[row.tipoAcao] || row.tipoAcao,
            sortable: true,
        },
        {
            name: 'Status',
            selector: (row: IAutomacao) => row.status ? 'Ativo' : 'Inativo',
            grow: 0
        },
    ]

    return (
        <div className={styles.container}>
            <h4>Automações</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => { setEdit(0) }} >Nova Automação</CustomButton>
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <AutomacaoForm user={user} isOpen={edit >= 0} automacaoId={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}
        </div>
    )
}
