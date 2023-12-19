import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { useState } from "react";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";
import LoadingModal from "@/components/Modals/LoadingModal";
import { format } from "date-fns";
import IVenda from "@/interfaces/IVenda";
import { LabelGroup } from "@/components/ui/LabelGroup";
import CustomButton from "@/components/ui/Buttons";
import { toast } from "react-toastify";
import { api } from "@/services/apiClient";
import { AxiosError } from "axios";

interface cancelarProps {
    isOpen: boolean
    setClose: (res: boolean) => void
    venda: IVenda
    usuario: IUsuarioCaixa
}
export default function CancelarVenda({ venda, usuario, isOpen, setClose }: cancelarProps) {
    const {
        register,
        getValues,
        formState: { errors } } =
        useForm();

    const [loading, setLoading] = useState(false);


    if (loading) {
        return <LoadingModal isOpen={loading} setClose={() => { }} />
    }


    async function cancelarVenda(){
        var motivo = getValues("motivoCancelamento")?.trim();
        if(!motivo || motivo.length < 15){
           toast.error('Motivo precisa conter mais de 15 caracteres.');
           return;
        }
        setLoading(true);
        venda.motivoCancelamento = motivo;
        venda.idUsuarioCancelamento = usuario.idUsuario;
        venda.usuarioCancelamentoId = usuario.id;
        await api.post(`/Venda/Cancelar`, venda)
        .then((response) => {
            toast.success(`Venda cancelada com sucesso.`);
            setClose(true);
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao cancelar venda. ${err.response?.data || err.message}`);

        });
        setLoading(false);


    }


    return (
        <BaseModal width={'50%'} height={'50%'} title={'Cancelar venda'} isOpen={isOpen} setClose={() => { setClose(false) }}>
            <div className={styles.content}>
                <div className={styles.row}>
                    <h5>Venda</h5>
                    <LabelGroup width={'10%'} title={'Numero'} value={venda.id}/>
                    <LabelGroup width={'30%'} title={'Usuario'} value={venda.usuario?.nome || '--'}/>
                    <LabelGroup width={'30%'} title={'Data'} value={format(new Date(venda.dataVenda), 'dd/MM/yyyy HH:mm')}/>
                    <LabelGroup width={'20%'} title={'NFC-e'} value={venda.estd ? 'SIM' : 'NAO'}/>
                    <LabelGroup width={'10%'} title={'Valor'} value={`R$ ${venda.valorTotal.toFixed(2)}`}/>
                </div>
                <div className={styles.row}>
                    <h5>Cancelamento</h5>
                    <LabelGroup width={'50%'} title={'Usuario'} value={usuario.nome}/>
                    <LabelGroup width={'50%'} title={'Data Cancelamento'} value={format(new Date(), 'dd/MM/yyyy HH:mm')}/>
                    <InputForm register={register} errors={errors} inputName={'motivoCancelamento'} readOnly={!venda.statusVenda} defaultValue={venda.motivoCancelamento} title={'Informe o motivo do cancelamento. (Minimo 15 caracteres)'}/>
                </div>
                <div className={styles.row} style={{justifyContent: 'flex-end'}}>
                    <CustomButton typeButton={'danger'} onClick={cancelarVenda}>Cancelar venda</CustomButton>

                </div>

               
            </div>
        </BaseModal>
    )
}



