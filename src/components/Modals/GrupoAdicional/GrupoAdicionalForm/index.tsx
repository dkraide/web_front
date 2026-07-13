import { useEffect, useState } from 'react';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import styles from './styles.module.scss';
import Loading from '@/components/Loading';
import { InputForm } from '@/components/ui/InputGroup';
import CustomButton from '@/components/ui/Buttons';
import BaseModal from '@/components/Modals/Base/Index';
import SelectStatus from '@/components/Selects/SelectStatus';
import { isMobile } from 'react-device-detect';
import { validateString } from '@/utils/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import IGrupoAdicional from '@/interfaces/IGrupoAdicional';
import { IGrupoAdicionalItem } from '@/interfaces/IGrupoAdicionalItem';

interface IMateriaPrimaOption {
    id: number;
    idMateriaPrima: number;
    nome: string;
}

interface props {
    isOpen: boolean;
    id: number; // 0 = novo
    empresaId: number;
    setClose: (res?: boolean) => void;
}

const TIPOS = ['PADRAO', 'BORDA', 'TAMANHO', 'SABOR', 'MASSA'];

const emptyItem = (): IGrupoAdicionalItem => ({
    id: '',
    idGrupoAdicionalItem: crypto.randomUUID(),
    idGrupoAdicional: 0,
    grupoAdicionalId: 0,
    materiaPrima: null,
    idMateriaPrima: 0,
    materiaPrimaId: 0,
    nome: '',
    descricao: '',
    valor: 0,
    qtdSabores: 0,
    status: true,
    precos: [],
    empresaId: 0,
    lastChange: new Date(),
    needChange: true,
});

export default function GrupoAdicionalForm({ isOpen, id, empresaId, setClose }: props) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const [grupo, setGrupo] = useState<IGrupoAdicional>({} as IGrupoAdicional);
    const [loading, setLoading] = useState<boolean>(true);
    const [sending, setSending] = useState(false);
    const [tab, setTab] = useState<'detalhes' | 'itens'>('detalhes');

    const [materiaPrimas, setMateriaPrimas] = useState<IMateriaPrimaOption[]>([]);
    const [itemEdit, setItemEdit] = useState<IGrupoAdicionalItem | null>(null);

    useEffect(() => {
        api.get(`/MateriaPrima/List?empresaId=${empresaId}`)
            .then(({ data }: AxiosResponse<IMateriaPrimaOption[]>) => setMateriaPrimas(data ?? []))
            .catch(() => { /* select fica vazio se falhar, nao bloqueia o form */ });

        if (id > 0) {
            api.get(`/v2/GrupoAdicional/${id}`)
                .then(({ data }: AxiosResponse<IGrupoAdicional>) => {
                    setGrupo(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`);
                    setLoading(false);
                });
        } else {
            setGrupo({
                id: 0,
                idGrupoAdicional: 0,
                empresaId,
                tipo: 'PADRAO',
                descricao: '',
                status: true,
                minimo: 0,
                maximo: 1,
                itens: [],
                lastChange: new Date(),
                needChange: true,
            } as IGrupoAdicional);
            setLoading(false);
        }
    }, [id]);

    const onSubmit = async (data: any) => {
        if (!validateString(data.descricao, 3)) {
            toast.error('Informe uma descrição com no mínimo 3 caracteres!');
            return;
        }
        if (!grupo.itens || grupo.itens.length === 0) {
            toast.error('Cadastre ao menos um item complementar!');
            setTab('itens');
            return;
        }

        setSending(true);

        const payload: IGrupoAdicional = {
            ...grupo,
            descricao: data.descricao,
            minimo: Number(data.minimo ?? 0),
            maximo: Number(data.maximo ?? 1),
            empresaId,
        };

        api.post(`/v2/GrupoAdicional`, payload)
            .then(() => {
                toast.success(`Grupo ${id > 0 ? 'atualizado' : 'cadastrado'} com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao salvar grupo. ${err.response?.data ?? err.message}`);
            })
            .finally(() => setSending(false));
    };

    const handleNovoItem = () => {
        setItemEdit(emptyItem());
    };

    const handleEditarItem = (item: IGrupoAdicionalItem) => {
        setItemEdit({ ...item });
    };

    const handleRemoverItem = (item: IGrupoAdicionalItem) => {
        setGrupo(prev => ({
            ...prev,
            itens: (prev.itens ?? []).filter(i => i.idGrupoAdicionalItem !== item.idGrupoAdicionalItem),
        }));
    };

    const handleSalvarItem = () => {
        if (!itemEdit) return;
        if (!validateString(itemEdit.nome, 2)) {
            toast.error('Informe um nome para o item!');
            return;
        }

        setGrupo(prev => {
            const itens = prev.itens ? [...prev.itens] : [];
            const idx = itens.findIndex(i => i.idGrupoAdicionalItem === itemEdit.idGrupoAdicionalItem);
            if (idx >= 0) {
                itens[idx] = itemEdit;
            } else {
                itens.push(itemEdit);
            }
            return { ...prev, itens };
        });
        setItemEdit(null);
    };

    return (
        <BaseModal height={'80%'} width={'60%'} title={'Cadastro de Grupo Adicional'} isOpen={isOpen} setClose={() => setClose()}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.tabs}>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${tab === 'detalhes' ? styles.tabBtnActive : ''}`}
                            onClick={() => setTab('detalhes')}
                        >
                            Detalhes do grupo
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${tab === 'itens' ? styles.tabBtnActive : ''}`}
                            onClick={() => setTab('itens')}
                        >
                            Itens complementares ({grupo.itens?.length ?? 0})
                        </button>
                    </div>

                    {tab === 'detalhes' && (
                        <div className={styles.section}>
                            <div className={styles.row}>
                                {!!grupo.id && (
                                    <InputForm defaultValue={grupo.id} width={'10%'} title={'Cod'} readOnly errors={errors} inputName={'idExibicao'} register={register} />
                                )}
                                <SelectStatus width={'15%'} selected={grupo.status} setSelected={(v) => setGrupo({ ...grupo, status: v })} />
                                <InputForm defaultValue={grupo.descricao} width={isMobile ? '100%' : '75%'} title={'Nome do grupo de complementos'} errors={errors} inputName={'descricao'} register={register} />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field} style={{ width: isMobile ? '100%' : '30%' }}>
                                    <label className={styles.label}>Tipo</label>
                                    <select
                                        className={styles.select}
                                        value={grupo.tipo}
                                        onChange={(e) => setGrupo({ ...grupo, tipo: e.target.value as IGrupoAdicional['tipo'] })}
                                    >
                                        {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <p className={styles.hint}>Indique quantos complementos devem ser selecionados no pedido.</p>

                            <div className={styles.row}>
                                <InputForm defaultValue={grupo.minimo} width={'15%'} title={'Mínimo'} errors={errors} inputName={'minimo'} register={register} type="number" />
                                <InputForm defaultValue={grupo.maximo} width={'15%'} title={'Máximo'} errors={errors} inputName={'maximo'} register={register} type="number" />
                            </div>
                        </div>
                    )}

                    {tab === 'itens' && (
                        <div className={styles.section}>
                            {!itemEdit ? (
                                <>
                                    <div className={styles.itemsHeader}>
                                        <CustomButton onClick={handleNovoItem}>Adicionar item</CustomButton>
                                    </div>
                                    <div className={styles.itemsList}>
                                        {(grupo.itens ?? []).length === 0 && (
                                            <p className={styles.emptyItens}>Nenhum item cadastrado ainda.</p>
                                        )}
                                        {(grupo.itens ?? []).map((item) => (
                                            <div key={item.idGrupoAdicionalItem} className={styles.itemRow}>
                                                <div className={styles.itemInfo}>
                                                    <strong>{item.nome}</strong>
                                                    <span>{item.descricao}</span>
                                                </div>
                                                <div className={styles.itemValor}>
                                                    R$ {item.valor?.toFixed(2)}
                                                </div>
                                                <div className={styles.itemStatus}>
                                                    <span className={item.status ? styles.badgeAtivo : styles.badgeInativo}>
                                                        {item.status ? 'Disponível' : 'Indisponível'}
                                                    </span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button type="button" onClick={() => handleEditarItem(item)}>
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>
                                                    <button type="button" onClick={() => handleRemoverItem(item)}>
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.itemEditForm}>
                                    <div className={styles.row}>
                                        <div className={styles.field} style={{ width: isMobile ? '100%' : '70%' }}>
                                            <label className={styles.label}>Nome do complemento</label>
                                            <input
                                                className={styles.input}
                                                value={itemEdit.nome}
                                                onChange={(e) => setItemEdit({ ...itemEdit, nome: e.target.value })}
                                            />
                                        </div>
                                        <div className={styles.field} style={{ width: isMobile ? '100%' : '30%' }}>
                                            <label className={styles.label}>Preço único</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={styles.input}
                                                value={itemEdit.valor}
                                                onChange={(e) => setItemEdit({ ...itemEdit, valor: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.field} style={{ width: '100%' }}>
                                            <label className={styles.label}>Descrição</label>
                                            <textarea
                                                className={styles.textarea}
                                                value={itemEdit.descricao}
                                                onChange={(e) => setItemEdit({ ...itemEdit, descricao: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.field} style={{ width: isMobile ? '100%' : '60%' }}>
                                            <label className={styles.label}>Matéria Prima</label>
                                            <select
                                                className={styles.select}
                                                value={itemEdit.materiaPrimaId ?? 0}
                                                onChange={(e) => {
                                                    const mp = materiaPrimas.find(m => m.id === Number(e.target.value));
                                                    setItemEdit({
                                                        ...itemEdit,
                                                        materiaPrimaId: mp?.id ?? 0,
                                                        idMateriaPrima: mp?.idMateriaPrima ?? 0,
                                                    });
                                                }}
                                            >
                                                <option value={0}>Nenhuma</option>
                                                {materiaPrimas.map(mp => (
                                                    <option key={mp.id} value={mp.id}>{mp.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.field} style={{ width: isMobile ? '100%' : '20%' }}>
                                            <SelectStatus selected={itemEdit.status} setSelected={(v) => setItemEdit({ ...itemEdit, status: v })} />
                                        </div>
                                    </div>

                                    <div className={styles.button}>
                                        <CustomButton onClick={() => setItemEdit(null)} typeButton={'secondary'}>Cancelar</CustomButton>
                                        <CustomButton typeButton={'dark'} onClick={handleSalvarItem}>Salvar item</CustomButton>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!itemEdit && (
                        <div className={styles.button}>
                            <CustomButton onClick={() => setClose()} typeButton={'secondary'}>Cancelar</CustomButton>
                            <CustomButton typeButton={'dark'} loading={sending} onClick={() => handleSubmit(onSubmit)()}>Confirmar</CustomButton>
                        </div>
                    )}
                </div>
            )}
        </BaseModal>
    );
}