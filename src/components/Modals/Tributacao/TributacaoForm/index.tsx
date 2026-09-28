import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm, InputGroup } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import { apiIBPT } from "@/services/apiIBPT";
import { fGetNumber, fGetOnlyNumber, validateString } from "@/utils/functions";
import ITributacao from "@/interfaces/ITributacao";
import ITributacaoUf from "@/interfaces/ITributacaoUf";
import SelectStatus from "@/components/Selects/SelectStatus";
import SelectICMS from "@/components/Selects/SelectICMS";
import SelectPISCofins from "@/components/Selects/SelectPISCofins";
import SelectOrigem from "@/components/Selects/SelectOrigem";
import SelectEstado from "@/components/Selects/SelectEstado";
import { isMobile } from "react-device-detect";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}

function novaUf(uf: string, empresaId: number): ITributacaoUf {
    return {
        id: 0,
        idTributacaoUf: 0,
        empresaId,
        uf,
        tributacaoId: 0,
        idTributacao: 0,
        cfop: '',
        cBenef: '',
        cstPis: 49,
        pPis: 0,
        pisVAliq: 0,
        cstCofins: 49,
        pCofins: 0,
        cofinsVAliq: 0,
        cstIcms: 102,
        pIcms: 0,
    };
}

export default function TributacaoForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [obj, setObj] = useState<ITributacao>({} as ITributacao)
    const [ufs, setUfs] = useState<ITributacaoUf[]>([])
    // 0 = aba Principal; 1..N = ufs[activeTab - 1]
    const [activeTab, setActiveTab] = useState<number>(0)
    const [showUfPicker, setShowUfPicker] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id > 0) {
            api.get(`/Tributacao/Select?id=${id}`)
                .then(({ data }: AxiosResponse<ITributacao>) => {
                    setObj(data);
                    // Carrega as tributacoes por UF ja cadastradas para esta tributacao
                    return api.get(`/v2/TributacaoUf/List/${user.empresaSelecionada}/${id}`);
                })
                .then((res?: AxiosResponse<ITributacaoUf[]>) => {
                    if (res?.data) setUfs(res.data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            obj.id = 0;
            obj.status = true;
            obj.cstOrigem = 0;
            obj.cstIcms = 102;
            obj.cstPis = 49;
            obj.cstCofins = 49;
            setObj(obj);
            setValue("cfop", 5405);
            setLoading(false);
        }

    }, []);

    async function getNCM() {
        setValue("descricao", "--")
        setValue("federal", "--")
        setValue("estadual", "--")
        setValue("municipal", "--")
        setValue("ex", "--")
        apiIBPT.get(`&codigo=${fGetOnlyNumber(getValues('ncm'))}`)
            .then(({ data }: AxiosResponse) => {
                setValue("descricao", data.Descricao)
                setValue("federal", data.Nacional?.toFixed(2) || "")
                setValue("estadual", data.Estadual?.toFixed(2) || "")
                setValue("municipal", data.Municipal?.toFixed(2) || "")
                setValue("ex", data.ex)
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao buscar NCM. ${err.response?.data}`);
                setValue("descricao", "")
                setValue("federal", "")
                setValue("estadual", "")
                setValue("municipal", "")
                setValue("ex", "")
            });
    }

    function updateUf(index: number, field: keyof ITributacaoUf, value: any) {
        setUfs(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u));
    }

    function adicionarUf(estado: any) {
        const sigla = (estado?.sigla || '').toString().toUpperCase();
        if (!sigla) return;
        if (ufs.some(u => (u.uf || '').toUpperCase() === sigla)) {
            toast.error(`Ja existe uma configuracao para a UF ${sigla}.`);
            return;
        }
        const novas = [...ufs, novaUf(sigla, user.empresaSelecionada)];
        setUfs(novas);
        setShowUfPicker(false);
        setActiveTab(novas.length); // foca na aba recem criada (indice = ufs.length)
    }

    function removerUf(index: number) {
        // Somente abas ainda nao salvas podem ser removidas aqui. A remocao de uma
        // UF ja persistida depende de um endpoint de exclusao (proximo passo).
        const alvo = ufs[index];
        if (alvo?.id > 0) {
            toast.info('Para excluir uma UF ja salva sera necessario o passo de exclusao no backend.');
            return;
        }
        const novas = ufs.filter((_, i) => i !== index);
        setUfs(novas);
        setActiveTab(0);
    }

    async function salvarUfs(tributacaoId: number) {
        for (const u of ufs) {
            const payload: ITributacaoUf = {
                ...u,
                empresaId: user.empresaSelecionada,
                tributacaoId: tributacaoId,
                pPis: fGetNumber(u.pPis as any),
                pisVAliq: fGetNumber(u.pisVAliq as any),
                pCofins: fGetNumber(u.pCofins as any),
                cofinsVAliq: fGetNumber(u.cofinsVAliq as any),
                pIcms: fGetNumber(u.pIcms as any),
            };
            if (payload.id > 0) {
                await api.put(`TributacaoUf/Update`, payload);
            } else {
                await api.post(`TributacaoUf/Create`, payload);
            }
        }
    }

    const onSubmit = async (data: any) => {
        setSending(true);
        obj.descricao = data.descricao;
        obj.cBenef = data.cBenef;
        obj.ncm = data.ncm;
        obj.cfop = data.cfop;
        obj.cest = data.cest;
        obj.federal = fGetNumber(data.federal);
        obj.estadual = fGetNumber(data.estadual);
        obj.municipal = fGetNumber(data.municipal);
        if (!validateString(obj.ncm, 8)) {
            toast.error('Informe um NCM válido!');
            setSending(false);
            return;
        }
        try {
            let tributacaoId = obj.id;
            if (obj.id > 0) {
                await api.put(`Tributacao/Update`, obj);
            } else {
                obj.empresaId = user.empresaSelecionada;
                const { data: resp }: AxiosResponse<any> = await api.post(`Tributacao/Create`, obj);
                if (resp?.res === false) {
                    throw new Error(resp?.msg || 'Erro ao criar Tributação');
                }
                tributacaoId = Number(resp?.msg) || 0;
                obj.id = tributacaoId;
            }

            await salvarUfs(tributacaoId);

            toast.success(`Tributação salva com sucesso!`);
            setClose(true);
        } catch (err: any) {
            const msg = err?.response?.data || err?.message || 'Erro desconhecido';
            toast.error(`Erro ao salvar Tributação. ${msg}`);
        } finally {
            setSending(false);
        }
    }

    const ufAtiva = activeTab > 0 ? ufs[activeTab - 1] : undefined;
    const ufIndex = activeTab - 1;

    return (
        <BaseModal height={'80%'} width={'80%'} color={color} title={'Cadastro de Tributação'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.wrapper}>
                    {/* Barra de abas */}
                    <div className={styles.tabBar}>
                        <div
                            className={`${styles.tab} ${activeTab === 0 ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(0)}
                        >
                            📄 Principal
                        </div>

                        {/* Abas por UF */}
                        {ufs.map((u, i) => (
                            <div
                                key={`${u.uf}-${i}`}
                                className={`${styles.tab} ${activeTab === i + 1 ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(i + 1)}
                            >
                                📍 {u.uf}
                                {u.id > 0 ? null : (
                                    <button
                                        type="button"
                                        className={styles.tabClose}
                                        onClick={(e) => { e.stopPropagation(); removerUf(i); }}
                                        title="Remover UF"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Botao Adicionar UF, sempre a direita */}
                        <div className={styles.addUf}>
                            {showUfPicker ? (
                                <div className={styles.ufPicker}>
                                    <SelectEstado selected={''} setSelected={adicionarUf} />
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.addBtn}
                                    onClick={() => setShowUfPicker(true)}
                                >
                                    ➕ Adicionar UF
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Conteudo das abas */}
                    <div className={styles.tabContent}>
                        {/* Principal (fica montada para preservar os valores do formulario) */}
                        <div className={styles.grid} style={{ display: activeTab === 0 ? 'flex' : 'none' }}>
                            <InputForm width={isMobile ? '100%' : '15%'} onBlur={() => { getNCM() }} defaultValue={obj.ncm} title={'NCM'} errors={errors} inputName={"ncm"} register={register} />
                            <InputForm width={isMobile ? '100%' : '70%'} defaultValue={obj.descricao} title={'Descrição'} errors={errors} inputName={"descricao"} register={register} />
                            <SelectStatus width={'15%'} selected={obj.status} setSelected={(v) => { setObj({ ...obj, status: v }) }} />
                            <InputForm width={'15%'} defaultValue={obj.cfop} title={'CFOP'} errors={errors} inputName={"cfop"} register={register} />
                            <InputForm width={'20%'} defaultValue={obj.cest} title={'CEST'} errors={errors} inputName={"cest"} register={register} />
                            <InputForm width={'20%'} defaultValue={obj.cBenef} title={'Cód Beneficio'} errors={errors} inputName={"cBenef"} register={register} />
                            <InputForm width={'15%'} defaultValue={obj.federal} title={'IBPT Federal'} errors={errors} inputName={"federal"} register={register} />
                            <InputForm width={'15%'} defaultValue={obj.estadual} title={'IBPT Estadual'} errors={errors} inputName={"estadual"} register={register} />
                            <InputForm width={'15%'} defaultValue={obj.municipal} title={'IBPT Municipal'} errors={errors} inputName={"municipal"} register={register} />
                            <SelectICMS width={'100%'} selected={obj.cstIcms} setSelected={(v) => { setObj({ ...obj, cstIcms: v }) }} />
                            <SelectPISCofins width={'100%'} title={'PIS'} selected={obj.cstCofins} setSelected={(v) => { setObj({ ...obj, cstCofins: v }) }} />
                            <SelectPISCofins width={'100%'} title={'COFINS'} selected={obj.cstPis} setSelected={(v) => { setObj({ ...obj, cstPis: v }) }} />
                            <SelectOrigem width={'100%'} selected={obj.cstOrigem} setSelected={(v) => { setObj({ ...obj, cstOrigem: v }) }} />
                        </div>

                        {/* Aba da UF ativa */}
                        {ufAtiva && (
                            <div className={styles.grid}>
                                <InputGroup width={'15%'} title={'UF'} value={ufAtiva.uf} disabled readOnly />
                                <InputGroup width={'20%'} title={'CFOP'} value={ufAtiva.cfop || ''} onChange={(e) => updateUf(ufIndex, 'cfop', e.target.value)} />
                                <InputGroup width={isMobile ? '100%' : '30%'} title={'Cód Beneficio'} value={ufAtiva.cBenef || ''} onChange={(e) => updateUf(ufIndex, 'cBenef', e.target.value)} />
                                <SelectICMS width={'100%'} selected={ufAtiva.cstIcms} setSelected={(v) => updateUf(ufIndex, 'cstIcms', v)} />
                                <InputGroup width={'30%'} title={'Alíquota ICMS (%)'} value={ufAtiva.pIcms} onChange={(e) => updateUf(ufIndex, 'pIcms', e.target.value)} />
                                <SelectPISCofins width={'100%'} title={'PIS'} selected={ufAtiva.cstPis} setSelected={(v) => updateUf(ufIndex, 'cstPis', v)} />
                                <InputGroup width={'30%'} title={'Alíquota PIS (%)'} value={ufAtiva.pPis} onChange={(e) => updateUf(ufIndex, 'pPis', e.target.value)} />
                                <InputGroup width={'30%'} title={'PIS Valor/Alíquota'} value={ufAtiva.pisVAliq} onChange={(e) => updateUf(ufIndex, 'pisVAliq', e.target.value)} />
                                <SelectPISCofins width={'100%'} title={'COFINS'} selected={ufAtiva.cstCofins} setSelected={(v) => updateUf(ufIndex, 'cstCofins', v)} />
                                <InputGroup width={'30%'} title={'Alíquota COFINS (%)'} value={ufAtiva.pCofins} onChange={(e) => updateUf(ufIndex, 'pCofins', e.target.value)} />
                                <InputGroup width={'30%'} title={'COFINS Valor/Alíquota'} value={ufAtiva.cofinsVAliq} onChange={(e) => updateUf(ufIndex, 'cofinsVAliq', e.target.value)} />
                            </div>
                        )}
                    </div>

                    {/* Botoes fora das abas */}
                    <div className={styles.footer}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}
