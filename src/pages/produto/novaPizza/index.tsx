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

// Os 5 grupos que uma pizza sempre possui. Nesta tela o usuario faz apenas
// CRUD dos ITENS de cada um desses grupos (o vinculo N:N pizza<->grupo e o
// proprio grupo sao criados/atualizados junto no salvamento).
type TipoGrupo = 'MASSA' | 'TAMANHO' | 'BORDA' | 'SABOR' | 'COMPLEMENTO';

// Todos os grupos padrao de uma pizza, na ordem em que aparecem nas abas.
const TIPOS_GRUPO: TipoGrupo[] = ['MASSA', 'TAMANHO', 'BORDA', 'SABOR', 'COMPLEMENTO'];

// Grupos em que o preco do item varia por TAMANHO (usam a colecao `precos`,
// um preco por tamanho, e nao o campo `valor` unico). SABOR sempre foi assim;
// BORDA e COMPLEMENTO passaram a funcionar do mesmo jeito.
const TIPOS_POR_TAMANHO: TipoGrupo[] = ['SABOR', 'BORDA', 'COMPLEMENTO'];

// IMPORTANTE — identidade por id de NUVEM.
// No mundo web/nuvem tudo se relaciona pelo `id` (PK nuvem, string GUID) de item
// e preco; os campos `id*` (idGrupoAdicionalItem, idGrupoAdicionalItemPreco,
// idGrupoAdicional...) sao ids LOCAIS do PDV winforms e ficam vazios em registro
// criado aqui (o PDV os preenche quando o cadastro desce). Por isso geramos o
// GUID de nuvem no cadastro e os precos apontam para o tamanho pelo `id` de nuvem
// (grupoAdicionalItemRelacaoId), que e o campo que PDV Web e menu digital leem.

const emptyItem = (empresaId: number): IGrupoAdicionalItem => ({
    // PK nuvem gerada no cadastro web (string GUID). O id local (winforms) fica
    // vazio ate o PDV criar o registro correspondente.
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

// Preco de um item (SABOR/BORDA/COMPLEMENTO) para um tamanho. Relacao feita
// pelos ids de NUVEM: grupoAdicionalItemId = id do item dono; grupoAdicionalItemRelacaoId
// = id do item de TAMANHO. Os campos locais (id*) ficam vazios no cadastro web.
const novoPreco = (
    empresaId: number,
    itemId: string,
    tamanhoId: string,
): IGrupoAdicionalItemPreco => ({
    id: uuidv4(),
    idGrupoAdicionalItemPreco: '',
    idGrupoAdicionalItem: '',
    grupoAdicionalItemId: itemId,
    idGrupoAdicionalItemRelacao: '',
    grupoAdicionalItemRelacaoId: tamanhoId,
    valor: 0,
    lastChange: new Date(),
    needChange: true,
    empresaId,
});

// Cria um item ja com um preco (zerado) para cada tamanho informado — usado
// pelos grupos por-tamanho (SABOR, BORDA, COMPLEMENTO).
const novoItemComPrecos = (
    empresaId: number,
    tamanhos: IGrupoAdicionalItem[],
): IGrupoAdicionalItem => {
    const item = { ...emptyItem(empresaId), nome: '' };
    item.precos = tamanhos.map((t) => novoPreco(empresaId, item.id, t.id));
    return item;
};

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
    // BORDA agora tem preco por tamanho: o item padrao "Sem Borda" recebe um
    // preco (0) para cada tamanho na normalizacao (garantirPrecos).
    const borda = emptyGrupo('BORDA', 'Bordas', 1, 1, empresaId, [
        { ...emptyItem(empresaId), nome: 'Sem Borda' },
    ]);
    const sabor = emptyGrupo('SABOR', 'Sabores', 1, 2, empresaId, []);
    // Pizza meio-a-meio: por padrão divide o preço pela qtd de sabores (média),
    // preservando o comportamento histórico. O usuário troca na aba de sabores.
    sabor.baseCalculo = 'MEDIA';
    // COMPLEMENTO: opcional e de multipla escolha (min 0 / max 0 = ilimitado);
    // igual a BORDA, o preco de cada complemento varia por tamanho.
    const complemento = emptyGrupo('COMPLEMENTO', 'Complementos', 0, 0, empresaId, []);

    return [
        novoVinculo(massa, empresaId),
        novoVinculo(tamanho, empresaId),
        novoVinculo(borda, empresaId),
        novoVinculo(sabor, empresaId),
        novoVinculo(complemento, empresaId),
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

    // Colapsa grupos duplicados do mesmo tipo (ex.: pizzas antigas com dois
    // grupos SABOR). Sem isso, updateGrupo (que escreve em TODOS os vinculos do
    // tipo) acaba colocando o mesmo item — mesmo `id` de nuvem — em mais de um
    // grupo, e o EF estoura no save ("another instance with the key value ...
    // is already being tracked"). Mantem um canonico por tipo: prefere ativo e
    // com itens. Os vinculos descartados sao removidos no save (limpeza).
    const dedupGruposPorTipo = (p: IProduto): IProduto => {
        const score = (v: IProdutoGrupoAdicional) =>
            (v.grupoAdicional?.status !== false ? 2 : 0) +
            ((v.grupoAdicional?.itens?.length ?? 0) > 0 ? 1 : 0);

        const canonico = new Map<string, IProdutoGrupoAdicional>();
        for (const v of p.grupoAdicionais ?? []) {
            const tipo = v.grupoAdicional?.tipo;
            if (!tipo) continue;
            const atual = canonico.get(tipo);
            if (!atual || score(v) > score(atual)) canonico.set(tipo, v);
        }
        p.grupoAdicionais = Array.from(canonico.values());
        return p;
    };

    // Garante que os 5 grupos existam no vinculo (util ao editar pizzas antigas).
    const garantirGrupos = (p: IProduto): IProduto => {
        dedupGruposPorTipo(p);
        const empresaId = p.empresaId;
        TIPOS_GRUPO.forEach((tipo) => {
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
        return garantirPrecos(p);
    };

    // Normaliza os grupos por-tamanho: cada item precisa ter exatamente um preco
    // por tamanho existente, relacionado pelo id de NUVEM do tamanho. Precos
    // antigos que so tinham a relacao local sao migrados: preenchem o campo nuvem
    // (grupoAdicionalItemRelacaoId) a partir do tamanho correspondente.
    const garantirPrecos = (p: IProduto): IProduto => {
        const tamanhos =
            p.grupoAdicionais?.find((v) => v.grupoAdicional?.tipo === 'TAMANHO')?.grupoAdicional
                ?.itens ?? [];

        p.grupoAdicionais = (p.grupoAdicionais ?? []).map((v) => {
            const g = v.grupoAdicional;
            if (!g || !TIPOS_POR_TAMANHO.includes(g.tipo as TipoGrupo)) return v;

            const itens = (g.itens ?? []).map((item) => {
                const precos = tamanhos.map((t) => {
                    // Casa pelo id de nuvem do tamanho; fallback pelo id local
                    // (migra precos antigos que só tinham a relacao local).
                    const existente = (item.precos ?? []).find(
                        (pr) =>
                            (!!pr.grupoAdicionalItemRelacaoId && pr.grupoAdicionalItemRelacaoId === t.id) ||
                            (!!pr.idGrupoAdicionalItemRelacao &&
                                !!t.idGrupoAdicionalItem &&
                                pr.idGrupoAdicionalItemRelacao === t.idGrupoAdicionalItem),
                    );
                    if (existente) {
                        // Garante as FKs de nuvem preenchidas (migra registro antigo).
                        return {
                            ...existente,
                            grupoAdicionalItemId: existente.grupoAdicionalItemId || item.id,
                            grupoAdicionalItemRelacaoId: existente.grupoAdicionalItemRelacaoId || t.id,
                        };
                    }
                    // Sem preco para esse tamanho: cria um. Para migrar bordas
                    // antigas (valor unico), semeia com o `valor` do item.
                    return { ...novoPreco(p.empresaId, item.id, t.id), valor: item.valor ?? 0 };
                });
                return { ...item, precos };
            });
            return { ...v, grupoAdicional: { ...g, itens } };
        });
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
        setPizza(garantirPrecos(p));
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
    // itemId aqui e o `id` de NUVEM do item (chave estavel na UI).
    const onChangeItem = (
        tipo: TipoGrupo,
        itemId: string,
        field: keyof IGrupoAdicionalItem,
        value: string | number | boolean,
    ) => {
        setItens(
            tipo,
            getItems(tipo).map((it) => (it.id === itemId ? { ...it, [field]: value } : it)),
        );
    };

    const removeItem = (tipo: TipoGrupo, itemId: string) => {
        setItens(
            tipo,
            getItems(tipo).filter((it) => it.id !== itemId),
        );
        // Ao remover um tamanho, tira os precos correspondentes de cada item
        // dos grupos por-tamanho (sabor, borda, complemento).
        if (tipo === 'TAMANHO') {
            TIPOS_POR_TAMANHO.forEach((t) =>
                updateGrupo(t, (g) => ({
                    ...g,
                    itens: (g.itens ?? []).map((item) => ({
                        ...item,
                        precos: (item.precos ?? []).filter(
                            (p) => p.grupoAdicionalItemRelacaoId !== itemId,
                        ),
                    })),
                })),
            );
        }
    };

    // ── tamanho ──────────────────────────────────────────────
    const novoTamanho = () => {
        if (!pizza) return;
        const novo = { ...emptyItem(pizza.empresaId), nome: '' };
        setItens('TAMANHO', [...getItems('TAMANHO'), novo]);
        // Cada item dos grupos por-tamanho ganha um preco (0) para o novo tamanho.
        TIPOS_POR_TAMANHO.forEach((t) =>
            updateGrupo(t, (g) => ({
                ...g,
                itens: (g.itens ?? []).map((item) => ({
                    ...item,
                    precos: [...(item.precos ?? []), novoPreco(pizza.empresaId, item.id, novo.id)],
                })),
            })),
        );
    };

    // ── itens por-tamanho (sabor / borda / complemento) ──────
    const novoItemPorTamanho = (tipo: TipoGrupo) => {
        if (!pizza) return;
        const tamanhos = getItems('TAMANHO');
        if (tamanhos.length === 0) {
            toast.error('Cadastre ao menos um tamanho antes.');
            return;
        }
        setItens(tipo, [...getItems(tipo), novoItemComPrecos(pizza.empresaId, tamanhos)]);
    };

    // preco do item para um tamanho (relacao pelo id de nuvem do tamanho).
    const getPreco = (item: IGrupoAdicionalItem, tamanhoId: string): number => {
        const p = item.precos?.find((x) => x.grupoAdicionalItemRelacaoId === tamanhoId);
        return p?.valor ?? 0;
    };

    const onChangePreco = (
        tipo: TipoGrupo,
        itemId: string,
        tamanhoId: string,
        valor: number,
    ) => {
        updateGrupo(tipo, (g) => ({
            ...g,
            itens: (g.itens ?? []).map((item) => {
                if (item.id !== itemId) return item;
                const existe = item.precos?.some((p) => p.grupoAdicionalItemRelacaoId === tamanhoId);
                const precos = existe
                    ? item.precos.map((p) =>
                          p.grupoAdicionalItemRelacaoId === tamanhoId ? { ...p, valor } : p,
                      )
                    : [
                          ...(item.precos ?? []),
                          { ...novoPreco(g.empresaId, itemId, tamanhoId), valor },
                      ];
                return { ...item, precos };
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
                const preco = sabor.precos?.find((p) => p.grupoAdicionalItemRelacaoId === t.id);
                if (!preco || preco.valor <= 0)
                    return `Sabor "${sabor.nome}" sem preço para o tamanho "${t.nome}".`;
            }
        }

        // Borda e complemento: preco pode ser 0 (ex.: "Sem Borda"), mas nao
        // pode existir item sem nome.
        for (const item of getItems('BORDA')) {
            if (!item.nome || item.nome.trim().length === 0)
                return 'Existe borda sem nome.';
        }
        for (const item of getItems('COMPLEMENTO')) {
            if (!item.nome || item.nome.trim().length === 0)
                return 'Existe complemento sem nome.';
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
        <div className={styles.row} key={item.id}>
            <InputGroup
                width="45%"
                title="Nome do tamanho"
                value={item.nome}
                onChange={(e) => onChangeItem('TAMANHO', item.id, 'nome', e.currentTarget.value)}
            />
            <InputGroup
                type="number"
                width="25%"
                title="Qtd. sabores"
                value={item.qtdSabores ?? 0}
                onChange={(e) => onChangeItem('TAMANHO', item.id, 'qtdSabores', fGetNumber(e.currentTarget.value))}
            />
            <div className={styles.statusCell}>
                <Switch
                    onColor="#fc4f6b"
                    checked={item.status}
                    onChange={(v) => onChangeItem('TAMANHO', item.id, 'status', v)}
                />
            </div>
            {canRemove && (
                <CustomButton onClick={() => removeItem('TAMANHO', item.id)} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton="outline-main">
                    <FontAwesomeIcon icon={faTrash} />
                </CustomButton>
            )}
        </div>
    );

    // MASSA continua com um valor unico por item.
    const LinhaValor = (tipo: 'MASSA', item: IGrupoAdicionalItem, canRemove: boolean) => (
        <div className={styles.row} key={item.id}>
            <InputGroup
                width="45%"
                title="Nome da massa"
                value={item.nome}
                onChange={(e) => onChangeItem(tipo, item.id, 'nome', e.currentTarget.value)}
            />
            <InputGroup
                type="number"
                width="25%"
                title="Preço"
                value={item.valor}
                onChange={(e) => onChangeItem(tipo, item.id, 'valor', fGetNumber(e.currentTarget.value))}
            />
            <div className={styles.statusCell}>
                <Switch
                    onColor="#fc4f6b"
                    checked={item.status}
                    onChange={(v) => onChangeItem(tipo, item.id, 'status', v)}
                />
            </div>
            {canRemove && (
                <CustomButton onClick={() => removeItem(tipo, item.id)} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton="outline-main">
                    <FontAwesomeIcon icon={faTrash} />
                </CustomButton>
            )}
        </div>
    );

    // Linha de item com preco por tamanho — usada por SABOR, BORDA e COMPLEMENTO.
    const LinhaPorTamanho = (
        tipo: TipoGrupo,
        item: IGrupoAdicionalItem,
        labelNome: string,
        canRemove: boolean,
    ) => {
        const tamanhos = getItems('TAMANHO');
        return (
            <div className={styles.saborRow} key={item.id}>
                <div className={styles.row}>
                    <InputGroup
                        width="45%"
                        title={labelNome}
                        value={item.nome}
                        onChange={(e) => onChangeItem(tipo, item.id, 'nome', e.currentTarget.value)}
                    />
                    <div className={styles.statusCell}>
                        <Switch
                            onColor="#fc4f6b"
                            checked={item.status}
                            onChange={(v) => onChangeItem(tipo, item.id, 'status', v)}
                        />
                    </div>
                    {canRemove && (
                        <CustomButton onClick={() => removeItem(tipo, item.id)} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton="outline-main">
                            <FontAwesomeIcon icon={faTrash} />
                        </CustomButton>
                    )}
                </div>
                <div className={styles.row}>
                    {tamanhos.map((t) => (
                        <InputGroup
                            key={t.id}
                            type="number"
                            width="150px"
                            title={`Preço - ${t.nome || 'Tamanho'}`}
                            value={getPreco(item, t.id)}
                            onChange={(e) =>
                                onChangePreco(tipo, item.id, t.id, fGetNumber(e.currentTarget.value))
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
                            {getItems('BORDA').map((item) => LinhaPorTamanho('BORDA', item, 'Nome da borda', getItems('BORDA').length > 1))}
                            <CustomButton onClick={() => novoItemPorTamanho('BORDA')} style={{ width: '300px' }} typeButton="main">
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
                            {getItems('SABOR').map((item) => LinhaPorTamanho('SABOR', item, 'Nome do sabor', true))}
                            <CustomButton onClick={() => novoItemPorTamanho('SABOR')} style={{ width: '300px' }} typeButton="main">
                                Adicionar Sabor
                            </CustomButton>
                        </div>
                    </Tab>

                    <Tab eventKey="complemento" title="Complementos">
                        <div className={styles.contentTab}>
                            {getItems('COMPLEMENTO').map((item) => LinhaPorTamanho('COMPLEMENTO', item, 'Nome do complemento', true))}
                            <CustomButton onClick={() => novoItemPorTamanho('COMPLEMENTO')} style={{ width: '300px' }} typeButton="main">
                                Adicionar Complemento
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
