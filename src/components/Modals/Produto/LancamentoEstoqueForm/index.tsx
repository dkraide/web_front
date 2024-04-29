import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm, InputGroup } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import ILancamentoEstoque from "@/interfaces/ILancamentoEstoque";
import CustomTable from "@/components/ui/CustomTable";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SelectProduto from "@/components/Selects/SelectProduto";
import IProduto from "@/interfaces/IProduto";
import { format } from "date-fns";
import SelectEntradaSaida from "@/components/Selects/SelectEntradaSaida";
import { fGetNumber, fgetDate } from "@/utils/functions";
import ILancamentoEstoqueProduto from "@/interfaces/ILancamentoEstoqueProduto";
import _ from "lodash";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function LancamentoEstoqueForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [lancamento, setLancamento] = useState<ILancamentoEstoque>({} as ILancamentoEstoque)
    const [produtos, setProdutos] = useState<ILancamentoEstoqueProduto[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [prod, setProd] = useState<IProduto>();
    const [ignore, setIgnore] = useState<number[]>([])
    useEffect(() => {
        if (id > 0) {
            api.get(`/LancamentoEstoque/Select?id=${id}`)
                .then(({ data }: AxiosResponse<ILancamentoEstoque>) => {
                    setLancamento(data);
                    setProdutos(data.produtos);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            lancamento.id = 0;
            lancamento.dataLancamento = new Date();
            lancamento.isEntrada = true;
            setLancamento(lancamento);
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        if (!prod) {
            return;
        }
        setValue('custoUnitario', prod.valorCompra.toFixed(2));
        if (prod.multiplicadorFornecedor <= 0) {
            prod.multiplicadorFornecedor = 1;
        }
        setValue('multiplicador', prod.multiplicadorFornecedor.toString())
    }, [prod]);

    useEffect(() => {
        if ((!produtos || produtos.length == 0) && ignore.length == 0) {
            return;
        }
        var list = [];
        produtos.map(p => list.push(p.produtoId));
        setProd(undefined);
        setIgnore(list);
    }, [produtos])

    const onSubmit = async (data: any) => {
        if (lancamento.id > 0) {
            setClose();
            return;
        }
        setSending(true);
        lancamento.idPedido = data.idPedido || 0;
        lancamento.produtos = produtos;
        if (lancamento.id > 0) {
            await api.put(`LancamentoEstoque/Update`, lancamento)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Lancamento atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar Lancamento. ${err.response?.data}`);
                })

        } else {
            lancamento.empresaId = user.empresaSelecionada;
            lancamento.isProduto = true;
            await api.post(`LancamentoEstoque/Create`, lancamento)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Lancamento cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar Lancamento. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    async function removeItem(produtoId) {
        if (sending) {
            return;
        }
        if (lancamento.id > 0) {
            toast.error(`Erro ao excluir item. Lancamento ja contabilizado no estoque.`);
            return;
        }

        var index = _.findIndex(produtos, p => p.produtoId == produtoId);
        if (index < 0) {
            toast.error(`Erro ao excluir item.`);
        }
        if (produtos[index].id > 0) {
            setSending(true);
            var res = await api.delete(`/LancamentoEstoque/RemoveItem?id=${produtos[index].id}`)
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao excluir item na nuvem. ${err.response?.data || err.message}`);
                    return false;
                })
            setSending(false);
            if (res === false) {
                return;
            }
        }
        produtos.splice(index, 1);
        setProdutos([...produtos]);

    }
    function getTotal(isQtd: boolean){
        var ret = 0;
        if(isQtd){
            ret = _.sumBy(produtos, p => p.quantidade);
        }else{
            ret = _.sumBy(produtos, p => p.custoUnitario * p.quantidade);
        }
        return ret;

    }
    function addItem() {
        if (!prod || !prod.id || prod.id <= 0) {
            toast.error(`Selecione um produto`);
            return;
        }
        var qntd = fGetNumber(getValues('quantidade'));
        if (qntd <= 0) {
            toast.error(`Quantidade precisa ser maior que zero`);
            return;
        }
        var ind = _.findIndex(produtos, p => p.produtoId == prod.id);
        if (ind >= 0) {
            toast.error(`Produto ja adicionado ao lancamento`);
            return;
        }
        var multiplicador = fGetNumber(getValues('multiplicador'));

        if (multiplicador == 0) {
            multiplicador = 1;
        };
        qntd = qntd * multiplicador;
        var custo = fGetNumber(getValues('custoUnitario'));
        var obj = {
            id: 0,
            idLancamentoEstoque: lancamento.idLancamentoEstoque,
            idLancamentoEstoqueProduto: 0,
            lancamentoEstoqueId: lancamento.id,
            idProduto: prod.idProduto,
            produtoId: prod.id,
            idMateriaPrima: 0,
            nomeProduto: prod.nome,
            custoUnitario: custo,
            quantidade: qntd,
            produto: prod,
            materiaPrima: undefined,
            dataLancamento: new Date(),
            isEntrada: lancamento.isEntrada,
            empresaId: user.empresaSelecionada,
            materiaPrimaId: 0
        } as ILancamentoEstoqueProduto;
        setProdutos([...produtos, obj]);
        toast.success(`Produto adicionado com sucesso`);
    }
    const columns = [
        {
            name: '#',
            cell: ({ produtoId }) => lancamento.id > 0 ? <></> : <CustomButton onClick={() => { removeItem(produtoId) }} typeButton={'danger'}><FontAwesomeIcon icon={faTrash} /></CustomButton>,
            sortable: true,
            grow: 0,
            width: '10%'
        },
        {
            name: 'Produto',
            selector: row => row['nomeProduto'],
            sortable: true,
            grow: 0,
            width: '60%'
        },
        {
            name: 'Qntd',
            selector: row => row['quantidade'],
            cell: row => row.quantidade.toFixed(2),
            sortable: true,
            grow: 0,
            width: '15%'
        },
        {
            name: 'Custo Un.',
            selector: row => row['custoUnitario'],
            cell: row => `R$ ${row.custoUnitario.toFixed(2)}`,
            sortable: true,
            grow: 0,
            width: '15%'
        },
    ]
    return (
        <BaseModal height={'90%'} width={'90%'} color={color} title={'Cadastro de Lancamento de Estoque'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.box}>
                        <InputForm readOnly={true} width={'10%'} title={'Online'} errors={errors} register={register} inputName={'id'} defaultValue={lancamento.id} />
                        <InputForm readOnly={true} width={'10%'} title={'Local'} errors={errors} register={register} inputName={'idLancamentoEstoque'} defaultValue={lancamento.idLancamentoEstoque} />
                        <InputForm readOnly={true} width={'20%'} title={'Data'} errors={errors} register={register} inputName={'dataLancamento'} defaultValue={format(fgetDate(lancamento?.dataLancamento.toString()), 'dd/MM/yyyy')} />
                        <InputForm readOnly={lancamento.idLancamentoEstoque > 0} width={'10%'} title={'Nro Ref'} errors={errors} register={register} inputName={'idPedido'} defaultValue={lancamento.idPedido} />
                        <SelectEntradaSaida width={'20%'} selected={lancamento.isEntrada ? 1 : 0} setSelected={(v) => {
                            if (lancamento.id > 0) {
                                return;
                            }
                            setLancamento({ ...lancamento, isEntrada: v })
                        }} />
                    </div>
                    <hr />
                    {lancamento.id > 0 ? (
                        <div className={styles.box}>
                            <h3>Lancamento ja contabilizado no estoque. Impossivel modifica-lo</h3>
                        </div>
                    ) : (
                        <div className={styles.box}>
                            <h3>Adicionar Itens</h3>
                            <SelectProduto ignore={ignore} width={'50%'} selected={prod?.id || 0} setSelected={setProd} />
                            <InputForm width={'15%'} errors={errors} register={register} inputName={'quantidade'} title={'Qntd'} />
                            <InputForm width={'15%'} errors={errors} register={register} inputName={'multiplicador'} title={'Multiplicador'} />
                            <InputForm width={'15%'} errors={errors} register={register} inputName={'custoUnitario'} title={'Custo Un.'} />
                            <CustomButton onClick={addItem} typeButton={'dark'} style={{ height: 'fit-content', marginTop: '15px' }}>Adicionar</CustomButton>
                        </div>)}
                    <hr />
                    <div>
                        <CustomTable columns={columns} data={produtos} />
                    </div>
                    <div className={styles.button}>
                        <InputGroup width={'15%'} readOnly={true}  value={`R$ ${getTotal(false).toFixed(2)}`} title={'Custo Total'} />
                        <InputGroup width={'15%'} readOnly={true}   value={`${getTotal(true).toFixed(2)}`}  title={'Qtd Total'} />
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}