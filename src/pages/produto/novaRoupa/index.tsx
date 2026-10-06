import { Tab, Tabs } from 'react-bootstrap';
import { useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Switch from 'react-switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import styles from './styles.module.scss';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomButton from '@/components/ui/Buttons';
import Loading from '@/components/Loading';
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial';
import SelectTributacao from '@/components/Selects/SelectTributacao';
import { api } from '@/services/apiClient';
import { fGetNumber } from '@/utils/functions';
import { AuthContext } from '@/contexts/AuthContext';
import IProduto from '@/interfaces/IProduto';
import IUsuario from '@/interfaces/IUsuario';
import ICodBarras from '@/interfaces/ICodBarras';
import IGrupoAdicional from '@/interfaces/IGrupoAdicional';
import IProdutoGrupoAdicional from '@/interfaces/IProdutoGrupoAdicional';
import { IGrupoAdicionalItem } from '@/interfaces/IGrupoAdicionalItem';
import IProdutoImagem from '@/interfaces/IProdutoImagem';
import GradeEstoque from '@/components/Roupa/GradeEstoque';

// Uma roupa tem dois grupos: COR (nome + hex) e TAMANHO (nome + valor).
// Reaproveitamos o mesmo fluxo aninhado da pizza — o backend, ao ver
// tipo == 'ROUPA', persiste os grupos/itens junto e depois o vinculo N:N.
type TipoGrupoRoupa = 'COR' | 'TAMANHO';

const LIMITE_IMAGENS = 6;

// Imagem da galeria. Existente = tem id + localPath; nova = tem file + preview blob.
type RoupaImagem = {
    key: string;
    id?: number;
    localPath?: string;
    file?: File;
    preview: string;
};

const emptyItem = (empresaId: number): IGrupoAdicionalItem => ({
    id: uuidv4(),
    idGrupoAdicionalItem: '',
    idGrupoAdicional: 0,
    grupoAdicionalId: 0,
    materiaPrima: null as any,
    idMateriaPrima: 0,
    materiaPrimaId: 0,
    nome: '',
    descricao: '',
    valor: 0,
    qtdSabores: 0,
    status: true,
    precos: [],
    empresaId,
    lastChange: new Date(),
    needChange: true,
});

const emptyGrupo = (
    tipo: TipoGrupoRoupa,
    descricao: string,
    empresaId: number,
    itens: IGrupoAdicionalItem[] = [],
): IGrupoAdicional => ({
    keetaId: uuidv4(),
    idGrupoAdicional: 0,
    id: 0,
    empresaId,
    tipo,
    descricao,
    status: true,
    minimo: 1,
    maximo: 1,
    itens,
    lastChange: new Date(),
    needChange: true,
});

const novoVinculo = (grupo: IGrupoAdicional, empresaId: number): IProdutoGrupoAdicional => ({
    id: 0,
    idProdutoGrupoAdicional: 0,
    idProduto: 0,
    produtoId: 0,
    idGrupoAdicional: 0,
    grupoAdicionalId: 0,
    empresaId,
    lastChange: new Date(),
    needChange: true,
    grupoAdicional: grupo,
});

const gruposPadrao = (empresaId: number): IProdutoGrupoAdicional[] => [
    novoVinculo(emptyGrupo('COR', 'Cores', empresaId, []), empresaId),
    novoVinculo(emptyGrupo('TAMANHO', 'Tamanhos', empresaId, []), empresaId),
];

// Converte um File em base64 puro (sem o prefixo data:...;base64,), que o
// Newtonsoft do backend desserializa direto para byte[].
const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export default function NovaRoupa() {
    const [roupa, setRoupa] = useState<IProduto>();
    const [user, setUser] = useState<IUsuario>();
    const [saving, setSaving] = useState(false);

    // Galeria: novas imagens ficam em blob e sobem só depois de salvar o produto.
    const [imagens, setImagens] = useState<RoupaImagem[]>([]);
    // Ids de imagens existentes marcadas para apagar (aplicado no salvar).
    const [removidas, setRemovidas] = useState<number[]>([]);

    // Tamanho: valor único para todos ou um valor por tamanho.
    const [valorUnico, setValorUnico] = useState(true);
    const [valorUnicoValor, setValorUnicoValor] = useState(0);

    // Formulário de nova cor.
    const [corNome, setCorNome] = useState('');
    const [corHex, setCorHex] = useState('#ffffff');

    const [codigoBarras, setCodigoBarras] = useState('');

    // Aba ativa (controlada: apos cadastrar abrimos a aba Estoque) e contador p/ recarregar a grade.
    const [aba, setAba] = useState('item');
    const [gradeKey, setGradeKey] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { getUser } = useContext(AuthContext);
    const router = useRouter();
    const { id } = router.query;

    const isEdicao = !!roupa?.id && roupa.id > 0;

    const loadUser = async (): Promise<IUsuario> => {
        if (user) return user;
        const res = await getUser();
        setUser(res);
        return res;
    };

    const loadCod = async (empresaId: number): Promise<number> =>
        api
            .get(`/Produto/NextCod?EmpresaId=${empresaId}`)
            .then(({ data }: AxiosResponse<number>) => data)
            .catch((err) => {
                toast.error(`Erro ao buscar código. ${err.message}`);
                return 0;
            });

    // Garante que os grupos COR e TAMANHO existam (útil ao editar registros antigos).
    const garantirGrupos = (p: IProduto): IProduto => {
        (['COR', 'TAMANHO'] as TipoGrupoRoupa[]).forEach((tipo) => {
            const existe = p.grupoAdicionais?.some((v) => v.grupoAdicional?.tipo === tipo);
            if (!existe) {
                const padrao = gruposPadrao(p.empresaId).find((v) => v.grupoAdicional?.tipo === tipo)!;
                p.grupoAdicionais = [...(p.grupoAdicionais ?? []), padrao];
            }
        });
        return p;
    };

    const novaRoupa = async () => {
        const u = await loadUser();
        const cod = await loadCod(u.empresaSelecionada);
        const p: IProduto = {
            idProduto: 0,
            id: 0,
            nome: '',
            cod,
            tipo: 'ROUPA',
            status: true,
            visivelMenu: true,
            unidadeCompra: 'UN',
            quantidade: 0,
            valorCompra: 0,
            valor: 0,
            empresaId: u.empresaSelecionada,
            codBarras: [],
            grupoAdicionais: gruposPadrao(u.empresaSelecionada),
        } as IProduto;
        setRoupa(p);
    };

    const carregarRoupa = async (roupaId: number) => {
        const u = await loadUser();
        try {
            const { data } = await api.get<IProduto>(`/v2/Produto/${roupaId}?EmpresaId=${u.empresaSelecionada}`);
            const p = garantirGrupos(data);
            setRoupa(p);

            // Deriva o switch de valor único a partir dos tamanhos já cadastrados.
            const tamanhos = p.grupoAdicionais?.find((v) => v.grupoAdicional?.tipo === 'TAMANHO')?.grupoAdicional?.itens ?? [];
            if (tamanhos.length > 0) {
                const todosIguais = tamanhos.every((t) => t.valor === tamanhos[0].valor);
                setValorUnico(todosIguais);
                setValorUnicoValor(todosIguais ? tamanhos[0].valor : 0);
            }

            // Carrega a galeria de imagens.
            const { data: imgs } = await api.get<IProdutoImagem[]>(`/Produto/${roupaId}/imagem`);
            setImagens(
                (imgs ?? []).map((i) => ({
                    key: `srv-${i.id}`,
                    id: i.id,
                    localPath: i.localPath,
                    preview: i.localPath,
                })),
            );
        } catch (err) {
            const e = err as AxiosError;
            toast.error(`Erro ao carregar roupa. ${e.response?.data || e.message}`);
        }
    };

    useEffect(() => {
        if (!router.isReady) return;
        if (id) carregarRoupa(fGetNumber(id as string));
        else novaRoupa();
    }, [router.isReady]);

    // Limpa os object URLs das imagens novas ao desmontar.
    useEffect(() => {
        return () => {
            imagens.forEach((i) => {
                if (i.file) URL.revokeObjectURL(i.preview);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── grupos (COR / TAMANHO) ───────────────────────────────
    const getGrupo = (tipo: TipoGrupoRoupa): IGrupoAdicional | undefined =>
        roupa?.grupoAdicionais?.find((v) => v.grupoAdicional?.tipo === tipo)?.grupoAdicional;

    const getItems = (tipo: TipoGrupoRoupa): IGrupoAdicionalItem[] => getGrupo(tipo)?.itens ?? [];

    const setItens = (tipo: TipoGrupoRoupa, itens: IGrupoAdicionalItem[]) => {
        setRoupa((prev) => {
            if (!prev) return prev;
            const grupoAdicionais = prev.grupoAdicionais.map((v) =>
                v.grupoAdicional?.tipo === tipo
                    ? { ...v, grupoAdicional: { ...v.grupoAdicional!, itens } }
                    : v,
            );
            return { ...prev, grupoAdicionais };
        });
    };

    // ── cores ────────────────────────────────────────────────
    const addCor = () => {
        const nome = corNome.trim();
        if (!nome) {
            toast.warn('Informe o nome da cor.');
            return;
        }
        if (!roupa) return;
        const item = { ...emptyItem(roupa.empresaId), nome, descricao: corHex };
        setItens('COR', [...getItems('COR'), item]);
        setCorNome('');
        setCorHex('#ffffff');
    };

    const removeCor = (itemId: string) =>
        setItens('COR', getItems('COR').filter((c) => c.id !== itemId));

    // ── tamanhos ─────────────────────────────────────────────
    const addTamanho = () => {
        if (!roupa) return;
        const novo = { ...emptyItem(roupa.empresaId), nome: '', valor: valorUnico ? valorUnicoValor : 0 };
        setItens('TAMANHO', [...getItems('TAMANHO'), novo]);
    };

    const onChangeTamanho = (itemId: string, field: 'nome' | 'valor', value: string | number) =>
        setItens(
            'TAMANHO',
            getItems('TAMANHO').map((it) => (it.id === itemId ? { ...it, [field]: value } : it)),
        );

    const removeTamanho = (itemId: string) =>
        setItens('TAMANHO', getItems('TAMANHO').filter((t) => t.id !== itemId));

    // ── imagens ──────────────────────────────────────────────
    const onPickImage = () => fileInputRef.current?.click();

    const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // permite re-selecionar o mesmo arquivo
        if (!file) return;
        if (imagens.length >= LIMITE_IMAGENS) {
            toast.warn(`Máximo de ${LIMITE_IMAGENS} imagens.`);
            return;
        }
        const preview = URL.createObjectURL(file);
        setImagens((prev) => [...prev, { key: uuidv4(), file, preview }]);
    };

    const removeImagem = (img: RoupaImagem) => {
        if (img.id) setRemovidas((prev) => [...prev, img.id!]); // existente: apaga no salvar
        if (img.file) URL.revokeObjectURL(img.preview);
        setImagens((prev) => prev.filter((i) => i.key !== img.key));
    };

    // ── validação ────────────────────────────────────────────
    const validar = (): string | null => {
        if (!roupa) return 'Roupa não carregada';
        if (!roupa.nome || roupa.nome.trim().length < 2) return 'Informe o nome da roupa.';
        if (!roupa.classeMaterialId) return 'Selecione um grupo (classe de material).';
        const tamanhos = getItems('TAMANHO');
        if (tamanhos.length === 0) return 'Cadastre ao menos um tamanho.';
        if (tamanhos.some((t) => !t.nome || t.nome.trim().length === 0)) return 'Existe tamanho sem nome.';
        if (valorUnico && valorUnicoValor <= 0) return 'Informe o valor de venda.';
        if (!valorUnico && tamanhos.some((t) => (t.valor ?? 0) <= 0)) return 'Existe tamanho sem valor.';
        return null;
    };

    // ── salvar ───────────────────────────────────────────────
    const onSubmit = async () => {
        const erro = validar();
        if (erro) {
            toast.error(erro);
            return;
        }
        if (!roupa || !user) return;

        setSaving(true);
        try {
            const empresaId = user.empresaSelecionada;

            // Aplica o valor único (ou mantém os individuais) nos tamanhos.
            const tamItens = getItems('TAMANHO').map((t) => ({
                ...t,
                valor: valorUnico ? valorUnicoValor : t.valor,
            }));
            const precoBase = valorUnico ? valorUnicoValor : (tamItens[0]?.valor ?? 0);

            const grupos = (roupa.grupoAdicionais ?? []).map((v) => {
                const g = v.grupoAdicional!;
                const itens = g.tipo === 'TAMANHO' ? tamItens : g.itens;
                return { ...v, empresaId, grupoAdicional: { ...g, empresaId, itens } };
            });

            const payload: IProduto = {
                ...roupa,
                tipo: 'ROUPA',
                empresaId,
                valor: precoBase,
                // O estoque e controlado por variante (aba Estoque); nunca enviar estoque inicial aqui.
                quantidade: isEdicao ? roupa.quantidade : 0,
                classeMaterial: undefined as any,
                tributacao: undefined as any,
                grupoAdicionais: grupos,
            };

            // 1) Salva o produto. No create, se houver estoque o backend gera o
            // lançamento automaticamente. No update, quantidade é ignorada.
            let produtoId = roupa.id;
            if (!isEdicao) {
                const { data } = await api.post<IProduto>(`/v2/Produto?EmpresaId=${empresaId}`, payload);
                produtoId = data.id;
            } else {
                await api.put(`/v2/Produto?EmpresaId=${empresaId}`, payload);
            }

            // 2) Sobe as imagens novas (posicao 0 = backend anexa no fim da galeria).
            for (const img of imagens) {
                if (!img.file) continue;
                const base64 = await fileToBase64(img.file);
                await api.post(`/Produto/${produtoId}/imagem`, { imagem: base64, posicao: 0 });
            }

            // 3) Apaga as imagens existentes que foram removidas.
            for (const imagemId of removidas) {
                await api.delete(`/Produto/${produtoId}/imagem/${imagemId}`).catch(() => null);
            }

            if (!isEdicao) {
                // Recem-cadastrada: as variantes ja foram geradas; abre a aba Estoque para informar as quantidades.
                toast.success('Roupa cadastrada! Informe o estoque de cada variante.');
                await carregarRoupa(produtoId);
                router.replace({ pathname: router.pathname, query: { id: produtoId } }, undefined, { shallow: true });
                setGradeKey((k) => k + 1);
                setAba('estoque');
            } else {
                toast.success('Roupa atualizada com sucesso!');
                router.push('/produto');
            }
        } catch (err) {
            const e = err as AxiosError;
            toast.error(`Erro ao salvar roupa. ${e.response?.data || e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!roupa) return <Loading />;

    const cores = getItems('COR');
    const tamanhos = getItems('TAMANHO');

    return (
        <div className={styles.container}>
            {saving && (
                <div className={styles.overlay}>
                    <div className={styles.spinner} />
                    <span className={styles.overlayText}>Cadastrando...</span>
                </div>
            )}

            <div className={styles.tabs}>
                <h3>{isEdicao ? 'Editar Roupa' : 'Nova Roupa'}</h3>
                <Tabs activeKey={aba} onSelect={(k) => setAba(k || 'item')} id="roupa-tabs" variant="underline" fill>
                    {/* ── Aba Item ───────────────────────────────────── */}
                    <Tab eventKey="item" title="Item">
                        <div className={styles.contentTab}>
                            {/* Carrossel de imagens */}
                            <div className={styles.carrossel}>
                                {imagens.map((img) => (
                                    <div className={styles.imgCard} key={img.key}>
                                        <img
                                            src={img.preview}
                                            onError={(e) => { e.currentTarget.src = '/nopic.png'; }}
                                            alt="imagem da roupa"
                                        />
                                        <button
                                            type="button"
                                            className={styles.removeImg}
                                            onClick={() => removeImagem(img)}
                                            title="Remover imagem"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ))}
                                {imagens.length < LIMITE_IMAGENS && (
                                    <button type="button" className={styles.addImg} onClick={onPickImage}>
                                        <FontAwesomeIcon icon={faPlus} />
                                        Adicionar imagem
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    style={{ display: 'none' }}
                                    onChange={onImageSelected}
                                />
                            </div>

                            {/* Informações */}
                            <div className={styles.row}>
                                <InputGroup
                                    width="12%"
                                    title="Cod"
                                    value={roupa.cod}
                                    onChange={(v) => setRoupa({ ...roupa, cod: fGetNumber(v.currentTarget.value) })}
                                />
                                <InputGroup
                                    width="60%"
                                    title="Nome"
                                    value={roupa.nome}
                                    onChange={(v) => setRoupa({ ...roupa, nome: v.currentTarget.value })}
                                />
                                <div className={styles.statusCell}>
                                    <label style={{ marginRight: 8 }}>Ativo</label>
                                    <Switch
                                        onColor="#fc4f6b"
                                        checked={roupa.status}
                                        onChange={(e) => setRoupa({ ...roupa, status: e })}
                                    />
                                </div>
                                <div className={styles.statusCell}>
                                    <label style={{ marginRight: 8 }}>Visível no site</label>
                                    <Switch
                                        onColor="#fc4f6b"
                                        checked={!!roupa.visivelMenu}
                                        onChange={(e) => setRoupa({ ...roupa, visivelMenu: e })}
                                    />
                                </div>
                            </div>

                            <div className={styles.row}>
                                <InputGroup
                                    width="100%"
                                    title="Descrição"
                                    value={roupa.descricao ?? ''}
                                    onChange={(v) => setRoupa({ ...roupa, descricao: v.currentTarget.value })}
                                />
                            </div>

                            <div className={styles.row}>
                                <SelectClasseMaterial
                                    width="45%"
                                    selected={roupa.classeMaterialId}
                                    setSelected={(v) => v && setRoupa({ ...roupa, classeMaterialId: v.id, idClasseMaterial: v.idClasseMaterial })}
                                />
                                <SelectTributacao
                                    width="45%"
                                    selected={roupa.tributacaoId}
                                    setSelected={(v) => setRoupa({ ...roupa, tributacaoId: v.id, idTributacao: v.idTributacao })}
                                />
                            </div>

                            <div className={styles.row}>
                                <InputGroup
                                    type="number"
                                    width="30%"
                                    title="Custo unitário (R$)"
                                    value={roupa.valorCompra}
                                    onChange={(v) => setRoupa({ ...roupa, valorCompra: fGetNumber(v.currentTarget.value) })}
                                />
                                <span style={{ color: '#64748b', fontSize: 13, alignSelf: 'center' }}>
                                    O estoque é controlado por cor e tamanho, na aba “Estoque”.
                                </span>
                            </div>

                            {/* Códigos de barras */}
                            <div className={styles.sectionTitle}>Códigos de barras</div>
                            <div className={styles.row}>
                                <InputGroup
                                    width="30%"
                                    title="Adicionar código de barras"
                                    value={codigoBarras}
                                    onChange={(v) => setCodigoBarras(v.currentTarget.value)}
                                />
                                <CustomButton
                                    typeButton="main"
                                    style={{ height: 40, marginTop: 8 }}
                                    onClick={() => {
                                        const codigo = fGetNumber(codigoBarras);
                                        if (!codigo) return;
                                        const novo: ICodBarras = {
                                            id: 0,
                                            idCodBarras: 0,
                                            idProduto: roupa.idProduto,
                                            produtoId: roupa.id,
                                            codigo,
                                            empresaId: roupa.empresaId,
                                        };
                                        setRoupa({ ...roupa, codBarras: [...(roupa.codBarras ?? []), novo] });
                                        setCodigoBarras('');
                                    }}
                                >
                                    Adicionar
                                </CustomButton>
                            </div>
                            {(roupa.codBarras ?? []).map((c, i) => (
                                <div className={styles.row} key={`${c.codigo}-${i}`}>
                                    <InputGroup width="30%" title="" value={c.codigo} readOnly disabled />
                                    <CustomButton
                                        typeButton="outline-main"
                                        style={{ height: 40, width: 40 }}
                                        onClick={() =>
                                            setRoupa({
                                                ...roupa,
                                                codBarras: (roupa.codBarras ?? []).filter((_, idx) => idx !== i),
                                            })
                                        }
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </CustomButton>
                                </div>
                            ))}
                        </div>
                    </Tab>

                    {/* ── Aba Modelos ────────────────────────────────── */}
                    <Tab eventKey="modelos" title="Modelos">
                        <div className={styles.contentTab}>
                            {/* Cores */}
                            <div className={styles.sectionTitle}>Cores</div>
                            <div className={styles.corForm}>
                                <InputGroup
                                    width="220px"
                                    title="Nome da cor"
                                    value={corNome}
                                    onChange={(v) => setCorNome(v.currentTarget.value)}
                                />
                                <input
                                    type="color"
                                    className={styles.colorPicker}
                                    value={corHex}
                                    onChange={(v) => setCorHex(v.currentTarget.value)}
                                    title="Escolha a cor"
                                />
                                <CustomButton typeButton="main" style={{ height: 40 }} onClick={addCor}>
                                    Adicionar cor
                                </CustomButton>
                            </div>
                            <div className={styles.corChips}>
                                {cores.length === 0 && <span style={{ color: '#999' }}>Nenhuma cor cadastrada.</span>}
                                {cores.map((c) => (
                                    <div className={styles.corChip} key={c.id}>
                                        <span className={styles.corBola} style={{ backgroundColor: c.descricao || '#fff' }} />
                                        <span className={styles.corNome}>{c.nome}</span>
                                        <span className={styles.corHex}>{c.descricao}</span>
                                        <button type="button" className={styles.chipRemove} onClick={() => removeCor(c.id)} title="Remover cor">
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Tamanhos */}
                            <div className={styles.sectionTitle} style={{ marginTop: 24 }}>Tamanhos</div>
                            <div className={styles.row}>
                                <div className={styles.statusCell}>
                                    <label style={{ marginRight: 8 }}>Mesmo valor para todos os tamanhos?</label>
                                    <Switch onColor="#fc4f6b" checked={valorUnico} onChange={setValorUnico} />
                                </div>
                                {valorUnico && (
                                    <InputGroup
                                        type="number"
                                        width="25%"
                                        title="Valor de venda (R$)"
                                        value={valorUnicoValor}
                                        onChange={(v) => setValorUnicoValor(fGetNumber(v.currentTarget.value))}
                                    />
                                )}
                            </div>

                            {tamanhos.map((t) => (
                                <div className={styles.row} key={t.id}>
                                    <InputGroup
                                        width="45%"
                                        title="Nome do tamanho"
                                        value={t.nome}
                                        onChange={(e) => onChangeTamanho(t.id, 'nome', e.currentTarget.value)}
                                    />
                                    {!valorUnico && (
                                        <InputGroup
                                            type="number"
                                            width="25%"
                                            title="Valor (R$)"
                                            value={t.valor}
                                            onChange={(e) => onChangeTamanho(t.id, 'valor', fGetNumber(e.currentTarget.value))}
                                        />
                                    )}
                                    <CustomButton
                                        typeButton="outline-main"
                                        style={{ marginLeft: 10, height: 40, width: 40 }}
                                        onClick={() => removeTamanho(t.id)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </CustomButton>
                                </div>
                            ))}
                            <CustomButton onClick={addTamanho} style={{ width: '300px', marginTop: 12 }} typeButton="main">
                                Adicionar Tamanho
                            </CustomButton>
                        </div>
                    </Tab>

                    {/* ── Aba Estoque (variantes cor x tamanho) ──────── */}
                    {isEdicao && (
                        <Tab eventKey="estoque" title="Estoque">
                            <div className={styles.contentTab}>
                                <GradeEstoque produtoId={roupa.id} recarregar={gradeKey} />
                            </div>
                        </Tab>
                    )}
                </Tabs>
            </div>

            <div className={styles.buttons}>
                <CustomButton onClick={onSubmit} loading={saving}>
                    {isEdicao ? 'Salvar' : 'Cadastrar'}
                </CustomButton>
            </div>
        </div>
    );
}
