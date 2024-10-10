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
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { fGetNumber, sendImage } from "@/utils/functions";
import PictureBox from "@/components/ui/PictureBox";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function MateriaPrimaForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [classe, setClasse] = useState<IMateriaPrima>({} as IMateriaPrima)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/MateriaPrima/Select?id=${id}`)
                .then(({ data }: AxiosResponse<IMateriaPrima>) => {
                    setClasse(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            classe.id = 0;
            classe.status = true;
            setClasse(classe);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        setSending(true);
        classe.nome = data.nome;
        classe.valorCusto = fGetNumber(data.valorCusto);
        classe.valorVenda = fGetNumber(data.valorVenda);
        if (classe.id > 0) {
            api.put(`MateriaPrima/UpdateMateria`, classe)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`ingrediente atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar ingrediente. ${err.response?.data}`);
                })

        } else {
            classe.empresaId = user.empresaSelecionada;
            api.post(`MateriaPrima/Create`, classe)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`ingrediente cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar ingrediente. ${err.response?.data}`);
                })
        }
        setSending(false);
    }

    function setImage(){
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            setTimeout(() => {
            }, 500)
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            setLoading(true);
            var str = await sendImage(files);
            if(str){
                setClasse({...classe, localPath: str});
            }else{
                toast.error(`Erro ao enviar imagem`);
            }
            setLoading(false);
        }
    }
 
    return (
        <BaseModal height={'50vh'} width={'50%'} color={color} title={'Cadastro de ingrediente'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.picture}>
                        <PictureBox onClick={setImage} size={'200px'} height={'200px'} width={'200px'} url={classe.localPath}/>
                        
                    </div>
                    <div className={styles.form}>
                        <InputForm defaultValue={classe.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />
                        <InputForm defaultValue={classe.nome} width={'75%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                        <SelectStatus width={'15%'} selected={classe.status} setSelected={(v) => { setClasse({ ...classe, status: v }) }} />
                        <InputForm defaultValue={classe.valorCusto} width={'25%'} title={'Custo'} errors={errors} inputName={"valorCusto"} register={register} />
                        <InputForm defaultValue={classe.valorVenda} width={'25%'} title={'Venda'} errors={errors} inputName={"valorVenda"} register={register} />
                    </div>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}