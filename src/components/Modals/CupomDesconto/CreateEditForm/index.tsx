import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import ICupomDesconto from "@/interfaces/ICupomDesconto";
import ICupomDescontoCliente from "@/interfaces/ICupomDescontoCliente";
import ICliente from "@/interfaces/ICliente";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import { SelectBase } from "@/components/Selects/SelectBase";
import SelectStatus from "@/components/Selects/SelectStatus";
import SelectCliente from "@/components/Selects/SelectCliente";
import { isMobile } from "react-device-detect";

interface props {
    isOpen: boolean
    cupomId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}

// converte o datetime que vem do backend (ISO) para o formato do <input type="date">
function toInputDate(value?: string | null): string {
    if (!value) return '';
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
}

export default function CupomForm({ user, isOpen, cupomId, setClose, color }: props) {
    const { register, getValues, handleSubmit, formState: { errors } } = useForm();

    const [cupom, setCupom] = useState<ICupomDesconto>({} as ICupomDesconto)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [clienteSel, setClienteSel] = useState<ICliente | undefined>();

    useEffect(() => {
        if (cupomId > 0) {
            api.get(`/v2/CupomDesconto/${cupomId}`)
                .then(({ data }: AxiosResponse<ICupomDesconto>) => {
                    if (!data.clientes) data.clientes = [];
                    setCupom(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            const novo = {
                id: 0,
                status: true,
                tipoCalculo: 'VALOR',
                tipoAplicacao: 'PEDIDO',
                permissao: 'TODOS',
                valor: 0,
                valorMinimoPedido: 0,
                descontoMaximo: 0,
                quantidade: 0,
                quantidadeUsada: 0,
                limitePorCliente: 0,
                clientes: [],
            } as unknown as ICupomDesconto;
            setCupom(novo);
            setLoading(false);
        }
    }, []);

    const isCliente = cupom.permissao === 'CLIENTE';

    function addCliente() {
        if (!clienteSel) return;
        if (cupom.clientes.some(c => c.idCliente === clienteSel.idCliente)) return;
        const vinculo = {
            id: 0,
            idCupomDescontoCliente: 0,
            empresaId: user.empresaSelecionada,
            idCupomDesconto: cupom.idCupomDesconto || 0,
            cupomDescontoId: cupom.id || 0,
            idCliente: clienteSel.idCliente,
            clienteId: clienteSel.id,
            nomeCliente: clienteSel.nome,
        } as ICupomDescontoCliente;
        setCupom({ ...cupom, clientes: [...cupom.clientes, vinculo] });
    }

    function removeCliente(idCliente: number) {
        setCupom({ ...cupom, clientes: cupom.clientes.filter(c => c.idCliente !== idCliente) });
    }

    const onSubmit = async (data: any) => {
        const payload: ICupomDesconto = {
            ...cupom,
            titulo: data.titulo,
            codigo: (data.codigo || '').toUpperCase(),
            valor: parseFloat(data.valor) || 0,
            valorMinimoPedido: parseFloat(data.valorMinimoPedido) || 0,
            descontoMaximo: parseFloat(data.descontoMaximo) || 0,
            quantidade: parseInt(data.quantidade) || 0,
            limitePorCliente: parseInt(data.limitePorCliente) || 0,
            dataInicio: data.dataInicio ? data.dataInicio : null,
            dataValidade: data.dataValidade ? data.dataValidade : null,
            empresaId: user.empresaSelecionada,
        };

        if (!payload.titulo || payload.titulo.trim().length < 3) {
            toast.error("Informe um titulo com no minimo 3 caracteres.");
            return;
        }
        if (!payload.codigo || payload.codigo.trim().length < 3) {
            toast.error("Informe o codigo do cupom (min. 3 caracteres).");
            return;
        }
        if (payload.permissao === 'CLIENTE' && payload.clientes.length === 0) {
            toast.error("Cupom do tipo CLIENTE precisa de ao menos um cliente vinculado.");
            return;
        }
        if (payload.permissao !== 'CLIENTE') {
            payload.clientes = [];
        }

        setSending(true);
        api.post(`/v2/CupomDesconto`, payload)
            .then(({ data }: AxiosResponse) => {
                toast.success(`Cupom salvo com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao salvar cupom. ${err.response?.data || err.message}`);
            })
            .finally(() => setSending(false));
    }

    return (
        <BaseModal height={'90%'} width={isMobile ? '95%' : '70%'} color={color} title={'Cadastro de Cupom de Desconto'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    {!!cupom.id && <InputForm defaultValue={cupom.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"idReadonly"} register={register} />}

                    <InputForm defaultValue={cupom.titulo} width={isMobile ? '100%' : '55%'} title={'Titulo'} errors={errors} inputName={"titulo"} register={register} />
                    <InputForm defaultValue={cupom.codigo} width={isMobile ? '100%' : '30%'} title={'Codigo'} errors={errors} inputName={"codigo"} register={register} />

                    <div className={styles.row}>
                        <SelectBase width={'32%'} title={'Tipo Calculo'} selected={cupom.tipoCalculo}
                            datas={[{ value: 'VALOR', label: 'Valor (R$)' }, { value: 'PERCENTUAL', label: 'Percentual (%)' }]}
                            setSelected={(v) => setCupom({ ...cupom, tipoCalculo: v })} />
                        <InputForm defaultValue={cupom.valor} type={'number'} step={'0.01'} width={'32%'} title={'Valor'} errors={errors} inputName={"valor"} register={register} />
                        <SelectBase width={'32%'} title={'Aplicacao'} selected={cupom.tipoAplicacao}
                            datas={[{ value: 'PEDIDO', label: 'Pedido' }, { value: 'FRETE', label: 'Frete' }]}
                            setSelected={(v) => setCupom({ ...cupom, tipoAplicacao: v })} />
                    </div>

                    <div className={styles.row}>
                        <InputForm defaultValue={cupom.valorMinimoPedido} type={'number'} step={'0.01'} width={'32%'} title={'Pedido Minimo (R$)'} errors={errors} inputName={"valorMinimoPedido"} register={register} />
                        <InputForm defaultValue={cupom.descontoMaximo} type={'number'} step={'0.01'} width={'32%'} title={'Desconto Max. (R$)'} errors={errors} inputName={"descontoMaximo"} register={register} />
                        <SelectStatus width={'32%'} selected={cupom.status} setSelected={(v) => setCupom({ ...cupom, status: v })} />
                    </div>

                    <div className={styles.row}>
                        <InputForm defaultValue={cupom.quantidade} type={'number'} width={'32%'} title={'Qtd. Total (0=ilim.)'} errors={errors} inputName={"quantidade"} register={register} />
                        <InputForm defaultValue={cupom.limitePorCliente} type={'number'} width={'32%'} title={'Limite/Cliente (0=ilim.)'} errors={errors} inputName={"limitePorCliente"} register={register} />
                        {cupomId > 0 && <InputForm defaultValue={cupom.quantidadeUsada} width={'32%'} title={'Usos realizados'} readOnly={true} errors={errors} inputName={"quantidadeUsadaReadonly"} register={register} />}
                    </div>

                    <div className={styles.row}>
                        <InputForm defaultValue={toInputDate(cupom.dataInicio)} type={'date'} width={'32%'} title={'Inicio (opcional)'} errors={errors} inputName={"dataInicio"} register={register} />
                        <InputForm defaultValue={toInputDate(cupom.dataValidade)} type={'date'} width={'32%'} title={'Validade (opcional)'} errors={errors} inputName={"dataValidade"} register={register} />
                        <SelectBase width={'32%'} title={'Permissao'} selected={cupom.permissao}
                            datas={[{ value: 'TODOS', label: 'Todos' }, { value: 'CLIENTE', label: 'Clientes especificos' }]}
                            setSelected={(v) => setCupom({ ...cupom, permissao: v })} />
                    </div>

                    {isCliente && (
                        <div className={styles.clientes}>
                            <label className={styles.clientesTitle}>Clientes autorizados</label>
                            <div className={styles.addCliente}>
                                <div style={{ flex: 1 }}>
                                    <SelectCliente
                                        selected={clienteSel?.id || 0}
                                        setSelected={(c: ICliente) => setClienteSel(c)}
                                        ignore={cupom.clientes.map(c => c.clienteId)}
                                    />
                                </div>
                                <CustomButton typeButton={'success'} onClick={addCliente}>+ Adicionar</CustomButton>
                            </div>
                            <ul className={styles.clientesList}>
                                {cupom.clientes.map(c => (
                                    <li key={c.idCliente}>
                                        <span>{c.nomeCliente || `Cliente ${c.idCliente}`}</span>
                                        <CustomButton typeButton={'danger'} onClick={() => removeCliente(c.idCliente)}>Remover</CustomButton>
                                    </li>
                                ))}
                                {cupom.clientes.length === 0 && <li className={styles.empty}>Nenhum cliente vinculado.</li>}
                            </ul>
                        </div>
                    )}

                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}
