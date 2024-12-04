import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import {InputForm} from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import { apiIBPT } from "@/services/apiIBPT";
import { fGetNumber, fGetOnlyNumber , fValidateNumer,validateString} from "@/utils/functions";
import ITributacao from "@/interfaces/ITributacao";
import SelectStatus from "@/components/Selects/SelectStatus";
import SelectICMS from "@/components/Selects/SelectICMS";
import SelectPISCofins from "@/components/Selects/SelectPISCofins";
import SelectOrigem from "@/components/Selects/SelectOrigem";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function TributacaoForm({user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [obj, setObj] = useState<ITributacao>({} as ITributacao)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/Tributacao/Select?id=${id}`)
                .then(({ data }: AxiosResponse<ITributacao>) => {
                    setObj(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }else{
            obj.id = 0;
            obj.status = true;
            obj.cstOrigem = 0;
            obj.cstIcms = 102;
            obj.cstPis = 49;
            obj.cstCofins = 49;
            setObj(obj);
            setValue("cfop", 5405);
            setLoading(false);
        }

    }, []);
    async function getNCM(){
            setValue("descricao", "--")
            setValue("federal", "--")
            setValue("estadual", "--")
            setValue("municipal", "--")
            setValue("ex", "--")
        apiIBPT.get(`&codigo=${fGetOnlyNumber(getValues('ncm'))}`)
        .then(({data}: AxiosResponse) => {
            setValue("descricao", data.Descricao)
            setValue("federal", data.Nacional?.toFixed(2) || "")
            setValue("estadual", data.Estadual?.toFixed(2) || "")
            setValue("municipal", data.Municipal?.toFixed(2) || "")
            setValue("ex", data.ex)
        })
        .catch((err: AxiosError) => {
             toast.error(`Erro ao buscar NCM. ${err.response?.data}`);
             setValue("descricao", "")
             setValue("federal", "")
             setValue("estadual", "")
             setValue("municipal", "")
             setValue("ex", "")
        });
    }

    const onSubmit = async (data: any) =>{
        setSending(true);
        obj.descricao = data.descricao;
        obj.ncm = data.ncm;
        obj.cfop = data.cfop;
        obj.cest = data.cest;
        obj.federal = fGetNumber(data.federal);
        obj.estadual = fGetNumber(data.estadual);
        obj.municipal = fGetNumber(data.municipal);
        if(!validateString(obj.ncm,8)){
            const message='Informe um NCM válido!';
            toast.error(message);
            setSending(false);
            return;
        }
        if(obj.id > 0){
            api.put(`Tributacao/Update`, obj)
            .then(({data}: AxiosResponse) => {
                toast.success(`Tributação atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar Tributação. ${err.response?.data}`);
            })

        }else{
            obj.empresaId = user.empresaSelecionada;
            api.post(`Tributacao/Create`, obj)
            .then(({data}: AxiosResponse) => {
                toast.success(`Tributação cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao criar Tributação. ${err.response?.data}`);
            })
        }
        setSending(false);
    }
    return (
        <BaseModal height={'80%'} width={'80%'} color={color} title={'Cadastro de Tributação'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <InputForm width={'15%'} onBlur={() => {getNCM()}} defaultValue={obj.ncm}  title={'NCM'} errors={errors} inputName={"ncm"} register={register} />
                    <InputForm width={'70%'} defaultValue={obj.descricao} title={'Descrição'} errors={errors} inputName={"descricao"} register={register} />
                    <SelectStatus width={'15%'} selected={obj.status} setSelected={(v) => {setObj({...obj, status: v})}} />
                    <InputForm width={'20%'} defaultValue={obj.cfop}  title={'CFOP'} errors={errors} inputName={"cfop"} register={register} />
                    <InputForm width={'20%'} defaultValue={obj.cest}  title={'CEST'} errors={errors} inputName={"cest"} register={register} />
                    <InputForm width={'20%'} defaultValue={obj.federal}  title={'IBPT Federal'} errors={errors} inputName={"federal"} register={register} />
                    <InputForm width={'20%'} defaultValue={obj.estadual}  title={'IBPT Estadual'} errors={errors} inputName={"estadual"} register={register} />
                    <InputForm width={'20%'} defaultValue={obj.municipal}  title={'IBPT Municipal'} errors={errors} inputName={"municipal"} register={register} />
                    <SelectICMS width={'100%'} selected={obj.cstIcms} setSelected={(v) => {setObj({...obj, cstIcms: v})}} />
                    <SelectPISCofins width={'100%'} title={'PIS'} selected={obj.cstCofins} setSelected={(v) => {setObj({...obj, cstCofins: v})}} />
                    <SelectPISCofins width={'100%'} title={'COFINS'} selected={obj.cstPis} setSelected={(v) => {setObj({...obj, cstPis: v})}} />
                    <SelectOrigem width={'100%'} selected={obj.cstOrigem} setSelected={(v) => {setObj({...obj, cstOrigem: v})}} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}