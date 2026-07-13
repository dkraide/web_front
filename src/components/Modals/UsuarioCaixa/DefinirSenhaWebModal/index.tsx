import { useState } from "react";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { api } from "@/services/apiClient";
import { InputForm } from "@/components/ui/InputGroup";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import styles from './styles.module.scss';

interface props {
    isOpen: boolean
    usuarioId: number
    usuarioNome: string
    setClose: (res?: boolean) => void
}

export default function DefinirSenhaWebModal({ isOpen, usuarioId, usuarioNome, setClose }: props) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [sending, setSending] = useState(false);

    const onSubmit = async (data: any) => {
        if (!data.novaSenha || data.novaSenha.length < 4) {
            toast.error('A senha deve ter pelo menos 4 caracteres.');
            return;
        }

        setSending(true);
        api.post(`/v2/Usuario/${usuarioId}/senha-web`, { novaSenha: data.novaSenha })
            .then(() => {
                toast.success('Senha web definida com sucesso!');
                setClose(true);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao definir senha web. ${err.response?.data || err.message}`);
            })
            .finally(() => setSending(false));
    }

    return (
        <BaseModal title={'Definir Senha Web'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                <p className={styles.hint}>
                    Definindo a senha de acesso web para <strong>{usuarioNome}</strong>.
                    Essa senha é diferente da senha do frente de caixa e é usada só
                    para login no gestor.
                </p>
                <InputForm
                    width={'100%'}
                    title={'Nova senha'}
                    type={'password'}
                    errors={errors}
                    inputName={'novaSenha'}
                    register={register}
                />
                <div className={styles.button}>
                    <CustomButton onClick={() => setClose()} typeButton={'secondary'}>Cancelar</CustomButton>
                    <CustomButton typeButton={'dark'} loading={sending} onClick={() => handleSubmit(onSubmit)()}>
                        Salvar
                    </CustomButton>
                </div>
            </div>
        </BaseModal>
    )
}