import IProduto from '@/interfaces/IProduto';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import CustomButton from '@/components/ui/Buttons';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import SelectProdutoModal from '@/components/Modals/Produto/SelectProdutoModal';
import { InputGroup } from '@/components/ui/InputGroup';
import { fGetNumber, GetCurrencyBRL } from '@/utils/functions';
import ILancamentoEstoque from '@/interfaces/ILancamentoEstoque';
import ILancamentoEstoqueProduto from '@/interfaces/ILancamentoEstoqueProduto';
import _ from 'lodash';

type itemLancamento = {
    item: {
        cProd: string
        qCom: string
        vUnCom: string
        xProd: number
    },
    produto: any
}

export default function Xml() {

    const [produtos, setProdutos] = useState<itemLancamento[]>([])
    const { getUser } = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [loadingXml, setLoadingXml] = useState(false);
    const [prodModal, setProdModal] = useState(-1);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            var user = await getUser();
            setUser(user);
        }
        loadData();
    }, [])
    async function getFile() {
        var input = document.createElement("input");
        input.type = "file";
        input.click();
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            var formData = new FormData();
            formData.append('file', files[0], files[0].name)
            formData.append('EmpresaId', user.empresaSelecionada.toString())
            formData.append('IsProduto', 'true')
            setLoadingXml(true);
            setTimeout(() => {
            }, 500);
            await api.put(`LancamentoEstoque/LoadXML`, formData, { headers: { "Content-Type": 'multipart/form-data' } })
                .then(({ data }: AxiosResponse) => {
                    setProdutos(data);
                    toast.success(`Produtos carregados com sucesso!`);
                }).catch((err: AxiosError) => {
                    toast.error(`Erro ao carregar arquivo. ${err.response?.data || err.message}`);
                });
            setLoadingXml(false);
        }

    }
    function selectProduto(p: IProduto) {
        produtos[prodModal].produto = p;
        setProdutos([...produtos]);
        setProdModal(-1);
    }
    if (!produtos || produtos.length <= 0) {
        return (
            <div className={styles['container-xml']}>
                <CustomButton typeButton={'main'} onClick={getFile} loading={loadingXml}>
                    Clique aqui para selecionar o arquivo XML
                </CustomButton>


            </div>
        )
    }
    function onLeave(index, value, field) {
        var number = value.toString().replace(`,`, `.`);
        if (field == "multiplicadorFornecedor") {
            if (!produtos[index].produto) {
                produtos[index].produto = {};
            }
            produtos[index].produto.multiplicadorFornecedor = number;
        } else {
            produtos[index].item[field] = number;
        }
        setProdutos([...produtos]);
    }
    async function updateProdutoInfo() {
        var errors = '';
        var list = produtos.map((item) => {
            var p = item.produto;
            if (!p || !p.nome) {
                errors += `${item.item.xProd} - Sem referencia no sistema\n`;
            }
            return {
                id: p?.id,
                valorCompra: p?.valorCompra,
                multiplicadorFornecedor: p?.multiplicadorFornecedor,
                codigoFornecedor: item.item.cProd,
            }
        })
        if (errors.length > 0) {
            toast.error(errors);
            return false;
        }
        return await api.put(`/Produto/UpdateFromXML`, list)
            .then(({ data }: AxiosResponse) => {
                return true;

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar produtos. ${err.response?.data || err.message}`);
                return false;
            })
    }
    async function createLancamento() {
        var obj = {
            idLancamentoEstoque: 0,
            id: 0,
            dataLancamento: new Date(),
            idPedido: 0,
            arquivoXML: '',
            comentario: 'GERADO A PARTIR DE XML',
            isEntrada: true,
            isProduto: true,
            nomeArquivo: '',
            empresaId: user.empresaSelecionada
        } as ILancamentoEstoque;
        obj.produtos = produtos.map((o) => {
            var qtd = fGetNumber(o.item.qCom);
            var mult = fGetNumber(o.produto.multiplicadorFornecedor) || 1;
            var quantidade = qtd * mult;
            return {
                idLancamentoEstoque: 0,
                idLancamentoEstoqueProduto: 0,
                lancamentoEstoqueId: 0,
                id: 0,
                idProduto: o.produto.idProduto,
                produtoId: o.produto.id,
                idMateriaPrima: 0,
                nomeProduto: o.produto.nome,
                custoUnitario: custoUnitario(o),
                quantidade: Number(quantidade.toFixed(2)),
                produto: undefined,
                materiaPrima: undefined,
                dataLancamento: obj.dataLancamento,
                isEntrada: true,
                empresaId: user.empresaSelecionada,
                materiaPrimaId: 0,
                observacao: obj.comentario
            } as ILancamentoEstoqueProduto
        });

        return await api.post(`/LancamentoEstoque/Create`, obj).then(({ data }: AxiosResponse) => {
            toast.success(`Sucesso ao criar lançamento de Estoque`);
            document.location.href = `/estoqueLancamento`;
            return true;

        }).catch((err: AxiosError) => {
            toast.error(`Erro ao gerar lançamento de estoque. ${err.response?.data || err.message}`);
            return false;
        })
    }
    async function onSubmit() {
        var errors = '';
        produtos.map((item) => {
            var p = item.produto;
            if (!p || !p.nome) {
                errors += `${item.item.xProd} - Sem referencia no sistema\n`;
            }
        });
        if (errors.length > 0) {
            toast.error(errors);
            return;
        }
        setMessage(`Atualizando Informações dos produtos...`);
        var res = await updateProdutoInfo();
        if (!res) {
            setMessage('');
            return;
        }
        setMessage(`Gerando lançamento e calculando estoque...`);
        res = await createLancamento();
        if (!res) {
            setMessage('');
            return;
        }
    }

    const quantidadeItens = () => {
        return _.sumBy(produtos, (item) => Number(item.item.qCom ?? '0'));
    }

    const valorItens = () => {
        let total = _.sumBy(produtos, (item) => {
            let qCom = fGetNumber(item.item.qCom);
            let vUnCom = fGetNumber(item.item.vUnCom);
            return (qCom * vUnCom) || 0;
        });
        return GetCurrencyBRL(total ?? 0);
    }

    const custoUnitario = (item: itemLancamento) => {
        var custoUn = fGetNumber(item.item.vUnCom);
        var multiplicador = item.produto?.multiplicadorFornecedor || 1;
        return Number((custoUn / multiplicador).toFixed(2));
    }


    if (message.length > 0) {
        return (
            <div className={styles['container-xml']}>
                <b>{message}</b>
            </div>
        )
    }
    return (
        <div className={styles.container}>

            <div style={{ padding: '10px', marginBottom: '90px' }}>
                <table className={'table'}>
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Produto XML</th>
                            <th style={{ width: '30%' }}>Produto Local</th>
                            <th style={{ width: '10%' }}>Custo Un.</th>
                            <th style={{ width: '10%' }}>Multiplicador</th>
                            <th style={{ width: '10%' }}>Quantidade</th>
                            <th style={{ width: '10%' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {produtos.map((produto, index) => {
                            return (
                                <tr>
                                    <td>{produto.item.cProd} - {produto.item.xProd}</td>
                                    <td>
                                        {produto.produto?.nome ? <>
                                            {produto.produto.cod} -  {produto.produto.nome}
                                        </> : <>
                                            <CustomButton typeButton={'main'} onClick={() => {
                                                setProdModal(index)
                                            }}>
                                                Selecione o Produto no sistema
                                            </CustomButton>
                                        </>}
                                    </td>
                                    <td><InputGroup title={''} value={custoUnitario(produto)} onChange={(v) => {
                                        onLeave(index, v.target.value, "vUnCom")
                                    }} /></td>
                                    <td><InputGroup title={''} value={produto.produto?.multiplicadorFornecedor ?? 1} onChange={(v) => {
                                        onLeave(index, v.target.value, "multiplicadorFornecedor")
                                    }} /></td>
                                    <td><InputGroup title={''} value={produto.item.qCom} onChange={(v) => {
                                        onLeave(index, v.target.value, "qCom")
                                    }} /></td>
                                    <td>{(Number(produto.item.qCom) || 0) * (Number(produto.produto?.multiplicadorFornecedor) || 1)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className={styles.footer}>
                <DataItem title={'Produtos'} value={quantidadeItens()} />
                <DataItem title={'Valor Total'} value={valorItens()} />
                <CustomButton className={styles.btn} typeButton={'main'} onClick={onSubmit}>Enviar lançamento</CustomButton>
            </div>
            {prodModal >= 0 && <SelectProdutoModal isOpen={prodModal >= 0} selectedId={0} setClose={(v) => {
                if (v) {
                    selectProduto(v);
                } else {
                    setProdModal(-1);

                }

            }} />}
        </div>
    )
}
const DataItem = ({ title, value }) => {
    return (
        <div className={styles.item}>
            <label className={styles.itemTitle}>{title}</label>
            <label className={styles.itemValue}>{value}</label>
        </div>
    )
}