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
import IProduto from "@/interfaces/IProduto";
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import ITabelaPromocionalProduto from "@/interfaces/ITabelaPromocionalProduto";
import { api } from "@/services/apiClient";
import IUsuario from "@/interfaces/IUsuario";
import { AxiosError, AxiosResponse } from "axios";
import { isMobile } from "react-device-detect";


interface props {
    isOpen: boolean
    setClose: (v?: ITabelaPromocionalProduto[]) => void
    user: IUsuario
}
export default function AddItem({ isOpen, setClose, user }: props) {
    const [isProduto, setIsProduto] = useState(true);
    const [item, setItem] = useState<IProduto | IClasseMaterial>();

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();



    const onSubmit = async (data: any) =>{
        if(!item){
            toast.error(`Selecione um item`);
            return;
        }

        var list = [];
        var valor = fGetNumber(data.valorUnitario);
        if(isProduto){
            var selected = item as IProduto;
            var obj =  {
                  id: 0,
                  idTabelaPromocionalProduto: 0,
                  idTabelaPromocional: 0,
                  tabelaPromocionalId:0,
                  idProduto: selected.idProduto,
                  produtoId: selected.id,
                  valorUnitario: valor,
                  produto: selected,
                  tabelaPromocional: undefined,
                  empresaId: selected.empresaId
            } as ITabelaPromocionalProduto;
            list.push(obj);
        }else{
            var produtos = await api.get(`/Produto/List?empresaId=${user.empresaSelecionada}&classeId=${item.id}&status=true`)
            .then(({data}: AxiosResponse<IProduto[]>) => {
                 if(!data || data.length == 0){
                    toast.error(`Nao ha produtos para essa classe.`);
                    return undefined;
                 }
                 return data;
            })
            .catch((err: AxiosError) => {
                 toast.error(`Erro ao buscar Produtos`);
                 return undefined;
            });
            if(!produtos){
                return;
            }
            produtos.map((item: IProduto) => {
                var obj =  {
                    id: 0,
                    idTabelaPromocionalProduto: 0,
                    idTabelaPromocional: 0,
                    tabelaPromocionalId:0,
                    idProduto: item.idProduto,
                    produtoId: item.id,
                    valorUnitario: valor,
                    produto: item,
                    tabelaPromocional: undefined,
                    empresaId: item.empresaId
              } as ITabelaPromocionalProduto;
              list.push(obj);
            });
        }
        setClose(list);
      
    }
    return (
        <BaseModal isOpen={isOpen} setClose={setClose} title={'Adicionar item na Tabela'} height={'50vh'} width={'50%'}>
           <div className={styles.container}>
           <SelectClasseProduto title={'Tipo'} width={isMobile ? '100%' : '60%'} selected={isProduto} setSelected={(v) => setIsProduto(v)} />
            {isProduto ?
                <SelectProduto selected={item?.id || 0} setSelected={(v) => {
                    setItem(v);
                }} /> :
                <SelectClasseMaterial selected={item?.id || 0} setSelected={(v) => {
                    setItem(v);
                }} />}
            <InputForm  width={isMobile ? '100%' : '50%'} title={'Valor Unitario'} errors={errors} inputName={"valorUnitario"} register={register} />
            <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'}  onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
           </div>
        </BaseModal>
    )
}