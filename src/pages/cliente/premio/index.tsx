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
import IPremio from '@/interfaces/IPremio';
import PremioForm from '@/components/Modals/Premio/PremioForm';
import { Spinner } from 'react-bootstrap';
import { isMobile } from 'react-device-detect';


export default function ClientePremio() {
    const [loading, setLoading] = useState(true)
    const [premios, setPremios] = useState<IPremio[]>([])
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
        if (!loading) {
            setLoading(true);
        }
        await api
            .get(`/Premio/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setPremios(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getFiltered() {
        var res = premios.filter(p => {
            return `${p.descricao}`.toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    function setImage(id: number) {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            setTimeout(() => {
            }, 500)
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            var formData = new FormData();
            formData.append('file', files[0], files[0].name)
            setTimeout(() => {
            }, 500)
            setLoading(true);
            await api.post(`/Premio/${id}/UploadImagem`, formData, { headers: { "Content-Type": 'multipart/form-data' } })
                .then(({ data }) => {
                    loadData();
                }).catch((err) => {

                    toast.error(`Erro ao tentar salvar imagem.`);
                    setLoading(false);
                })
        }
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
            selector: row => row['idPremio'] >= 0 ? 'SIM' : 'NAO',
            sortable: true,
            grow: 0
        },
        {
            name: 'Imagem',
            cell: ({ localPath, id }: IPremio) => <div
                onClick={() => {
                    setImage(id);
                }}
                style={{
                    cursor: 'pointer'
                }}
            >
                <img
                    style={{
                        width: 85,
                        height: 85,
                        padding: 5
                    }}
                    src={localPath ?? '/nopic.png'}
                    onError={(e) => { e.currentTarget.src = '/nopic.png' }}
                />

            </div>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Descricao',
            selector: (row: IPremio) => row.descricao,
            sortable: true,
        },
        {
            name: 'Pontos',
            selector: (row: IPremio) => row.quantidadePontos,
            sortable: true,
        },
        {
            name: 'Status',
            selector: row => row['status'],
            cell: (row: IPremio) => row.status ? 'Ativo' : 'Inativo',
            sortable: true,
        },
    ]

    const Item = (item: IPremio) => {
        return (
            <div onClick={() => { setEdit(item.id) }} key={item.id} className={styles.item}>
                <span className={styles.w80}>Descrição<br /><b>{item.descricao}</b></span>
                <span className={styles.w20}>Pontos<br /><b>{item.quantidadePontos}</b></span>
                <span className={styles.w60}>Status<br /><b>{item.status ? 'ATIVO' : 'INATIVO'}</b></span>
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
            <h4>Premios</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => { setEdit(0) }} >Novo Premio</CustomButton>
            <hr />
            {isMobile ? (
                <>
                    {getFiltered()?.map((cliente) => Item(cliente))}
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
            {(edit >= 0) && <PremioForm user={user} isOpen={edit >= 0} premioId={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
