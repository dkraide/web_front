import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import SelectStatus from "@/components/Selects/SelectStatus";
import IFormaPagamento from "@/interfaces/IFormaPagamento";
import SelectSimNao from "@/components/Selects/SelectSimNao";
import BaseModal from "../../Base/Index";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";


interface props {
    isOpen: boolean
    classeId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function UsuarioCaixaForm({ user, isOpen, classeId, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [obj, setObj] = useState<IUsuarioCaixa>({} as IUsuarioCaixa)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (classeId > 0) {
            api.get(`/Usuario/Select?id=${classeId}`)
                .then(({ data }: AxiosResponse<IUsuarioCaixa>) => {
                    setObj(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            obj.id = 0;
            setObj(obj);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        obj.nome = data.nome;
        obj.login = data.login;
        obj.senha = data.senha;
        if (obj.id > 0) {
            api.put(`Usuario/UpdateUsuario`, obj)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Usuario atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar Usuario. ${err.response?.data}`);
                })

        } else {
            obj.empresaId = user.empresaSelecionada;
            api.post(`Usuario/Create`, obj)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Usuario cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criarUsuario. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    return (
        <BaseModal color={color} title={'Cadastro de Usuario'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={obj.nome} width={'40%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                    <InputForm defaultValue={obj.login} width={'30%'} title={'Usuario'} errors={errors} inputName={"login"} register={register} />
                    <InputForm defaultValue={obj.senha} width={'30%'} title={'Senha'} errors={errors} inputName={"senha"} register={register} />
                    <SelectSimNao width={'30%'} title={'Menu Sat'} selected={obj.menuSAT} setSelected={(v) => { setObj({ ...obj, menuSAT: v }) }} />
                    <SelectSimNao width={'30%'} title={'cadastro Produto'} selected={obj.cadastroProduto} setSelected={(v) => { setObj({ ...obj, cadastroProduto: v }) }} />
                    <SelectSimNao width={'30%'} title={'menu Promocao'} selected={obj.menuPromocao} setSelected={(v) => { setObj({ ...obj, menuPromocao: v }) }} />
                    <SelectSimNao width={'30%'} title={'visualiza Lucro Produto'} selected={obj.visualizaLucroProduto} setSelected={(v) => { setObj({ ...obj, visualizaLucroProduto: v }) }} />
                    <SelectSimNao width={'30%'} title={'lancar Remessa Compra'} selected={obj.lancarRemessaCompra} setSelected={(v) => { setObj({ ...obj, lancarRemessaCompra: v }) }} />
                    <SelectSimNao width={'30%'} title={'visualiza Vendas Antigas'} selected={obj.visualizaVendasAntigas} setSelected={(v) => { setObj({ ...obj, visualizaVendasAntigas: v }) }} />
                    <SelectSimNao width={'30%'} title={'venda Diaria'} selected={obj.vendaDiaria} setSelected={(v) => { setObj({ ...obj, vendaDiaria: v }) }} />
                    <SelectSimNao width={'30%'} title={'valor Fechamento'} selected={obj.valorFechamento} setSelected={(v) => { setObj({ ...obj, valorFechamento: v }) }} />
                    <SelectSimNao width={'30%'} title={'altera ValorCarrinho'} selected={obj.alteraValorCarrinho} setSelected={(v) => { setObj({ ...obj, alteraValorCarrinho: v }) }} />
                    <SelectSimNao width={'30%'} title={'altera DescontoVenda'} selected={obj.alteraDescontoVenda} setSelected={(v) => { setObj({ ...obj, alteraDescontoVenda: v }) }} />
                    <SelectSimNao width={'30%'} title={'visualizar Estoque Pesquisa'} selected={obj.visualizarEstoquePesquisa} setSelected={(v) => { setObj({ ...obj, visualizarEstoquePesquisa: v }) }} />
                    <SelectSimNao width={'30%'} title={'remove Produto'} selected={obj.removeProduto} setSelected={(v) => { setObj({ ...obj, removeProduto: v }) }} />
                    <SelectSimNao width={'30%'} title={'materia Prima'} selected={obj.materiaPrima} setSelected={(v) => { setObj({ ...obj, materiaPrima: v }) }} />
                    <SelectSimNao width={'30%'} title={'menu Tributacao'} selected={obj.menuTributacao} setSelected={(v) => { setObj({ ...obj, menuTributacao: v }) }} />
                    <SelectSimNao width={'30%'} title={'cancelar Venda'} selected={obj.cancelarVenda} setSelected={(v) => { setObj({ ...obj, cancelarVenda: v }) }} />
                    <SelectSimNao width={'30%'} title={'menu Empresa'} selected={obj.menuEmpresa} setSelected={(v) => { setObj({ ...obj, menuEmpresa: v }) }} />
                    <SelectSimNao width={'30%'} title={'menu Relatorio'} selected={obj.menuRelatorio} setSelected={(v) => { setObj({ ...obj, menuRelatorio: v }) }} />
                    <SelectSimNao width={'30%'} title={'menu Historico'} selected={obj.menuHistorico} setSelected={(v) => { setObj({ ...obj, menuHistorico: v }) }} />
                    <SelectSimNao width={'30%'} title={'menu Produto'} selected={obj.menuProduto} setSelected={(v) => { setObj({ ...obj, menuProduto: v }) }} />
                    <SelectSimNao width={'30%'} title={'editar Comanda'} selected={obj.editarComanda} setSelected={(v) => { setObj({ ...obj, editarComanda: v }) }} />
                    <SelectSimNao width={'30%'} title={'Imp. Prod. Fechamento'} selected={obj.imprimeProdutoFechamento} setSelected={(v) => { setObj({ ...obj, imprimeProdutoFechamento: v }) }} />
                    <SelectSimNao width={'30%'} title={'Remove Prod. Comanda'} selected={obj.removeItemComanda} setSelected={(v) => { setObj({ ...obj, removeItemComanda: v }) }} />
                    <SelectSimNao width={'30%'} title={'finaliza Venda Sem Estoque'} selected={obj.finalizaVendaSemEstoque} setSelected={(v) => { setObj({ ...obj, finalizaVendaSemEstoque: v }) }} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}