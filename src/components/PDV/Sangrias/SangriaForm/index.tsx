import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { useForm } from "react-hook-form";
import { useState } from "react";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";
import LoadingModal from "@/components/Modals/LoadingModal";
import { format } from "date-fns";
import { LabelGroup } from "@/components/ui/LabelGroup";
import { InputForm } from "@/components/ui/InputGroup";
import SelectTipoSangria from "@/components/Selects/SelectTipoSangria";
import ISangriaReforco from "@/interfaces/ISangriaReforco";
import { fGetNumber } from "@/utils/functions";
import { toast } from "react-toastify";
import { api } from "@/services/apiClient";

interface cancelarProps {
    isOpen: boolean
    setClose: (res: boolean) => void
    caixa?: IMovimentoCaixa
    usuario: IUsuarioCaixa
}
export default function SangriaForm({ usuario, caixa, isOpen, setClose }: cancelarProps) {
    const {
        register,
        getValues,
        formState: { errors } } =
        useForm();

    const [loading, setLoading] = useState(false);
    const [isSangria, setIsSangria] = useState(1);

    if (loading) {
        return <LoadingModal isOpen={loading} setClose={() => { }} />
    }

    async function enviarSangria() {
        var valor = fGetNumber(getValues("valor"));
        if(valor <= 0){
            toast.error(`Valor invalido.`);
            return;
        }
        setLoading(true);
        var sangria = {
            id: 0,
            idSangriaReforco: 0,
            idMovimentoCaixa: caixa.idMovimentoCaixa,
            movimentoCaixaId: caixa.id,
            dataSangria: new Date(),
            valorMovimento: valor,
            isSangria: isSangria == 1,
            movimentoCaixa: undefined,
            nomeUsuario: usuario.nome,
            motivo: getValues("observacao"),
            empresaId: caixa.empresaId
        } as ISangriaReforco;
        await api.post(`/SangriaReforco/CreateSangria`, sangria)
        .then((response) => {
            toast.success(`Sucesso ao criar sangria.`);
            setClose(true);
        }).catch((err) => {
            toast.error(`Erro ao criar sangria. ${err.response?.data || err.message}`);
        })
        setLoading(false);

    }

    return (
        <BaseModal headerOff={!caixa} width={'50%'} height={'50%'} title={'Cadastro de Sangria'} isOpen={isOpen} setClose={() => { setClose(false) }}>
            <div className={styles.content}>
                <div className={styles.row}>
                    <h5>Sangria</h5>
                    <LabelGroup width={'10%'} title={'Caixa'} value={caixa.id} />
                    <LabelGroup width={'20%'} title={'Usuario'} value={usuario.nome} />
                    <LabelGroup width={'50%'} title={'Data'} value={format(new Date(), 'dd/MM/yyyy HH:mm')} />
                </div>
                <hr />
                <div className={styles.row}>
                    <SelectTipoSangria width={'50%'} selected={isSangria} setSelected={(v) => {setIsSangria(v)}}/>
                    <InputForm width={'30%'} title={'Valor'} register={register} errors={errors} inputName={'valor'} />
                    <InputForm defaultValue={'Sangria'} width={'100%'} title={'Observacao'} register={register} errors={errors} inputName={'observacao'} />
                </div>
                <div className={styles.row} style={{ justifyContent: 'flex-end' }}>
                    <CustomButton typeButton={'dark'} onClick={enviarSangria}>Cadastrar</CustomButton>

                </div>
            </div>
        </BaseModal>
    )
}



