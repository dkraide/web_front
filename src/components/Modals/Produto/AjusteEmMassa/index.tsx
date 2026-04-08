import { useEffect, useState } from 'react'
import { api } from '@/services/apiClient'
import { AxiosError, AxiosResponse } from 'axios'
import { InputForm } from '@/components/ui/InputGroup'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import styles from './styles.module.scss'
import CustomButton from '@/components/ui/Buttons'
import BaseModal from '../../Base/Index'
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial'
import SelectCampoProduto from '@/components/Selects/SelectCampoProduto'
import SelectStatus from '@/components/Selects/SelectStatus'

interface AjusteEmMassaProps {
  isOpen: boolean
  setClose: (res?: any) => void
  color?: string
  empresaId?: number
}

export default function AjusteEmMassa({ empresaId, isOpen, setClose, color }: AjusteEmMassaProps) {
  const [sending,    setSending]    = useState(false)
  const [classeId,   setClasseId]   = useState(0)
  const [campo,      setCampo]      = useState<any>()
  const [valueField, setValueField] = useState<any>()

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    if (campo?.nome?.toUpperCase() === 'STATUS') {
      setValueField(true)
    }
  }, [campo])

  const onSubmit = async (data: any) => {
    if (classeId <= 0) {
      toast.error('Selecione uma classe de material')
      return
    }
    if (!campo?.nome?.length) {
      toast.error('Selecione um campo')
      return
    }

    const field = campo.nome.replaceAll(' ', '').toUpperCase()
    let value   = data.ajuste

    if (field === 'STATUS')        value = valueField?.toString()
    if (field === 'CLASSEMATERIAL') value = valueField?.id

    setSending(true)
    try {
      const { data: res } = await api.put(
        `/Produto/AjusteMassa?ClasseMaterialId=${classeId}&Campo=${field}&Valor=${value}`
      )
      toast.success(`${res} ajustados com sucesso!`)
      setClose(true)
    } catch (err) {
      const e = err as AxiosError
      toast.error(`Erro ao enviar ajuste. ${e.response?.data || e.message}`)
    } finally {
      setSending(false)
    }
  }

  const CampoInput = () => {
    switch (campo?.nome?.toUpperCase()) {
      case 'STATUS':
        return <SelectStatus title="Valor" selected={valueField} setSelected={setValueField} />
      case 'CLASSEMATERIAL':
        return <SelectClasseMaterial selected={valueField?.id ?? 0} setSelected={setValueField} />
      default:
        return (
          <InputForm
            title="Informe o ajuste"
            placeholder="Valor do ajuste"
            inputName="ajuste"
            register={register}
            errors={errors}
          />
        )
    }
  }

  return (
    <BaseModal height="70vh" width="90%" color={color} title="Ajuste em massa" isOpen={isOpen} setClose={setClose}>
      <div className={styles.container}>

        <div className={styles.fields}>
          <div className={styles.fieldRow}>
            <span className={styles.stepBadge}>1</span>
            <div className={styles.fieldWrap}>
              <span className={styles.fieldHint}>Selecione a classe de material a ser ajustada</span>
              <SelectClasseMaterial
                empresaId={empresaId}
                selected={classeId || 0}
                setSelected={v => setClasseId(v.id)}
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.stepBadge}>2</span>
            <div className={styles.fieldWrap}>
              <span className={styles.fieldHint}>Selecione qual campo será alterado</span>
              <SelectCampoProduto selected={campo?.value} setSelected={setCampo} />
            </div>
          </div>

          {campo && (
            <div className={styles.fieldRow}>
              <span className={styles.stepBadge}>3</span>
              <div className={styles.fieldWrap}>
                <span className={styles.fieldHint}>Informe o novo valor</span>
                <CampoInput />
              </div>
            </div>
          )}
        </div>

        {campo && (
          <div className={styles.warning}>
            Esta ação irá alterar o campo <b>{campo.nome}</b> em todos os produtos da classe selecionada.
          </div>
        )}

        <div className={styles.footer}>
          <CustomButton typeButton="secondary" onClick={() => setClose()}>
            Cancelar
          </CustomButton>
          <CustomButton typeButton="dark" loading={sending} onClick={() => handleSubmit(onSubmit)()}>
            Confirmar ajuste
          </CustomButton>
        </div>

      </div>
    </BaseModal>
  )
}