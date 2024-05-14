import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import IMotivoLancamento from "@/interfaces/IMotivoLancamento";
import IDespesa from "@/interfaces/IDespesa";
import { endOfMonth } from "date-fns";
import { format } from "date-fns";
import SelectSimNao from "@/components/Selects/SelectSimNao";
import SelectMotivoLancamento from "@/components/Selects/SelectMotivoLancamento";
import { fGetNumber } from "@/utils/functions";
import SelectTipoDespesa from "@/components/Selects/SelectTipoDespesa";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function DespesaForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IDespesa>({} as IDespesa)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/Despesa/Select?id=${id}`)
                .then(({ data }: AxiosResponse<IDespesa>) => {
                    setObjeto(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            objeto.id = 0;
            objeto.dataLancamento = new Date();
            objeto.dataVencimento = endOfMonth(new Date());
            objeto.dataCompetencia = endOfMonth(new Date());
            objeto.tipoDespesa = 'DESPESA FIXA';
            setObjeto(objeto);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        objeto.valorSubTotal = fGetNumber(getValues("valorSubTotal"));
        objeto.desconto = fGetNumber(getValues("desconto"));
        objeto.acrescimo = fGetNumber(getValues("acrescimo"));
        objeto.valorTotal = fGetNumber(getValues("valorTotal"));
        objeto.descricao = data.descricao;
        objeto.dataLancamento =new Date( data.dataLancamento);
        objeto.dataVencimento = new Date(data.dataVencimento);
        objeto.dataPagamento = new Date(data.dataPagamento || new Date());
        objeto.pedidoReferencia = data.pedidoReferencia;
        objeto.dataCompetencia = new Date(data.dataCompetencia);
        if(objeto.desconto > objeto.valorSubTotal + objeto.acrescimo){
            toast.error(`Desconto excessivo`);
            return;
        }
        if(!objeto.motivoLancamentoId || objeto.motivoLancamentoId <= 0){
            toast.error(`Selecione um motivo de Lancamento`);
            return;
        }
         setSending(true);
        if (objeto.id > 0) {
            api.put(`Despesa/Update`, objeto)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Despesa atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar Despesa. ${err.response?.data}`);
                })

        } else {
            objeto.empresaId = user.empresaSelecionada;
            api.post(`Despesa/CreateDespesa`, objeto)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Despesa cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar Despesa. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    function calculaTotal(){
        var sub = fGetNumber(getValues("valorSubTotal"));
        var desconto = fGetNumber(getValues("desconto"));
        var acrescimo = fGetNumber(getValues("acrescimo"));
        if(desconto > sub + acrescimo){
             toast.error(`Desconto excessivo.`);
             return;
        }
        var total = sub -desconto + acrescimo;
        setValue("valorTotal", total.toFixed(2));
        setValue("acrescimo", acrescimo.toFixed(2));
        setValue("desconto", desconto.toFixed(2));
        setValue("valorSubTotal", total.toFixed(2));
        if(total < 0){
            toast.error(`Total negativo. Desconto acima do limite`);
        }
    }
    return (
        <BaseModal height={'70%'} width={'80%'} color={color} title={'Cadastro de Despesa'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={objeto.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />
                    <InputForm type={'date'} defaultValue={format(new Date(objeto.dataLancamento || new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Lancamneto'} readOnly={true} errors={errors} inputName={"dataLancamento"} register={register} />
                    <InputForm type={'date'} defaultValue={format(new Date(objeto.dataVencimento || new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Vencimento'} errors={errors} inputName={"dataVencimento"} register={register} />
                    <InputForm defaultValue={objeto.pedidoReferencia} width={'10%'} title={'Ped. Ref.'} errors={errors} inputName={"pedidoReferencia"} register={register} />
                    <SelectSimNao width={'20%'} title={'Pago'} selected={objeto.statusLancamento} setSelected={(v) => { setObjeto({ ...objeto, statusLancamento: v }) }} />
                    {objeto.statusLancamento ? <InputForm type={'date'} defaultValue={format(new Date(objeto.dataPagamento || new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Pagamento'} errors={errors} inputName={"dataPagamento"} register={register} /> :
                        <div style={{ width: '15%' }}></div>}
                    <SelectTipoDespesa width={'70%'} selected={objeto.tipoDespesa} setSelected={(v) => {
                        setObjeto({ ...objeto, tipoDespesa: v })
                    }} />
                    <InputForm type={'date'} defaultValue={format(new Date(objeto.dataCompetencia || new Date()), 'yyyy-MM-dd')} width={'30%'} title={'Competencia'} errors={errors} inputName={"dataCompetencia"} register={register} />
                    <SelectMotivoLancamento selected={objeto.motivoLancamentoId} setSelected={(v) => {
                        setObjeto({ ...objeto, motivoLancamento: v, motivoLancamentoId: v.id })
                    }} />
                    <InputForm defaultValue={objeto.descricao} title={'Descricao'} errors={errors} inputName={"descricao"} register={register} />
                    <InputForm onBlur={calculaTotal} defaultValue={objeto.valorSubTotal} width={'20%'} title={'Sub total'} errors={errors} inputName={"valorSubTotal"} register={register} />
                    <InputForm onBlur={calculaTotal} defaultValue={objeto.desconto} width={'20%'} title={'Descontos'} errors={errors} inputName={"desconto"} register={register} />
                    <InputForm onBlur={calculaTotal} defaultValue={objeto.acrescimo} width={'20%'} title={'Acrescimos'} errors={errors} inputName={"acrescimo"} register={register} />
                    <InputForm readOnly={true} defaultValue={objeto.valorTotal} width={'20%'} title={'Total'} errors={errors} inputName={"valorTotal"} register={register} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}