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
import { fGetNumber , validateString , validateNumber } from "@/utils/functions";
import IEntrada from "@/interfaces/IEntrada";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function EntradaForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IEntrada>({} as IEntrada)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/Entrada/Select?id=${id}`)
                .then(({ data }: AxiosResponse<IEntrada>) => {
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
            objeto.dataRecebimento = endOfMonth(new Date());
            setObjeto(objeto);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        objeto.valorTotal = fGetNumber(getValues("valorTotal"));
        objeto.descricao = data.descricao;
        objeto.dataLancamento =new Date( data.dataLancamento);
        objeto.dataRecebimento = new Date(data.dataRecebimento || new Date());
        if(
            !validateString(objeto.descricao,3) ||
            !validateNumber(objeto.valorTotal,0.01)
        ){
            const message=
            !validateString(objeto.descricao,3)?'Informe uma descrição!':
            'Informe um valor total!';
            toast.error(message);
            setSending(false);
            return;
        }
        if(!objeto.motivoLancamentoId || objeto.motivoLancamentoId <= 0){
            toast.error(`Selecione um motivo de Lancamento`);
            return;
        }
         setSending(true);
        if (objeto.id > 0) {
            api.put(`Entrada/Update`, objeto)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Entrada atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar Entrada. ${err.response?.data}`);
                })

        } else {
            objeto.empresaId = user.empresaSelecionada;
            api.post(`Entrada/CreateEntrada`, objeto)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Entrada cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar Entrada. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    return (
        <BaseModal height={'60%'} width={'80%'} color={color} title={'Cadastro de Entrada'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={objeto.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />
                    <InputForm type={'date'} defaultValue={format(new Date(objeto.dataLancamento || new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Lancamneto'} readOnly={true} errors={errors} inputName={"dataLancamento"} register={register} />
                    <InputForm defaultValue={objeto.valorTotal} width={'20%'} title={'Total'} errors={errors} inputName={"valorTotal"} register={register} />
                    <SelectSimNao width={'20%'} title={'Pago'} selected={objeto.statusRecebimento} setSelected={(v) => { setObjeto({ ...objeto, statusRecebimento: v }) }} />
                    {objeto.statusRecebimento ? <InputForm type={'date'} defaultValue={format(new Date(objeto.dataRecebimento || new Date()), 'yyyy-MM-dd')} width={'15%'} title={'Pagamento'} errors={errors} inputName={"dataPagamento"} register={register} /> :
                        <div style={{ width: '15%' }}></div>}
                    <SelectMotivoLancamento selected={objeto.motivoLancamentoId} setSelected={(v) => {
                        setObjeto({ ...objeto, motivoLancamento: v, motivoLancamentoId: v.id })
                    }} />
                    <InputForm defaultValue={objeto.descricao} title={'Descricao'} errors={errors} inputName={"descricao"} register={register} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}