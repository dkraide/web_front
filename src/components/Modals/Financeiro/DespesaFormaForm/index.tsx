import { useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import { endOfMonth, format, startOfMonth } from "date-fns";
import SelectSimNao from "@/components/Selects/SelectSimNao";
import SelectMotivoLancamento from "@/components/Selects/SelectMotivoLancamento";
import { fGetNumber } from "@/utils/functions";
import IDespesa from "@/interfaces/IDespesa";
import SelectFormaPagamento from "@/components/Selects/SelectFormaPagamento";
import IFormaPagamento from "@/interfaces/IFormaPagamento";


interface props {
    isOpen: boolean
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface relatorioProps {
    forma: string
    quantidade: number
    venda: number,
    custo: number
}
export default function DespesaFormaForm({ user, isOpen, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [relatorio, setRelatorio] = useState<relatorioProps>({} as relatorioProps)
    const [objeto, setObjeto] = useState<IDespesa>({} as IDespesa)
    const [loading, setLoading] = useState<boolean>(false)
    const [sending, setSending] = useState(false);
    const [ready, setReady] = useState(false);
    const [forma, setForma] = useState<IFormaPagamento>({} as IFormaPagamento);
    const onSubmit = async (data: any) => {
        objeto.id = 0;
        objeto.empresaId = user.empresaSelecionada;
        objeto.dataLancamento = new Date();
        objeto.valorSubTotal = fGetNumber(getValues("valorSubTotal"));
        objeto.desconto = fGetNumber(getValues("desconto"));
        objeto.acrescimo = fGetNumber(getValues("acrescimo"));
        objeto.valorTotal = fGetNumber(getValues("valorTotal"));
        objeto.descricao = data.descricao;
        objeto.dataVencimento = new Date(data.dataVencimento);
        objeto.dataPagamento = new Date(data.dataPagamento || new Date());
        objeto.pedidoReferencia = data.pedidoReferencia;
        if(objeto.desconto > objeto.valorSubTotal + objeto.acrescimo){
            toast.error(`Desconto excessivo`);
            return;
        }
        if(!objeto.motivoLancamentoId || objeto.motivoLancamentoId <= 0){
            toast.error(`Selecione um motivo de Lancamento`);
            return;
        }
        setSending(true);
        await api.post(`Despesa/CreateDespesa`, objeto)
            .then(({ data }: AxiosResponse) => {
                toast.success(`Despesa cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao criar Despesa. ${err.response?.data}`);
            })
        setSending(false);
    }
    function calculaTotal() {
        var sub = fGetNumber(getValues("valorSubTotal"));
        var desconto = fGetNumber(getValues("desconto"));
        var acrescimo = fGetNumber(getValues("acrescimo"));
        if (desconto > sub + acrescimo) {
            toast.error(`Desconto excessivo.`);
            return;
        }
        var total = sub - desconto + acrescimo;
        setValue("valorTotal", total.toFixed(2));
        setValue("acrescimo", acrescimo.toFixed(2));
        setValue("desconto", desconto.toFixed(2));
        setValue("valorSubTotal", total.toFixed(2));
        if (total < 0) {
            toast.error(`Total negativo. Desconto acima do limite`);
        }
    }

    async function pesquisarValor() {
        setLoading(true);
        var din = getValues('dataIn');
        var dfim = getValues('dataFim');
        await api.get(`/Relatorio/FormaPagamento?dataIn=${din}&dataFim=${dfim}&empresaId=${user.empresaSelecionada}&descricao=${forma.nome}`)
            .then(({ data }) => {

                if (!data || !data.venda) {
                    toast.error(`Nao foi encontrado valores para essa forma de pagamento.`);
                    return;
                }
                setRelatorio(data);
                setValue("valorForma", data.venda)
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar dados. ${err.response?.data || err.message}`);

            })
        setLoading(false);


    }
    function gerarObjeto(){
        var porcentagem = fGetNumber(getValues("porcentagem"));
        if(relatorio == null || !relatorio.venda){
            return;
        }
        if(porcentagem == 0){
            toast.error(`Defina uma porcentagem maior que zero`);
            return;
        }
        var res = (relatorio.venda * porcentagem) / 100;
        var x = fGetNumber(res.toFixed(2));
        objeto.id = 0;
        objeto.dataLancamento = new Date();
        objeto.dataVencimento = new Date();
        objeto.valorSubTotal = x;
        objeto.valorTotal = x;
        objeto.desconto = 0;
        objeto.acrescimo = 0;
        objeto.dataPagamento = new Date();
        objeto.statusLancamento = true;
        objeto.descricao = "DESPESA GERADA AUTOMATICAMENTE";
        objeto.empresaId = user.empresaSelecionada;
        objeto.localCriacao = "ONLINE";
        objeto.pedidoReferencia = "";
        setValue("pedidoReferencia", "");
        setValue("dataVencimento", format(new Date, 'yyyy-MM-dd'))
        setObjeto({...objeto});
        setTimeout(() => {
            setReady(true);
        }, 1000)
    }

    return (
        <BaseModal color={color} title={'Cadastro de Despesa por Forma de Pagamento'} isOpen={isOpen} setClose={setClose}>
            {!ready ? (
                <div className={styles.container}>
                    <InputForm type={'date'} defaultValue={format(startOfMonth(new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Inicio'} errors={errors} inputName={"dataIn"} register={register} />
                    <InputForm type={'date'} defaultValue={format(endOfMonth(new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Fim'} errors={errors} inputName={"dataFim"} register={register} />
                    <SelectFormaPagamento width={'55%'} selected={forma?.id} setSelected={(v) => { setForma(v) }} />
                    <CustomButton style={{ width: '10%', height: 45, marginTop: 10 }} disabled={loading} loading={loading} onClick={() => { pesquisarValor(); }} typeButton={"secondary"}>Confirmar</CustomButton>
                    {relatorio?.forma != null && <div style={{ width: '100%' }}>
                        <hr />
                        <div className={styles.container}>
                            <InputForm defaultValue={relatorio.venda} width={'30%'} title={'Valor (R$)'} readOnly={true} errors={errors} inputName={"valorForma"} register={register} />
                            <InputForm defaultValue={'2.00'} width={'30%'} title={'Porcentagem (%)'} errors={errors} inputName={"porcentagem"} register={register} />
                            <CustomButton style={{ width: '30%', height: 45, marginTop: 5 }} disabled={loading} loading={loading} onClick={() => {gerarObjeto() }} typeButton={"primary"}>Gerar Despesa</CustomButton>
                        </div>

                    </div>}
                </div>
            ) : (
                <div className={styles.container}>
                    <InputForm type={'date'} defaultValue={format(new Date(objeto.dataVencimento || new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Vencimento'} errors={errors} inputName={"dataVencimento"} register={register} />
                    <InputForm defaultValue={objeto.pedidoReferencia} width={'10%'} title={'Ped. Ref.'} errors={errors} inputName={"pedidoReferencia"} register={register} />
                    <SelectSimNao width={'20%'} title={'Pago'} selected={objeto.statusLancamento} setSelected={(v) => { setObjeto({ ...objeto, statusLancamento: v }) }} />
                    {objeto.statusLancamento ? <InputForm type={'date'} defaultValue={format(new Date(objeto.dataPagamento || new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Pagamento'} errors={errors} inputName={"dataPagamento"} register={register} /> :
                        <div style={{ width: '15%' }}></div>}
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