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
import IProduto from "@/interfaces/IProduto";
import ILancamentoEstoqueProduto from "@/interfaces/ILancamentoEstoqueProduto";
import { fGetNumber } from "@/utils/functions";
import SelectEntradaSaida from "@/components/Selects/SelectEntradaSaida";
import IMateriaPrima from "@/interfaces/IMateriaPrima";


interface props {
    isOpen: boolean
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
    ingrediente: IMateriaPrima
}
export default function IngredienteAjusteEstoqueForm({ ingrediente, user, isOpen, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [sending, setSending] = useState(false)
    const [isEntrada, setIsEntrada] = useState(true);
    const [obj, setObj] = useState<ILancamentoEstoqueProduto>({} as ILancamentoEstoqueProduto)

    const onSubmit = async (data: any) => {
        setSending(true);
        obj.idLancamentoEstoque = -1;
        obj.idLancamentoEstoqueProduto = 0;
        obj.lancamentoEstoqueId = -1;
        obj.id = 0;
        obj.idProduto = 0;
        obj.produtoId = 0;
        obj.idMateriaPrima = ingrediente.idMateriaPrima;
        obj.materiaPrimaId = ingrediente.id;
        obj.nomeProduto = ingrediente.nome;
        obj.custoUnitario = fGetNumber(data.custoUnitario);
        obj.quantidade = fGetNumber(data.quantidade);
        obj.dataLancamento = new Date();
        obj.isEntrada = isEntrada;
        obj.empresaId = user.empresaSelecionada;
        obj.observacao = data.observacao || "Ajuste rapido de estoque de ingrediente";
        if(obj.quantidade == 0){
            toast.error(`Quantidade precisa ser maior que zero`);
            setSending(false);
            return;
        }

        api.post(`LancamentoEstoque/AjusteRapido`, obj)
            .then(({ data }: AxiosResponse) => {
                toast.success(`objeto cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao criar objeto. ${err.response?.data}`);
            })
        setSending(false);
    }

    return (
        <BaseModal height={'50%'} width={'50%'} color={color} title={'Ajuste de Estoque Rapido de Ingrediente'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                <InputGroup title={'Ingrediente'} value={ingrediente.nome}/>
                 <InputForm width={'100%'} register={register} errors={errors} inputName={'observacao'} title={'Observacao'} defaultValue={"Ajuste rapido de estoque de ingrediente"}/>
                <SelectEntradaSaida width={'30%'} selected={isEntrada} setSelected={setIsEntrada}/>
                <InputForm width={'30%'} register={register} errors={errors} inputName={'quantidade'} title={'Quantidade'}/>
                <InputForm width={'30%'} register={register} errors={errors} inputName={'custoUnitario'} title={'Custo Unitario'} defaultValue={ingrediente.valorCusto.toFixed(2)}/>

                <div className={styles.button}>
                    <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                    <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                </div>


            </div>
        </BaseModal>
    )
}
