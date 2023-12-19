import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import IVendaProduto from "@/interfaces/IVendaProduto";
import SelectProduto from "@/components/Selects/SelectProduto";
import { useState } from "react";
import IProduto from "@/interfaces/IProduto";
import { useForm } from "react-hook-form";
import { InputForm } from "@/components/ui/InputGroup";
import { fGetNumber, onFocus } from "@/utils/functions";
import { toast } from "react-toastify";

interface cancelarProps {
    isOpen: boolean
    vendaProduto: IVendaProduto
    setClose: (res: IVendaProduto | undefined) => void
}
export default function EditItem({ vendaProduto, isOpen, setClose }: cancelarProps) {

    const [vp, setVp] = useState(vendaProduto);
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();

        const onSubmit =  (data: any) => {
            if(!vp.produto){
                toast.error(`Selecione um produto`);
                return;
            }

            vp.idProduto = vp.produto.idProduto;
            vp.produtoId = vp.produto.id;
            vp.nomeProduto = vp.produto.nome;

            vp.quantidade = fGetNumber(data.quantidade);
            vp.valorUnitario = fGetNumber(data.valorUnitario);
            if (vp.quantidade <= 0) {
                toast.error(`Quantidade nao pode ser menor ou igual a zero.`);
                onFocus("quantidade");
                return;
            }
            if (vp.valorUnitario <= 0) {
                toast.error(`Valor nao pode ser menor ou igual a zero.`);
                onFocus("valorUnitario");
                return;
            }
            setClose(vp);
         
        }


    return (
        <BaseModal width={'50%'} height={'50%'} title={'Editar Item do Carrinho'} isOpen={isOpen} setClose={() => { setClose(undefined) }}>
            <div className={styles.content}>
                <SelectProduto selected={vp.produto.id} setSelected={(v) => { setVp({...vp, produto: v}) }} />
                <InputForm id="quantidade" defaultValue={vendaProduto.quantidade}  width={'30%'} title={'Quantidade'} register={register} errors={errors} inputName={'quantidade'} />
                <InputForm id="valorUnitario" defaultValue={vendaProduto.valorUnitario}  width={'30%'} title={'Valor Unitario'} register={register} errors={errors} inputName={'valorUnitario'} />

                <div className={styles.button}>
                    <CustomButton typeButton={'danger'} onClick={() => { setClose(undefined) }}>Cancelar</CustomButton>
                    <CustomButton typeButton={'success'}onClick={() => { handleSubmit(onSubmit)() }} >Confirmar</CustomButton>
                </div>
            </div>
        </BaseModal>
    )
}
