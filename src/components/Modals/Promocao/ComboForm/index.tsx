import { useEffect, useState } from 'react'
import { api } from '@/services/apiClient'
import { AxiosError, AxiosResponse } from 'axios'
import Loading from '@/components/Loading'
import { InputForm } from '@/components/ui/InputGroup'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import styles from './styles.module.scss'
import IUsuario from '@/interfaces/IUsuario'
import CustomButton from '@/components/ui/Buttons'
import BaseModal from '../../Base/Index'
import SelectStatus from '@/components/Selects/SelectStatus'
import { validateString } from '@/utils/functions'
import ICombo from '@/interfaces/ICombo'
import AddItem from './AddItem'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import SelectSimNao from '@/components/Selects/SelectSimNao'

interface ComboFormProps {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}

export default function ComboForm({ user, isOpen, id, setClose, color }: ComboFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm()

    const [item, setItem] = useState<ICombo>({} as ICombo)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [addItem, setAddItem] = useState(false)

    useEffect(() => {
        if (id > 0) {
            api.get<ICombo>(`/Combo/Select?id=${id}`)
                .then(({ data }) => { setItem(data); setLoading(false) })
                .catch(err => { toast.error(`Erro ao buscar dados. ${err.message}`); setLoading(false) })
        } else {
            setItem({ id: 0, status: true, empresaId: user.empresaSelecionada } as ICombo)
            setLoading(false)
        }
    }, [])

    const onSubmit = async (data: any) => {
        const codigo = data.codigo
        const descricao = data.descricao

        if (!validateString(codigo, 1)) {
            toast.error('Informe um código!'); return
        }
        if (!validateString(descricao, 3)) {
            toast.error('Informe uma descrição de no mínimo 3 caracteres'); return
        }

        const payload = { ...item, codigo, descricao }
        setSending(true)
        try {
            if (payload.id > 0) {
                await api.put('Combo/UpdateCombo', payload)
                toast.success('Combo atualizado com sucesso!')
            } else {
                await api.post('Combo/Create', { ...payload, empresaId: user.empresaSelecionada })
                toast.success('Combo cadastrado com sucesso!')
            }
            setClose(true)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao salvar combo. ${e.response?.data || e.message}`)
        } finally {
            setSending(false)
        }
    }

    async function remove(index: number) {
        const target = item.itens[index]
        if (target.id > 0) {
            const ok = await api.delete(`/ComboItem/Delete?id=${target.id}`)
                .then(() => { toast.success('Item removido'); return true })
                .catch(() => { toast.error('Erro ao remover item'); return false })
            if (!ok) return
        }
        const itens = [...item.itens]
        itens.splice(index, 1)
        setItem(prev => ({ ...prev, itens }))
    }

    if (addItem) {
        return (
            <AddItem
                isOpen={addItem}
                setClose={v => {
                    if (v) {
                        const itens = item.itens ?? []
                        v.comboId = item.id
                        v.idCombo = item.idCombo
                        v.empresaId = user.empresaSelecionada
                        setItem(prev => ({ ...prev, itens: [...itens, v] }))
                    }
                    setAddItem(false)
                }}
            />
        )
    }

    return (
        <BaseModal height="90vh" width="50%" color={color} title="Cadastro de combo" isOpen={isOpen} setClose={setClose}>
            {loading ? <Loading /> : (
                <div className={styles.container}>

                    {/* Campos principais */}
                    <div className={styles.fieldsRow}>
                        <InputForm
                            defaultValue={item.codigo}
                            width="30%"
                            title="Código"
                            errors={errors}
                            inputName="codigo"
                            register={register}
                        />
                        <SelectSimNao
                            width="30%"
                            title="Visível no menu"
                            selected={item.visivelMenu}
                            setSelected={e => setItem(prev => ({ ...prev, visivelMenu: e }))}
                        />
                        <SelectStatus
                            width="30%"
                            selected={item.status}
                            setSelected={v => setItem(prev => ({ ...prev, status: v }))}
                        />
                    </div>

                    <InputForm
                        defaultValue={item.descricao}
                        width="100%"
                        title="Descrição"
                        errors={errors}
                        inputName="descricao"
                        register={register}
                    />

                    {/* Lista de itens */}
                    <div className={styles.itensSection}>
                        <div className={styles.itensSectionHeader}>
                            <span className={styles.itensSectionTitle}>
                                Itens do combo
                                {item.itens?.length > 0 && (
                                    <span className={styles.itensBadge}>{item.itens.length}</span>
                                )}
                            </span>
                            <button className={styles.addBtn} onClick={() => setAddItem(true)}>
                                <FontAwesomeIcon icon={faPlusCircle} />
                                Adicionar item
                            </button>
                        </div>

                        {(!item.itens || item.itens.length === 0) ? (
                            <div className={styles.itensEmpty}>Nenhum item adicionado</div>
                        ) : (
                            <ul className={styles.itensList}>
                                {item.itens.map((comboItem, index) => (
                                    <li key={index} className={styles.itensItem}>
                                        <div className={styles.itensItemInfo}>
                                            <span className={styles.itensItemNome}>
                                                {comboItem.produto
                                                    ? comboItem.produto.nome
                                                    : comboItem.classeMaterial
                                                        ? comboItem.classeMaterial.nomeClasse
                                                        : '—'}
                                            </span>
                                            <div className={styles.itensItemMeta}>
                                                <span>Qtd: <b>{comboItem.quantidade.toFixed(2)}</b></span>
                                                <span>Unitário: <b>R$ {comboItem.valorUnitario.toFixed(2)}</b></span>
                                                <span>Total: <b>R$ {(comboItem.quantidade * comboItem.valorUnitario).toFixed(2)}</b></span>
                                            </div>
                                        </div>
                                        <button className={styles.removeBtn} onClick={() => remove(index)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Total do combo */}
                    {item.itens?.length > 0 && (() => {
                        const total = item.itens.reduce((acc, i) => acc + (i.quantidade * i.valorUnitario), 0)
                        return (
                            <div className={styles.totalRow}>
                                <span className={styles.totalLabel}>Total do combo</span>
                                <span className={styles.totalValue}>R$ {total.toFixed(2)}</span>
                            </div>
                        )
                    })()}

                    {/* Footer */}
                    <div className={styles.footer}>
                        <CustomButton typeButton="secondary" onClick={() => setClose()}>
                            Cancelar
                        </CustomButton>
                        <CustomButton typeButton="dark" loading={sending} onClick={() => handleSubmit(onSubmit)()}>
                            Confirmar
                        </CustomButton>
                    </div>

                </div>
            )}
        </BaseModal>
    )
}