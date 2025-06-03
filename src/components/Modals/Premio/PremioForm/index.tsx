import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import {InputForm} from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import { isMobile, validateString } from "@/utils/functions";
import IPremio from "@/interfaces/IPremio";
import KRDToggleSwitch from "@/components/ui/KRDToggleSwitch";
import SelectProduto from "@/components/Selects/SelectProduto";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";



interface props {
    isOpen: boolean
    premioId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function PremioForm({user, isOpen, premioId, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();
    const [premio, setPremio] = useState<IPremio>({} as IPremio)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [isProduto, setIsProduto] = useState(true);
    useEffect(() => {
        if (premioId > 0) {
            api.get(`/Premio/Select?id=${premioId}`)
                .then(({ data }: AxiosResponse<IPremio>) => {
                    setPremio(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar premio. ${err.message}`)
                    setLoading(false);
                })
        }else{
            premio.id = 0;
            premio.status = true;
            premio.quantidadePontos = 1;
            premio.produtoId = 0;
            setPremio(premio);
            setLoading(false);
        }

    }, []);

    const handleSwitchChanged = () => {
        let v = !isProduto;
        if(v){
            setPremio({
                ...premio,
                classeMaterial: undefined,
                classeMaterialId: 0,
                idClasseMaterial: 0
            })
        }else{
            setPremio({
                ...premio,
                produto: undefined,
                produtoId: 0,
                idProduto: 0
            })
        }
        setIsProduto(prev => !prev);
    }
    const onSubmit = async (data: any) =>{
        setSending(true);
        premio.descricao = data.descricao;
        premio.quantidadePontos = data.quantidadePontos;
        if(!validateString(premio.descricao,3)){
            const message ="Crie uma descricao com no mínimo 3 caracteres!";
            toast.error(message);
            setSending(false);
            return;
        }
        if(premio.id > 0){
            api.put(`Premio/Update`, premio)
            .then(({data}: AxiosResponse) => {
                toast.success(`premio atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar premio. ${err.response?.data}`);
            })

        }else{
            premio.empresaId = user.empresaSelecionada;
            api.post(`Premio/Create`, premio)
            .then(({data}: AxiosResponse) => {
                toast.success(`premio cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao criar premio. ${err.response?.data}`);
            })
        }
        setSending(false);
    }
    return (
        <BaseModal height={'100vh'} width={'50%'} color={color} title={'Cadastro de Premio'} isOpen={isOpen} setClose={setClose}>
            {(loading) ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={premio.descricao} width={'70%'} title={'Descricao'} errors={errors} inputName={"descricao"} register={register} />
                    <InputForm defaultValue={premio.quantidadePontos} width={'15%'} title={'Pontos'} errors={errors} inputName={"quantidadePontos"} register={register} />
                    <SelectStatus  width={'15%'} selected={premio.status} setSelected={(v) => {setPremio({...premio, status: v})}} />
                    <KRDToggleSwitch labelOff={'Por Grupo'} labelOn={'Por Produto'} onToggle={handleSwitchChanged} isOn={isProduto}/>
                    {isProduto ? (
                        <SelectProduto selected={premio.produtoId ?? 0} setSelected={(p) => {
                            setPremio({...premio, produtoId: p.id, idProduto: p.idProduto, produto: p, descricao: p.nome } as IPremio);
                            setValue('descricao', p.nome);
                        }}/>

                    ) : (
                        <SelectClasseMaterial selected={premio.classeMaterialId ?? 0} setSelected={(p) => {
                            setPremio({...premio, classeMaterialId: p.id, idClasseMaterial: p.idClasseMaterial, classeMaterial: p, descricao: p.nomeClasse } as IPremio);
                            setValue('descricao', p.nomeClasse);
                        }}/>
                    )}
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}




