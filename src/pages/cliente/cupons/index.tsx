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
import ICupomDesconto from '@/interfaces/ICupomDesconto';
import CupomForm from '@/components/Modals/CupomDesconto/CreateEditForm';

export default function Cupons() {
    const [loading, setLoading] = useState(true)
    const [cupons, setCupons] = useState<ICupomDesconto[]>([])
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
            .get(`/v2/CupomDesconto?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setCupons(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getFiltered() {
        return cupons.filter(c => {
            return ((c.titulo || '') + (c.codigo || '') + c.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
    }

    function formatValor(c: ICupomDesconto) {
        return c.tipoCalculo === 'PERCENTUAL' ? `${c.valor}%` : `R$${(c.valor || 0).toFixed(2)}`;
    }

    function formatUsos(c: ICupomDesconto) {
        return c.quantidade === 0 ? `${c.quantidadeUsada} / ∞` : `${c.quantidadeUsada} / ${c.quantidade}`;
    }

    function formatData(d?: string | null) {
        if (!d) return '-';
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR');
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: ICupomDesconto) => <CustomButton onClick={() => { setEdit(id) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit} /></CustomButton>,
            grow: 0
        },
        {
            name: 'Titulo',
            selector: (row: ICupomDesconto) => row.titulo,
            sortable: true,
        },
        {
            name: 'Codigo',
            selector: (row: ICupomDesconto) => row.codigo,
            sortable: true,
        },
        {
            name: 'Valor',
            cell: (row: ICupomDesconto) => formatValor(row),
            grow: 0
        },
        {
            name: 'Aplicacao',
            selector: (row: ICupomDesconto) => row.tipoAplicacao,
            grow: 0
        },
        {
            name: 'Permissao',
            selector: (row: ICupomDesconto) => row.permissao,
            grow: 0
        },
        {
            name: 'Validade',
            cell: (row: ICupomDesconto) => formatData(row.dataValidade),
            grow: 0
        },
        {
            name: 'Usos',
            cell: (row: ICupomDesconto) => formatUsos(row),
            grow: 0
        },
        {
            name: 'Status',
            selector: (row: ICupomDesconto) => row.status ? 'Ativo' : 'Inativo',
            grow: 0
        },
    ]

    return (
        <div className={styles.container}>
            <h4>Cupons de Desconto</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => { setEdit(0) }} >Novo Cupom</CustomButton>
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <CupomForm user={user} isOpen={edit >= 0} cupomId={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}
        </div>
    )
}
