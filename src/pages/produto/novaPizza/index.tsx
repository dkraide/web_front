import { Tab, Tabs } from 'react-bootstrap';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import { InputGroup } from '@/components/ui/InputGroup';
import { v4 as uuidv4 } from 'uuid';
import IProduto from '@/interfaces/IProduto';
import IProdutoGrupoAdicional from '@/interfaces/IProdutoGrupoAdicional';
import IGrupoAdicional from '@/interfaces/IGrupoAdicional';
import { IGrupoAdicionalItem, IGrupoAdicionalItemPreco } from '@/interfaces/IGrupoAdicionalItem';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Switch from 'react-switch';
import { fGetNumber } from '@/utils/functions';
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial';
import SelectTributacao from '@/components/Selects/SelectTributacao';
import { SelectBase } from '@/components/Selects/SelectBase';
import { api } from '@/services/apiClient';
import IUsuario from '@/interfaces/IUsuario';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import Loading from '@/components/Loading';

// Os 4 grupos que uma pizza sempre possui. Nesta tela o usuario faz apenas
// CRUD dos ITENS de cada um desses grupos (o vinculo N:N pizza<->grupo e o
// proprio grupo sao criados/atualizados junto no salvamento).
type TipoGrupo = 'MASSA' | 'TAMANHO' | 'BORDA' | 'SABOR';

const emptyItem = (empresaId: number): IGrupoAdicionalItem => ({
    id: '',
    idGrupoAdicionalItem: uuidv4(),
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
    tipo: TipoGrupo,
    descricao: string,
    minimo: number,
    maximo: number,
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
    minimo,
    maximo,
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

// Grupos padrao de uma pizza nova (espelha frmCadastroPizza do PDV).
const gruposPadrao = (empresaId: number): IProdutoGrupoAdicional[] => {
    const massa = emptyGrupo('MASSA', 'Massas', 1, 1, empresaId, [
        { ...emptyItem(empresaId), nome: 'Tradicional' },
    ]);
    const tamanho = emptyGrupo('TAMANHO', 'Tamanhos', 1, 1, empresaId, [
        { ...emptyItem(empresaId), nome: 'Pequeno (4 Pedaços)', qtdSabores: 1 },
        { ...emptyItem(empresaId), nome: 'Média (6 Pedaços)', qtdSabores: 2 },
        { ...emptyItem(empresaId), nome: 'Grande (8 Pedaços)', qtdSabores: 2 },
    ]);
    const borda = emptyGrupo('BORDA', 'Bordas', 1, 1, empresaId, [
        { ...emptyItem(empresaId), nome: 'Sem Borda' },
    ]);
    const sabor = emptyGrupo('SABOR', 'Sabores', 1, 2, empresaId, []);
    // Pizza meio-a-meio: por padrão divide o preço pela qtd de sabores (média),
    // preservando o comportamento histórico. O usuário troca na aba de sabores.
    sabor.baseCalculo = 'MEDIA';

    return [
        novoVinculo(massa, empresaId),
        novoVinculo(tamanho, empresaId),
        novoVinculo(borda, empresaId),
        novoVinculo(sabor, empresaId),
    ];
};

export default function NovaPizza() {
    const [pizza, setPizza] = useState<IProduto>();
    const [user, setUser] = useState<IUsuario>();
    const [saving, setSaving] = useState(false);
    const { getUser } = useContext(AuthContext);
    const router = useRouter();
    const { id } = router.query;

    const loadUser = async (): Promise<IUsuario> => {
        if (user) return user;
        const res = await getUser();
        setUser(res);
        return res;
    };

    const loadCod = async (empresaId: number): Promise<number> => {
        return api
            .get(`/Produto/NextCod?EmpresaId=${empresaId}`)
            .then(({ data }: AxiosResponse<number>) => data)
            .catch((err) => {
                toast.error(`Erro ao buscar código. ${err.message}`);
                return 0;
            });
    };

    // Garante que os 4 grupos existam no vinculo (util ao editar pizzas antigas).
    const garantirGrupos = (p: IProduto): IProduto => {
        const empresaId = p.empresaId;
        (['MASSA', 'TAMANHO', 'BORDA', 'SABOR'] as TipoGrupo[]).forEach((tipo) => {
            const existe = p.grupoAdicionais?.some((v) => v.grupoAdicional?.tipo === tipo);
            if (!existe) {
                const padrao = gruposPadrao(empresaId).find((v) => v.grupoAdicional?.tipo === tipo)!;
                p.grupoAdicionais = [...(p.grupoAdicionais ?? []), padrao];
            }
        });
        // Registros antigos podem vir sem baseCalculo no grupo SABOR — assume
        // MEDIA (comportamento histórico) pra o seletor e o payload não ficarem vazios.
        p.grupoAdicionais = (p.grupoAdicionais ?? []).map((v) =>
            v.grupoAdicional?.tipo === 'SABOR' && !v.grupoAdicional.baseCalculo
                ? { ...v, grupoAdicional: { ...v.grupoAdicional, baseCalculo: 'MEDIA' as const } }
                : v,
        );
        return p;
    };

    const novaPizza = async () => {
        const u = await loadUser();
        const cod = await loadCod(u.empresaSelecionada);
        const p: IProduto = {
            idProduto: 0,
            id: 0,
            nome: 'Pizza Salgada',
            cod,
            tipo: 'PIZZA',
            status: true,
            empresaId: u.empresaSelecionada,
            grupoAdicionais: gruposPadrao(u.empresaSelecionada),
        } as IProduto;
        setPizza(p);
    };

    const carregarPizza = async (pizzaId: number) => {
        const u = await loadUser();
        api.get(`/v2/Produto/${pizzaId}?EmpresaId=${u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse<IProduto>) => {
                setPizza(garantirGrupos(data));
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao carregar pizza. ${err.response?.data || err.message}`);
            });
    };

    useEffect(() => {
        if (!router.isReady) return;
        if (id) {
            carregarPizza(fGetNumber(id as string));
        } else {
            novaPizza();
        }
    }, [router.isReady]);

    // ── acesso aos grupos ────────────────────────────────────
    const getVinculo = (tipo: TipoGrupo) =>
        pizza?.grupoAdicionais?.find((v) => v.grupoAdicional?.tipo === tipo);

    const getGrupo = (tipo: TipoGrupo): IGrupoAdicional | undefined => getVinculo(tipo)?.grupoAdicional;

    const getItems = (tipo: TipoGrupo): IGrupoAdicionalItem[] => getGrupo(tipo)?.itens ?? [];

    // Atualiza o grupo de um tipo aplicando um "mutator" imutavel.
    const updateGrupo = (tipo: TipoGrupo, fn: (g: IGrupoAdicional) => IGrupoAdicional) => {
        setPizza((prev) => {
            if (!prev) return prev;
            const grupoAdicionais = prev.grupoAdicionais.map((v) =>
                v.grupoAdicional?.tipo === tipo
                    ? { ...v, grupoAdicional: fn(v.grupoAdicional!) }
                    : v,
            );
            return { ...prev, grupoAdicionais };
        });
    };

    const setItens = (tipo: TipoGrupo, itens: IGrupoAdicionalItem[]) =>
        updateGrupo(tipo, (g) => ({ ...g, itens }));

    // ── itens: alteracao de campo ────────────────────────────
    const onChangeItem = (
        tipo: TipoGrupo,
        itemId: string,
        field: keyof IGrupoAdicionalItem,
        value: string | number | boolean,
    ) => {
        setItens(
            tipo,
            getItems(tipo).map((it) =>
                it.idGrupoAdicionalItem === itemId ? { ...it, [field]: value } : it,
            ),
        );
    };

    const removeItem = (tipo: TipoGrupo, itemId: string) => {
        setItens(
            tipo,
            getItems(tipo).filter((it) => it.idGrupoAdicionalItem !== itemId),
        );
        // Ao remover um tamanho, tira os precos correspondentes de cada sabor.
        if (tipo === 'TAMANHO') {
            updateGrupo('SABOR', (g) => ({
                ...g,
                itens: (g.itens ?? []).map((sabor) => ({
                    ...sabor,
                    precos: (sabor.precos ?? []).filter(
                        (p) => p.idGrupoAdicionalItemRelacao !== itemId,
                    ),
                })),
            }));
        }
    };

    // ── tamanho ──────────────────────────────────────────────
    const novoTamanho = () => {
        if (!pizza) return;
        const novo = { ...emptyItem(pizza.empresaId), nome: '' };
        setItens('TAMANHO', [...getItems('TAMANHO'), novo]);
        // Cada sabor existente ganha um preco (0) para o novo tamanho.
        updateGrupo('SABOR', (g) => ({
            ...g,
            itens: (g.itens ?? []).map((sabor) => ({
                ...sabor,
                precos: [...(sabor.precos ?? []), novoPreco(pizza.empresaId, sabor.idGrupoAdicionalItem, novo.idGrupoAdicionalItem)],
            })),
        }));
    };

    // ── sabor ────────────────────────────────────────────────
    const novoPreco = (
        empresaId: number,
        saborItemId: string,
        tamanhoItemId: string,
    ): IGrupoAdicionalItemPreco => ({
        id: '',
        idGrupoAdicionalItemPreco: uuidv4(),
        idGrupoAdicionalItem: saborItemId,
        grupoAdicionalItemId: '',
        idGrupoAdicionalItemRelacao: tamanhoItemId,
        grupoAdicionalItemRelacaoId: '',
        valor: 0,
        lastChange: new Date(),
        needChange: true,
        empresaId,
    });

    const novoSabor = () => {
        if (!pizza) return;
        const tamanhos = getItems('TAMANHO');
        if (tamanhos.length === 0) {
            toast.error('Cadastre ao menos um tamanho antes de criar sabores.');
            return;
        }
        const sabor = { ...emptyItem(pizza.empresaId), nome: '' };
        sabor.precos = tamanhos.map((t) =>
            novoPreco(pizza.empresaId, sabor.idGrupoAdicionalItem, t.idGrupoAdicionalItem),
        );
        setItens('SABOR', [...getItems('SABOR'), sabor]);
    };

    const getPreco = (sabor: IGrupoAdicionalItem, tamanhoItemId: string): number => {
        const p = sabor.precos?.find((x) => x.idGrupoAdicionalItemRelacao === tamanhoItemId);
        return p?.valor ?? 0;
    };

    const onChangePreco = (saborItemId: string, tamanhoItemId: string, valor: number) => {
        updateGrupo('SABOR', (g) => ({
            ...g,
            itens: (g.itens ?? []).map((sabor) => {
                if (sabor.idGrupoAdicionalItem !== saborItemId) return sabor;
                const existe = sabor.precos?.some((p) => p.idGrupoAdicionalItemRelacao === tamanhoItemId);
                const precos = existe
                    ? sabor.precos.map((p) =>
                          p.idGrupoAdicionalItemRelacao === tamanhoItemId ? { ...p, valor } : p,
                      )
                    : [
                          ...(sabor.precos ?? []),
                          { ...novoPreco(g.empresaId, saborItemId, tamanhoItemId), valor },
                      ];
                return { ...sabor, precos };
            }),
        }));
    };

    // ── validacao ────────────────────────────────────────────
    const validar = (): string | null => {
        if (!pizza) return 'Pizza não carregada';
        if (!pizza.nome || pizza.nome.trim().length < 2) return 'Informe o nome da pizza.';
        if (!pizza.classeMaterialId) return 'Selecione uma classe de material.';

        const tamanhos = getItems('TAMANHO');
        if (tamanhos.length === 0) return 'Cadastre ao menos um tamanho.';

        const sabores = getItems('SABOR');
        if (sabores.length === 0) return 'Cadastre ao menos um sabor.';

        for (const sabor of sabores) {
            if (!sabor.nome || sabor.nome.trim().length === 0)
                return 'Existe sabor sem nome.';
            for (const t of tamanhos) {
                const preco = sabor.precos?.find((p) => p.idGrupoAdicionalItemRelacao === t.idGrupoAdicionalItem);
                if (!preco || preco.valor <= 0)
                    return `Sabor "${sabor.nome}" sem preço para o tamanho "${t.nome}".`;
            }
        }
        return null;
    };

    // ── salvar ───────────────────────────────────────────────
    const onSubmit = async () => {
        const erro = validar();
        if (erro) {
            toast.error(erro);
            return;
        }
        if (!pizza || !user) return;

        setSaving(true);
        try {
            const empresaId = user.empresaSelecionada;

            // O backend (ProdutoService) grava a pizza completa numa unica operacao:
            // quando tipo == PIZZA persiste tambem os grupos, itens e precos e depois
            // o vinculo N:N. Basta enviar o objeto aninhado.
            const payload: IProduto = {
                ...pizza,
                tipo: 'PIZZA',
                empresaId,
                classeMaterial: undefined as any,
                tributacao: undefined as any,
                grupoAdicionais: pizza.grupoAdicionais.map((v) => ({
                    ...v,
                    empresaId,
                    grupoAdicional: v.grupoAdicional
                        ? { ...v.grupoAdicional, empresaId }
                        : v.grupoAdicional,
                })),
            };

            if (!pizza.id || pizza.id <= 0) {
                await api.post(`/v2/Produto?EmpresaId=${empresaId}`, payload);
            } else {
                await api.put(`/v2/Produto?EmpresaId=${empresaId}`, payload);
            }

            toast.success('Pizza salva com sucesso!');
            router.push('/produto');
        } catch (err) {
            const e = err as AxiosError;
            toast.error(`Erro ao salvar pizza. ${e.response?.data || e.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── linhas de item ───────────────────────────────────────
    const LinhaTamanho = (item: IGrupoAdicionalItem, canRemove: boolean) => (
        <div className={styles.row} key={item.idGrupoAdicionalItem}>
            <InputGroup
                width="45%"
                title="Nome do tamanho"
                value={item.nome}
                onChange={(e) => onChangeItem('TAMANHO', item.idGrupoAdicionalItem, 'nome', e.currentTarget.value)}
            />
            <InputGroup
                type="number"
                width="25%"
                title="Qtd. sabores"
                value={item.qtdSabores ?? 0}
                onChange={(e) => onChangeItem('TAMANHO', item.idGrupoAdicionalItem, 'qtdSabores', fGetNumber(e.currentTarget.value))}
            />
            <div className={styles.statusCell}>
                <Switch
                    onColor="#fc4f6b"
                    checked={item.status}
                    onChange={(v) => onChangeItem('TAMANHO', item.idGrupoAdicionalItem, 'status', v)}
                />
            </div>
            {canRemove && (
                <CustomButton onClick={() => removeItem('TAMANHO', item.idGrupoAdicionalItem)} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton="outline-main">
                    <FontAwesomeIcon icon={faTrash} />
                </CustomButton>
            )}
        </div>
    );

    const LinhaValor = (tipo: 'MASSA' | 'BORDA', item: IGrupoAdicionalItem, canRemove: boolean) => (
        <div className={styles.row} key={item.idGrupoAdicionalItem}>
            <InputGroup
                width="45%"
                title={tipo === 'MASSA' ? 'Nome da massa' : 'Nome da borda'}
                value={item.nome}
                onChange={(e) => onChangeItem(tipo, item.idGrupoAdicionalItem, 'nome', e.currentTarget.value)}
            />
            <InputGroup
                type="number"
                width="25%"
                title="Preço"
                value={item.valor}
                onChange={(e) => onChangeItem(tipo, item.idGrupoAdicionalItem, 'valor', fGetNumber(e.currentTarget.value))}
            />
            <div className={styles.statusCell}>
                <Switch
                    onColor="#fc4f6b"
                    checked={item.status}
                    onChange={(v) => onChangeItem(tipo, item.idGrupoAdicionalItem, 'status', v)}
                />
            </div>
            {canRemove && (
                <CustomButton onClick={() => removeItem(tipo, item.idGrupoAdicionalItem)} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton="outline-main">
                    <FontAwesomeIcon icon={faTrash} />
                </CustomButton>
            )}
        </div>
    );

    const LinhaSabor = (item: IGrupoAdicionalItem) => {
        const tamanhos = getItems('TAMANHO');
        return (
            <div className={styles.saborRow} key={item.idGrupoAdicionalItem}>
                <div className={styles.row}>
                    <InputGroup
                        width="45%"
                        title="Nome do sabor"
                        value={item.nome}
                        onChange={(e) => onChangeItem('SABOR', item.idGrupoAdicionalItem, 'nome', e.currentTarget.value)}
                    />
                    <div className={styles.statusCell}>
                        <Switch
                            onColor="#fc4f6b"
                            checked={item.status}
                            onChange={(v) => onChangeItem('SABOR', item.idGrupoAdicionalItem, 'status', v)}
                        />
                    </div>
                    <CustomButton onClick={() => removeItem('SABOR', item.idGrupoAdicionalItem)} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton="outline-main">
                        <FontAwesomeIcon icon={faTrash} />
                    </CustomButton>
                </div>
                <div className={styles.row}>
                    {tamanhos.map((t) => (
                        <InputGroup
                            key={t.idGrupoAdicionalItem}
                            type="number"
                            width="150px"
                            title={`Preço - ${t.nome || 'Tamanho'}`}
                            value={getPreco(item, t.idGrupoAdicionalItem)}
                            onChange={(e) =>
                                onChangePreco(item.idGrupoAdicionalItem, t.idGrupoAdicionalItem, fGetNumber(e.currentTarget.value))
                            }
                        />
                    ))}
                </div>
                <hr />
            </div>
        );
    };

    if (!pizza) {
        return <Loading />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <h3>{pizza.id > 0 ? 'Editar Pizza' : 'Nova Pizza'}</h3>
                <Tabs defaultActiveKey="produto" id="pizza-tabs" variant="underline" fill>
                    <Tab eventKey="produto" title="Detalhes">
                        <div className={styles.row}>
                            <InputGroup
                                width="10%"
                                title="Cod"
                                value={pizza.cod}
                                onChange={(v) => setPizza({ ...pizza, cod: fGetNumber(v.currentTarget.value) })}
                            />
                            <InputGroup
                                width="70%"
                                title="Nome"
                                value={pizza.nome}
                                onChange={(v) => setPizza({ ...pizza, nome: v.currentTarget.value })}
                            />
                            <div className={styles.statusCell}>
                                <Switch onColor="#fc4f6b" checked={pizza.status} onChange={(e) => setPizza({ ...pizza, status: e })} />
                            </div>
                            <SelectClasseMaterial
                                selected={pizza.classeMaterialId}
                                setSelected={(v) => setPizza({ ...pizza, classeMaterialId: v!.id, idClasseMaterial: v!.idClasseMaterial })}
                            />
                            <SelectTributacao
                                selected={pizza.tributacaoId}
                                setSelected={(v) => setPizza({ ...pizza, tributacaoId: v.id, idTributacao: v.idTributacao })}
                            />
                        </div>
                    </Tab>

                    <Tab eventKey="tamanho" title="Tamanhos">
                        <div className={styles.contentTab}>
                            {getItems('TAMANHO').map((item) => LinhaTamanho(item, getItems('TAMANHO').length > 1))}
                            <CustomButton onClick={novoTamanho} style={{ width: '300px' }} typeButton="main">
                                Adicionar Tamanho
                            </CustomButton>
                        </div>
                    </Tab>

                    <Tab eventKey="massa" title="Massas">
                        <div className={styles.contentTab}>
                            {getItems('MASSA').map((item) => LinhaValor('MASSA', item, getItems('MASSA').length > 1))}
                            <CustomButton onClick={() => setItens('MASSA', [...getItems('MASSA'), { ...emptyItem(pizza.empresaId), nome: '' }])} style={{ width: '300px' }} typeButton="main">
                                Adicionar Massa
                            </CustomButton>
                        </div>
                    </Tab>

                    <Tab eventKey="borda" title="Bordas">
                        <div className={styles.contentTab}>
                            {getItems('BORDA').map((item) => LinhaValor('BORDA', item, getItems('BORDA').length > 1))}
                            <CustomButton onClick={() => setItens('BORDA', [...getItems('BORDA'), { ...emptyItem(pizza.empresaId), nome: '' }])} style={{ width: '300px' }} typeButton="main">
                                Adicionar Borda
                            </CustomButton>
                        </div>
                    </Tab>

                    <Tab eventKey="sabor" title="Sabores">
                        <div className={styles.contentTab}>
                            <SelectBase
                                width="380px"
                                title="Preço da pizza meio a meio (mais de um sabor)"
                                selected={getGrupo('SABOR')?.baseCalculo ?? 'MEDIA'}
                                datas={[
                                    { value: 'MEDIA', label: 'Média (soma dividida pela qtd de sabores)' },
                                    { value: 'MAIOR', label: 'Maior valor (cobra o sabor mais caro)' },
                                    { value: 'SOMAR', label: 'Somar (soma o valor dos sabores)' },
                                ]}
                                setSelected={(v) => updateGrupo('SABOR', (g) => ({ ...g, baseCalculo: v }))}
                            />
                            {getItems('SABOR').map((item) => LinhaSabor(item))}
                            <CustomButton onClick={novoSabor} style={{ width: '300px' }} typeButton="main">
                                Adicionar Sabor
                            </CustomButton>
                        </div>
                    </Tab>
                </Tabs>
            </div>
            <div className={styles.buttons}>
                <CustomButton onClick={onSubmit} loading={saving}>
                    {pizza.id > 0 ? 'Salvar' : 'Cadastrar'}
                </CustomButton>
            </div>
        </div>
    );
}
