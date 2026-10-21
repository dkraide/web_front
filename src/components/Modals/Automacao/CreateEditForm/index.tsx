import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import IProduto from "@/interfaces/IProduto";
import IAutomacao, { IAutomacaoAcaoEstoque, IAutomacaoGatilhoEstoque } from "@/interfaces/IAutomacao";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import { SelectBase } from "@/components/Selects/SelectBase";
import SelectStatus from "@/components/Selects/SelectStatus";
import { isMobile } from "react-device-detect";

interface props {
    isOpen: boolean
    automacaoId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}

function parseJson<T>(json?: string): Partial<T> {
    if (!json) return {};
    try {
        return JSON.parse(json) as T;
    } catch {
        return {};
    }
}

export default function AutomacaoForm({ user, isOpen, automacaoId, setClose, color }: props) {
    const { register, handleSubmit, formState: { errors } } = useForm();

    const [automacao, setAutomacao] = useState<IAutomacao>({} as IAutomacao)
    const [produtos, setProdutos] = useState<IProduto[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);

    // ids de produto (nuvem) escolhidos nos selects
    const [produtoGatilho, setProdutoGatilho] = useState<string>('');
    const [produtoOrigem, setProdutoOrigem] = useState<string>('');
    const [produtoDestino, setProdutoDestino] = useState<string>('');

    const [gatilho, setGatilho] = useState<Partial<IAutomacaoGatilhoEstoque>>({});
    const [acao, setAcao] = useState<Partial<IAutomacaoAcaoEstoque>>({});

    useEffect(() => {
        async function load() {
            try {
                const prods = await api.get(`/Produto/List?EmpresaId=${user.empresaSelecionada}&status=true`)
                    .then(({ data }: AxiosResponse<IProduto[]>) => data);
                setProdutos(prods);

                if (automacaoId > 0) {
                    const { data } = await api.get(`/v2/Automacao/${automacaoId}`) as AxiosResponse<IAutomacao>;
                    const g = parseJson<IAutomacaoGatilhoEstoque>(data.gatilhoMetadata);
                    const a = parseJson<IAutomacaoAcaoEstoque>(data.acaoMetadata);
                    setGatilho(g);
                    setAcao(a);
                    setProdutoGatilho(g.produtoId ? g.produtoId.toString() : '');
                    setProdutoOrigem(a.produtoOrigemId ? a.produtoOrigemId.toString() : '');
                    setProdutoDestino(a.produtoDestinoId ? a.produtoDestinoId.toString() : '');
                    setAutomacao(data);
                } else {
                    setAutomacao({
                        id: 0,
                        status: true,
                        tipoGatilho: 'ESTOQUE',
                        tipoAcao: 'ESTOQUE',
                        ordem: 0,
                    } as unknown as IAutomacao);
                    setGatilho({ limite: 0 });
                    setAcao({ quantidadeOrigem: 1 });
                }
            } catch (err: any) {
                toast.error(`Erro ao buscar dados. ${err.message}`)
            }
            setLoading(false);
        }
        load();
    }, []);

    const produtosOptions = produtos.map(p => ({ value: p.id.toString(), label: `${p.cod} - ${p.nome}` }));
    const isGatilhoEstoque = automacao.tipoGatilho === 'ESTOQUE';

    const onSubmit = async (data: any) => {
        if (!data.nome || data.nome.trim().length < 3) {
            toast.error("Informe um nome com no mínimo 3 caracteres.");
            return;
        }

        let gatilhoJson = '';
        if (isGatilhoEstoque) {
            if (!produtoGatilho) {
                toast.error("Selecione o produto que dispara a automação.");
                return;
            }
            gatilhoJson = JSON.stringify({
                idProduto: 0, // id local: o PDV resolve a partir do produtoId
                produtoId: parseInt(produtoGatilho),
                limite: parseFloat(data.limite) || 0,
            });
        }

        const qtdOrigem = parseFloat(data.quantidadeOrigem) || 0;
        const qtdDestino = parseFloat(data.quantidadeDestino) || 0;
        if (!produtoOrigem || !produtoDestino) {
            toast.error("Selecione o produto de origem e o de destino do lançamento.");
            return;
        }
        if (produtoOrigem === produtoDestino) {
            toast.error("O produto de origem e o de destino precisam ser diferentes.");
            return;
        }
        if (qtdOrigem <= 0 || qtdDestino <= 0) {
            toast.error("As quantidades a baixar e a lançar precisam ser maiores que zero.");
            return;
        }

        const payload: IAutomacao = {
            ...automacao,
            nome: data.nome.trim(),
            tipoAcao: 'ESTOQUE',
            gatilhoMetadata: gatilhoJson,
            acaoMetadata: JSON.stringify({
                idProdutoOrigem: 0,
                produtoOrigemId: parseInt(produtoOrigem),
                quantidadeOrigem: qtdOrigem,
                idProdutoDestino: 0,
                produtoDestinoId: parseInt(produtoDestino),
                quantidadeDestino: qtdDestino,
            }),
            empresaId: user.empresaSelecionada,
        };

        setSending(true);
        api.post(`/v2/Automacao`, payload)
            .then(() => {
                toast.success(`Automação salva com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao salvar automação. ${err.response?.data || err.message}`);
            })
            .finally(() => setSending(false));
    }

    return (
        <BaseModal height={'90%'} width={isMobile ? '95%' : '70%'} color={color} title={'Cadastro de Automação'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    {!!automacao.id && <InputForm defaultValue={automacao.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"idReadonly"} register={register} />}

                    <InputForm defaultValue={automacao.nome} width={isMobile ? '100%' : '55%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                    <SelectStatus width={isMobile ? '100%' : '30%'} selected={automacao.status} setSelected={(v) => setAutomacao({ ...automacao, status: v })} />

                    <div className={styles.group}>
                        <label className={styles.groupTitle}>Quando (gatilho)</label>
                        <SelectBase title={'Evento'} selected={automacao.tipoGatilho}
                            datas={[
                                { value: 'ESTOQUE', label: 'Estoque do produto na venda' },
                                { value: 'VENDA_ERRO', label: 'Erro na venda' },
                                { value: 'VENDA_FINALIZADA', label: 'Venda finalizada' },
                            ]}
                            setSelected={(v) => setAutomacao({ ...automacao, tipoGatilho: v })} />
                        {isGatilhoEstoque && (
                            <div className={styles.row}>
                                <SelectBase width={isMobile ? '100%' : '64%'} title={'Quando o produto'} selected={produtoGatilho}
                                    datas={produtosOptions} setSelected={setProdutoGatilho} />
                                <InputForm defaultValue={gatilho.limite ?? 0} type={'number'} step={'0.001'} width={isMobile ? '100%' : '32%'}
                                    title={'Ficar com estoque até'} errors={errors} inputName={"limite"} register={register} />
                                <label className={styles.hint}>A automação roda quando a venda deixa o produto com estoque menor ou igual a este valor (0 = zerou).</label>
                            </div>
                        )}
                    </div>

                    <div className={styles.group}>
                        <label className={styles.groupTitle}>Então (ação)</label>
                        <SelectBase title={'Ação'} selected={'ESTOQUE'}
                            datas={[{ value: 'ESTOQUE', label: 'Lançar estoque (baixa um produto e dá entrada em outro)' }]}
                            setSelected={() => { }} />
                        <div className={styles.row}>
                            <SelectBase width={isMobile ? '100%' : '64%'} title={'Baixar do produto (ex.: garrafa)'} selected={produtoOrigem}
                                datas={produtosOptions} setSelected={setProdutoOrigem} />
                            <InputForm defaultValue={acao.quantidadeOrigem ?? 1} type={'number'} step={'0.001'} width={isMobile ? '100%' : '32%'}
                                title={'Quantidade a baixar'} errors={errors} inputName={"quantidadeOrigem"} register={register} />
                        </div>
                        <div className={styles.row}>
                            <SelectBase width={isMobile ? '100%' : '64%'} title={'Dar entrada no produto (ex.: dose)'} selected={produtoDestino}
                                datas={produtosOptions} setSelected={setProdutoDestino} />
                            <InputForm defaultValue={acao.quantidadeDestino} type={'number'} step={'0.001'} width={isMobile ? '100%' : '32%'}
                                title={'Quantidade a lançar'} errors={errors} inputName={"quantidadeDestino"} register={register} />
                        </div>
                    </div>

                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}
