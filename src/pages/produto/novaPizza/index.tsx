import { Tab, Tabs } from 'react-bootstrap';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import { InputGroup } from '@/components/ui/InputGroup';
import { v4 as uuidv4 } from 'uuid';
import IProduto from '@/interfaces/IProduto';
import { IProdutoGrupoItem, IProdutoGrupoItemPreco } from '@/interfaces/IProdutoGrupoItem';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Switch from "react-switch";
import { fGetNumber } from '@/utils/functions';
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial';
import SelectTributacao from '@/components/Selects/SelectTributacao';
import { api } from '@/services/apiClient';
import IUsuario from '@/interfaces/IUsuario';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function NovaPizza() {
    const [pizza, setPizza] = useState<IProduto>();
    const [user, setUser] = useState<IUsuario>();
    const { getUser } = useContext(AuthContext)
    const router = useRouter();
    const { id } = router.query;

    const loadUser = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
            return u;
        } else {
            return user;
        }
    }

    const loadCod = async () => {
        var u = await loadUser();
        var cod = await api.get(`/Produto/NextCod?empresaId=${u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse<number>) => {
                return data;
            })
            .catch((err) => {
                toast.error(`Erro ao buscar codigo. ${err.message}`);
                return 0;
            });
        return cod;
    }

    useEffect(() => {
        if(!router.isReady){
            return;
        }
        if(!id){
            const inicializarPizza = (): IProduto => ({
                bloqueiaEstoque: false,
                idProduto: 0,
                id: 0,
                nome: 'Pizza Salgada',
                valorCompra: 0,
                cod: 0,
                valor: 0,
                quantidade: 0,
                status: true,
                unidadeCompra: '',
                tributacao: {} as any, // Ajuste conforme sua implementação de ITributacao
                idTributacao: 0,
                materiaPrimas: [],
                tamanhos: [],
                fornecedores: [],
                grupoAdicionais: [
                    {
                        idProdutoGrupo: 0,
                        id: 0,
                        idProduto: 0,
                        produtoId: 0,
                        empresaId: 0,
                        produto: {} as any, // Ajuste conforme sua implementação de IProduto
                        tipo: 'MASSA',
                        descricao: 'Grupo de massas',
                        status: true,
                        minimo: 1,
                        maximo: 1,
                        itens: [
                            {
                                id: uuidv4(),
                                idProdutoGrupoItem: uuidv4(),
                                idProdutoGrupo: 0,
                                produtoGrupoId: 0,
                                produtoGrupo: {} as any, // Ajuste conforme sua implementação de IProdutoGrupo
                                materiaPrima: {} as any, // Ajuste conforme sua implementação de IMateriaPrima
                                idMateriaPrima: 0,
                                materiaPrimaId: 0,
                                nome: 'Tradicional',
                                descricao: 'Massa tradicional',
                                valor: 0,
                                qtdSabores: 0,
                                status: true,
                                precos: [],
                            },
                        ],
                    },
                    {
                        idProdutoGrupo: 0,
                        id: 0,
                        idProduto: 0,
                        produtoId: 0,
                        empresaId: 0,
                        produto: {} as any,
                        tipo: 'TAMANHO',
                        descricao: 'Grupo de tamanhos',
                        status: true,
                        minimo: 1,
                        maximo: 1,
                        itens: [
                            {
                                id: uuidv4(),
                                idProdutoGrupoItem: uuidv4(),
                                idProdutoGrupo: 0,
                                produtoGrupoId: 0,
                                produtoGrupo: {} as any,
                                materiaPrima: {} as any,
                                idMateriaPrima: 0,
                                materiaPrimaId: 0,
                                nome: 'Pequena',
                                descricao: 'Tamanho pequeno',
                                valor: 0,
                                qtdSabores: 2,
                                status: true,
                                precos: [],
                            },
                            {
                                id: uuidv4(),
                                idProdutoGrupoItem: uuidv4(),
                                idProdutoGrupo: 0,
                                produtoGrupoId: 0,
                                produtoGrupo: {} as any,
                                materiaPrima: {} as any,
                                idMateriaPrima: 0,
                                materiaPrimaId: 0,
                                nome: 'Média',
                                descricao: 'Tamanho médio',
                                valor: 0,
                                qtdSabores: 3,
                                status: true,
                                precos: [],
                            },
                        ],
                    },
                    {
                        idProdutoGrupo: 0,
                        id: 0,
                        idProduto: 0,
                        produtoId: 0,
                        empresaId: 0,
                        produto: {} as any, // Ajuste conforme sua implementação de IProduto
                        tipo: 'BORDA',
                        descricao: 'Bordas',
                        status: true,
                        minimo: 1,
                        maximo: 1,
                        itens: [
                            {
                                id: uuidv4(),
                                idProdutoGrupoItem: uuidv4(),
                                idProdutoGrupo: 0,
                                produtoGrupoId: 0,
                                produtoGrupo: {} as any, // Ajuste conforme sua implementação de IProdutoGrupo
                                materiaPrima: {} as any, // Ajuste conforme sua implementação de IMateriaPrima
                                idMateriaPrima: 0,
                                materiaPrimaId: 0,
                                nome: 'Sem borda',
                                descricao: 'Sem borda',
                                valor: 0,
                                qtdSabores: 0,
                                status: true,
                                precos: [],
                            },
                        ],
                    },
                    {
                        idProdutoGrupo: 0,
                        id: 0,
                        idProduto: 0,
                        produtoId: 0,
                        empresaId: 0,
                        produto: {} as any, // Ajuste conforme sua implementação de IProduto
                        tipo: 'SABOR',
                        descricao: 'Sabores',
                        status: true,
                        minimo: 1,
                        maximo: 1,
                        itens: [],
                    },
                ],
                codBarras: [],
                classeMaterial: {} as any, // Ajuste conforme sua implementação de IClasseMaterial
                idClasseMaterial: 0,
                quantidadeMinima: 0,
                empresaId: 0,
                classeMaterialId: 0,
                tributacaoId: 0,
                lastChange: new Date(),
                localCriacao: '',
                custoTotal: 0,
                codigoFornecedor: '',
                multiplicadorFornecedor: 0,
                localPath: '',
                getCustoMateriaPrima: false,
                ultimaConferencia: new Date(),
                valorUnitarioSemImposto: 0,
                aliqICMSFornecedor: 0,
                aliqICMSSTFornecedor: 0,
                aliqFCPFornecedor: 0,
                aliqMVAFornecedor: 0,
                tipo: 'PIZZA',
                posicao: 0,
                visivelMenu: false,
                promocoes: [],
                descricao: '',
                isConferencia: false,
                imagem: undefined,
            });
            setTimeout(async () => {
                var cod = await loadCod();
                var p = inicializarPizza();
                p.cod = cod;
                setPizza(p);
                loadCod();
            })
        }else{
            api.get(`/Produto/Select?id=${id}`).then(({data}) => {
                setPizza(data);
            });
        }
      
    }, [router.isReady]);

    const onChangeText = (item: IProdutoGrupoItem, newValue: string, tipoGrupo: string, field: string) => {
        if (!pizza) return;
        const indexGrupo = _.findIndex(pizza.grupoAdicionais, (p) => p.tipo === tipoGrupo);
        const indexItem = _.findIndex(pizza.grupoAdicionais[indexGrupo].itens, (p) => p.id === item.id);

        // Ajusta o tipo do campo dinamicamente
        const parsedValue =
            field === 'status' ? newValue === 'true' : field === 'valor' ? parseFloat(newValue) : newValue;

        pizza.grupoAdicionais[indexGrupo].itens[indexItem][field] = parsedValue;
        setPizza({ ...pizza });
    };

    const ItemTamanho = (item: IProdutoGrupoItem, canRemove: boolean) => {
        return (
            <div className={styles.row}>
                <InputGroup
                    width="30%"
                    title="Nome do tamanho"
                    value={item.nome}
                    onChange={(e) => onChangeText(item, e.currentTarget.value, 'TAMANHO', 'nome')}
                />
                <InputGroup
                    type="number"
                    width="30%"
                    title="Qtd. pedaços"
                    value={item.qtdSabores || 0}
                    onChange={(e) => onChangeText(item, e.currentTarget.value, 'TAMANHO', 'qtdSabores')}
                />
                {canRemove && <CustomButton onClick={() => { RemoveItem('TAMANHO', item.id) }} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton={'outline-main'}><FontAwesomeIcon icon={faTrash} /></CustomButton>}
            </div>
        );
    };
    const ItemMassa = (item: IProdutoGrupoItem, canRemove: boolean) => {
        return (
            <div className={styles.row}>
                <InputGroup
                    width="30%"
                    title="Nome da Massa"
                    value={item.nome}
                    onChange={(e) => onChangeText(item, e.currentTarget.value, 'MASSA', 'nome')}
                />
                <InputGroup
                    type="number"
                    width="30%"
                    title="Preço"
                    value={item.valor.toString()}
                    onChange={(e) => onChangeText(item, e.currentTarget.value, 'MASSA', 'valor')}
                />
                <Switch onColor={'#fc4f6b'} onChange={(e) => { onChangeText(item, e.toString(), 'MASSA', 'status') }} checked={item.status} />
                {canRemove && <CustomButton onClick={() => { RemoveItem('MASSA', item.id) }} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton={'outline-main'}><FontAwesomeIcon icon={faTrash} /></CustomButton>}
            </div>
        );
    };

    const onChangePreco = (item: IProdutoGrupoItemPreco, value: string) => {
        var grupo = _.findIndex(pizza.grupoAdicionais, p => p.tipo == "SABOR");
        var sabor = _.findIndex(pizza.grupoAdicionais[grupo].itens, p => p.id == item.produtoGrupoItemId);
        var preco = _.findIndex(pizza.grupoAdicionais[grupo].itens[sabor].precos, p => p.id == item.id);
        if(preco < 0){
            item.valor = parseFloat(value);
            pizza.grupoAdicionais[grupo].itens[sabor].precos.push(item);
            setPizza({ ...pizza });
        }else{
            pizza.grupoAdicionais[grupo].itens[sabor].precos[preco].valor = parseFloat(value);
            setPizza({ ...pizza });
        }
    }
    const ItemSabor = (item: IProdutoGrupoItem) => {
        const { itens } = (pizza.grupoAdicionais[_.findIndex(pizza.grupoAdicionais, p => p.tipo == "TAMANHO")]);

        function getPreco(tamanho: IProdutoGrupoItem) {
            var index = _.findIndex(item.precos, p => p.produtogrupoitemrelacaoId == tamanho.id);
            if (index < 0) {
                return 0;
            } else {
                return item.precos[index].valor;
            }
        }
        function getObjectPreco(tamanho:IProdutoGrupoItem){
            var index = _.findIndex(item.precos, p => p.produtogrupoitemrelacaoId == tamanho.id);
            if (index < 0) {
                return {
                    id: uuidv4(),
                    idProdutoGrupoItem: null,
                    idProdutoGrupoItemPreco: null,
                    idProdutogrupoitemrelacao: null,
                    produtoGrupoItemId: item.id,
                    produtogrupoitemrelacaoId: tamanho.id,
                    valor: 0

                } as IProdutoGrupoItemPreco;
            } else {
                return item.precos[index];
            }
        }
        return (
            <div className={styles.row}>
                <InputGroup
                    width="30%"
                    title={"Nome do Sabor"}
                    value={item.nome}
                    onChange={(e) => onChangeText(item, e.currentTarget.value, 'SABOR', 'nome')}
                />
                {itens.map((tamanho) => {
                    return (
                        <InputGroup
                            type="number"
                            width="150px"
                            title={tamanho.nome}
                            value={getPreco(tamanho)}
                            onChange={(e) => onChangePreco(getObjectPreco(tamanho), e.currentTarget.value)}
                        />
                    )
                })}
                {/* {item.precos?.map((preco) => ItemSaborPreco(preco))} */}
                <div style={{ width: '100%' }}>
                    <hr />
                </div>
            </div>
        )
    }
    const ItemBorda = (item: IProdutoGrupoItem, canRemove: boolean) => {
        return (
            <div className={styles.row}>
                <InputGroup
                    width="30%"
                    title="Nome da Borda"
                    value={item.nome}
                    onChange={(e) => onChangeText(item, e.currentTarget.value, 'BORDA', 'nome')}
                />
                <InputGroup
                    type="number"
                    width="30%"
                    title="Preço"
                    value={item.valor.toString()}
                    onChange={(e) => onChangeText(item, e.currentTarget.value, 'BORDA', 'valor')}
                />
                <Switch onColor={'#fc4f6b'} onChange={(e) => { onChangeText(item, e.toString(), 'BORDA', 'status') }} checked={item.status} />
                {canRemove && <CustomButton onClick={() => { RemoveItem('BORDA', item.id) }} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton={'outline-main'}><FontAwesomeIcon icon={faTrash} /></CustomButton>}
            </div>
        );
    };
    const NewItem = (tipoGrupo: string) => {
        const indexGrupo = pizza?.grupoAdicionais.findIndex((g) => g.tipo === tipoGrupo);
        if (!pizza?.grupoAdicionais[indexGrupo].itens) {
            pizza.grupoAdicionais[indexGrupo].itens = [] as IProdutoGrupoItem[];
        }
        pizza.grupoAdicionais[indexGrupo].itens.push({
            id: uuidv4(),
            idProdutoGrupoItem: uuidv4(),
            idProdutoGrupo: 0,
            produtoGrupoId: 0,
            produtoGrupo: {} as any, // Ajuste conforme sua implementação de IProdutoGrupo
            materiaPrima: {} as any, // Ajuste conforme sua implementação de IMateriaPrima
            idMateriaPrima: 0,
            materiaPrimaId: 0,
            nome: '',
            descricao: '',
            valor: 0,
            qtdSabores: 0,
            status: true,
            precos: [],
        });
        setPizza({ ...pizza });
    }
    const NewSabor = () => {
        var item = {
            id: uuidv4(),
            idProdutoGrupoItem: uuidv4(),
            idProdutoGrupo: 0,
            produtoGrupoId: 0,
            produtoGrupo: {} as any, // Ajuste conforme sua implementação de IProdutoGrupo
            materiaPrima: {} as any, // Ajuste conforme sua implementação de IMateriaPrima
            idMateriaPrima: 0,
            materiaPrimaId: 0,
            nome: '',
            descricao: '',
            valor: 0,
            qtdSabores: 0,
            status: true,
            precos: [],
        } as IProdutoGrupoItem;

        const tamIndex = _.findIndex(pizza.grupoAdicionais, p => p.tipo == "TAMANHO");
        if (!pizza.grupoAdicionais[tamIndex] || pizza.grupoAdicionais[tamIndex].itens.length <= 0) {
            toast.error(`Adicione ao menos um tamanho`);
            return;
        }
        pizza.grupoAdicionais[tamIndex].itens.map((tamanho) => {
            item.precos.push({
                id: uuidv4(),
                idProdutoGrupoItem: null,
                idProdutoGrupoItemPreco: null,
                produtoGrupoItemId: item.id,
                produtogrupoitemrelacaoId: tamanho.id,
                valor: 0
            } as IProdutoGrupoItemPreco);
        });

        var sabIndex = _.findIndex(pizza.grupoAdicionais, p => p.tipo == 'SABOR');
        pizza.grupoAdicionais[sabIndex].itens.push(item);
        setPizza({ ...pizza });
    }
    const RemoveItem = (tipoGrupo: string, itemId: string) => {
        const indexGrupo = pizza?.grupoAdicionais.findIndex((g) => g.tipo === tipoGrupo);
        const indexItem = _.findIndex(pizza.grupoAdicionais[indexGrupo].itens, p => p.id == itemId);
        var newArray = pizza.grupoAdicionais[indexGrupo].itens.splice(indexItem, 1);
        //  pizza.grupoAdicionais[indexGrupo].itens = newArray;
        setPizza({ ...pizza });
    }
    const getItems = (tipoGrupo: string): IProdutoGrupoItem[] => {
        const grupo = pizza?.grupoAdicionais.find((g) => g.tipo === tipoGrupo);
        return grupo?.itens || [];
    };


    const onSubmit = async () => {
      
        if(!pizza.id || pizza.id <= 0){
            pizza.tipo = "PIZZA";
            pizza.status = true;
            pizza.empresaId = user.empresaSelecionada;
            await api.post(`/Produto/Create`, pizza).then(({data}) => {
                toast.success(`sucesso rapaz`);
            }).catch((err) => {
                toast.error(`ERRO rapaz`);
            })

        }else{
            await api.put(`/Produto/UpdateProduct`, pizza).then(({data}) => {
                toast.success(`sucesso rapaz`);
            }).catch((err) => {
                toast.error(`ERRO rapaz`);
            })
        }
    }

    if (!pizza) {
        return <></>;
    }
    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <h3>Nova Pizza</h3>
                <Tabs defaultActiveKey="produto" id="uncontrolled-tab-example" variant={'underline'} justify={false} fill>
                    <Tab eventKey="produto" title="Detalhes">
                        <div className={styles.row}>
                            <InputGroup width={'10%'} title={'Cod'} value={pizza.cod} onChange={((v) => { setPizza({ ...pizza, cod: fGetNumber(v.currentTarget.value) }) })} />
                            <InputGroup width={'80%'} title={'Nome'} value={pizza.nome} onChange={((v) => { setPizza({ ...pizza, nome: v.currentTarget.value }) })} />
                            <div style={{ width: '10%', display: 'flex', justifyContent: 'flex-end' }}>
                                <Switch onColor={'#fc4f6b'} onChange={(e) => { setPizza({ ...pizza, status: e }) }} checked={pizza.status} />
                            </div>
                            <SelectClasseMaterial selected={pizza.classeMaterialId} setSelected={(v) => { setPizza({ ...pizza, classeMaterialId: v.id, idClasseMaterial: v.idClasseMaterial }) }} />
                            <SelectTributacao selected={pizza.tributacaoId} setSelected={(v) => { setPizza({ ...pizza, tributacaoId: v.id, idTributacao: v.idTributacao }) }} />
                        </div>
                    </Tab>
                    <Tab className={styles.tab} eventKey="tamanho" title="Tamanho">
                        <div className={styles.contentTab}>
                            {getItems('TAMANHO').map((item) => ItemTamanho(item, getItems('TAMANHO').length > 1))}
                            <CustomButton onClick={() => { NewItem('TAMANHO') }} style={{ width: '300px' }} typeButton={'main'}> Adicionar Tamanho</CustomButton>
                        </div>
                    </Tab>
                    <Tab eventKey="massa" title="Massa">
                        <div className="row">
                            {getItems('MASSA').map((item) => ItemMassa(item, getItems('MASSA').length > 1))}
                            <CustomButton onClick={() => { NewItem('MASSA') }} style={{ width: '300px' }} typeButton={'main'}> Adicionar Massa</CustomButton>
                        </div>
                    </Tab>
                    <Tab eventKey="borda" title="Borda">
                        <div className="row">{getItems('BORDA').map((item) => ItemBorda(item, getItems('BORDA').length > 1))}</div>
                        <CustomButton onClick={() => { NewItem('BORDA') }} style={{ width: '300px' }} typeButton={'main'}> Adicionar Borda</CustomButton>
                    </Tab>
                    <Tab eventKey="sabor" title="Sabores">
                        <div className="row">{getItems('SABOR').map((item) => ItemSabor(item))}</div>
                        <CustomButton onClick={() => { NewSabor() }} style={{ width: '300px' }} typeButton={'main'}> Adicionar Sabor</CustomButton>
                    </Tab>
                </Tabs>
            </div>
            <div className={styles.buttons}>
                <CustomButton onClick={onSubmit}>Cadastrar</CustomButton>

            </div>
        </div>
    );
}
