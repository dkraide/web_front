import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { isMobile } from 'react-device-detect'
import styles from './styles.module.scss'
import BaseModal from '@/components/Modals/Base/Index'
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial'
import SelectClasseProduto from '@/components/Selects/SelectClasseProduto'
import SelectProduto from '@/components/Selects/SelectProduto'
import CustomButton from '@/components/ui/Buttons'
import { InputForm } from '@/components/ui/InputGroup'
import IComboItem from '@/interfaces/IComboItem'
import { fGetNumber } from '@/utils/functions'

interface AddItemProps {
  isOpen: boolean
  setClose: (v?: IComboItem) => void
}

export default function AddItem({ isOpen, setClose }: AddItemProps) {
  const { register, handleSubmit, formState: { errors } } = useForm()

  const [isProduto, setIsProduto] = useState(true)
  const [item,      setItem]      = useState<IComboItem>({} as IComboItem)

  const onSubmit = (data: any) => {
    if (!item.classeMaterialId && !item.produtoId) {
      toast.error('Selecione um item para o combo'); return
    }

    const quantidade    = fGetNumber(data.quantidade)
    const valorUnitario = fGetNumber(data.valorUnitario)

    if (quantidade <= 0 || valorUnitario <= 0) {
      toast.error('Valor unitário e quantidade precisam ser maior que zero'); return
    }

    setClose({ ...item, quantidade, valorUnitario })
  }

  return (
    <BaseModal isOpen={isOpen} setClose={setClose} title="Adicionar item ao combo" height="100%" width="50%">
      <div className={styles.container}>

        <SelectClasseProduto
          title="Tipo"
          width={isMobile ? '100%' : '60%'}
          selected={isProduto}
          setSelected={v => {
            setIsProduto(v)
            setItem({} as IComboItem)
          }}
        />

        {isProduto ? (
          <SelectProduto
            selected={item.produtoId || 0}
            setSelected={v => setItem(prev => ({
              ...prev,
              classeMaterial: null,
              produto: v,
              produtoId: v.id,
              idProduto: v.idProduto,
              classeMaterialId: 0,
              idClasseMaterial: 0,
            }))}
          />
        ) : (
          <SelectClasseMaterial
            selected={item.classeMaterialId || 0}
            setSelected={v => setItem(prev => ({
              ...prev,
              produto: null,
              classeMaterial: v,
              produtoId: 0,
              idProduto: 0,
              classeMaterialId: v.id,
              idClasseMaterial: v.idClasseMaterial,
            }))}
          />
        )}

        <div className={styles.fieldsRow}>
          <InputForm
            defaultValue={item.quantidade}
            width="48%"
            title="Quantidade"
            errors={errors}
            inputName="quantidade"
            register={register}
          />
          <InputForm
            defaultValue={item.valorUnitario}
            width="48%"
            title="Valor unitário"
            errors={errors}
            inputName="valorUnitario"
            register={register}
          />
        </div>

        <div className={styles.footer}>
          <CustomButton typeButton="secondary" onClick={() => setClose()}>
            Cancelar
          </CustomButton>
          <CustomButton typeButton="dark" onClick={() => handleSubmit(onSubmit)()}>
            Confirmar
          </CustomButton>
        </div>

      </div>
    </BaseModal>
  )
}