import BaseModal from "@/components/Modals/Base/Index";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import SelectClasseProduto from "@/components/Selects/SelectClasseProduto";
import SelectProduto from "@/components/Selects/SelectProduto";
import SelectStatus from "@/components/Selects/SelectStatus";
import CustomButton from "@/components/ui/Buttons";
import { InputForm } from "@/components/ui/InputGroup";
import { useState } from "react";
import styles from './styles.module.scss';
import { useForm } from "react-hook-form";
import IComboItem from "@/interfaces/IComboItem";
import { fGetNumber } from "@/utils/functions";
import { toast } from "react-toastify";


interface props {
    isOpen: boolean
    setClose: (v?: IComboItem) => void
}
export default function AddItem({ isOpen, setClose }: props) {
    const [isProduto, setIsProduto] = useState(true);
    const [item, setItem] = useState<IComboItem>({} as IComboItem);

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();



    const onSubmit = async (data: any) =>{
           if((!item.classeMaterialId && !item.produtoId) || (item.classeMaterialId == 0 && item.produtoId == 0)){
              toast.error(`Selecione um item para o combo`);
              return;
           }
            item.quantidade = fGetNumber(data.quantidade);
            item.valorUnitario = fGetNumber(data.valorUnitario);
            if(item.quantidade <= 0 || item.valorUnitario <= 0){
                toast.error(`Valor Unitario e Quantidade precisam ser maior que zero`);
                return;
            }
            setClose(item);
    }
    return (
        <BaseModal isOpen={isOpen} setClose={setClose} title={'Adicionar item ao Combo'} height={'100%'} width={'50%'}>
           <div className={styles.container}>
           <SelectClasseProduto title={'Tipo'} width={'60%'} selected={isProduto} setSelected={(v) => setIsProduto(v)} />
            {isProduto ?
                <SelectProduto selected={item.produtoId || 0} setSelected={(v) => {
                    setItem({ ...item, classeMaterial: null, produto: v, produtoId: v.id, idProduto: v.idProduto, classeMaterialId: 0, idClasseMaterial: 0 });
                }} /> :
                <SelectClasseMaterial selected={item.classeMaterialId || 0} setSelected={(v) => {
                    setItem({ ...item, produto: null, classeMaterial: v, produtoId: 0, idProduto: 0, classeMaterialId: v.id, idClasseMaterial: v.idClasseMaterial })
                }} />}
            <InputForm defaultValue={item.quantidade} width={'50%'} title={'Quantidade'} errors={errors} inputName={"quantidade"} register={register} />
            <InputForm defaultValue={item.valorUnitario} width={'50%'} title={'Valor Unitario'} errors={errors} inputName={"valorUnitario"} register={register} />
            <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'}  onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
           </div>
        </BaseModal>
    )
}