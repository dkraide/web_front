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
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { fGetNumber, sendImage, validateNumber, validateString } from "@/utils/functions";
import PictureBox from "@/components/ui/PictureBox";
import { isMobile } from "react-device-detect";


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
        classe.codigoFornecedor = data.codigoFornecedor;
        classe.multiplicadorFornecedor = fGetNumber(data.multiplicadorFornecedor);
        if (!validateString(classe.nome, 3)) {
            const message = "Informe um nome com no mínimo 3 caracteres!";
            toast.error(message);
            setSending(false);
            return;
        }
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

    function setImage() {
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
            if (str) {
                setClasse({ ...classe, localPath: str });
            } else {
                toast.error(`Erro ao enviar imagem`);
            }
            setLoading(false);
        }
    }

    return (
        <BaseModal height={'60vh'} width={'50%'} color={color} title={'Cadastro de ingrediente'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.picture} style={{ width: isMobile ? '100%' : '35%' }}>
                        <PictureBox onClick={setImage} size={'200px'} height={isMobile ? '150px' :'200px'} width={isMobile ? '150px' : '200px'} url={classe.localPath} />
                    </div>
                    <div className={styles.form}>
                        <InputForm defaultValue={classe.nome} width={isMobile ? '100%' : '75%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                        <SelectStatus width={isMobile ? '100%' : '15%'} selected={classe.status} setSelected={(v) => { setClasse({ ...classe, status: v }) }} />
                        <InputForm defaultValue={classe.valorCusto} width={'25%'} title={'Custo'} errors={errors} inputName={"valorCusto"} register={register} />
                        <InputForm defaultValue={classe.valorVenda} width={'25%'} title={'Venda'} errors={errors} inputName={"valorVenda"} register={register} />
                        <InputForm defaultValue={classe.codigoFornecedor} width={'25%'} title={'Cod. Fornecedor'} errors={errors} inputName={"codigoFornecedor"} register={register} />
                        <InputForm defaultValue={classe.multiplicadorFornecedor} width={'25%'} title={'Multiplicador'} errors={errors} inputName={"multiplicadorFornecedor"} register={register} />
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