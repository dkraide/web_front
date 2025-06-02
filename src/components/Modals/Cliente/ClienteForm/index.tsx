import { useEffect, useRef, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import { isMobile, validateString } from "@/utils/functions";
import ICliente from "@/interfaces/ICliente";
import { format } from "date-fns";
import SelectTipoIE from "@/components/Selects/SelectTipoIE";
import SelectTipoCliente from "@/components/Selects/SelectTipoCliente";
import SelectSimNao from "@/components/Selects/SelectSimNao";



interface props {
    isOpen: boolean
    clienteId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function ClienteForm({ user, isOpen, clienteId, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [cliente, setCliente] = useState<ICliente>({} as ICliente)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (clienteId > 0) {
            api.get(`/Cliente/Select?id=${clienteId}`)
                .then(({ data }: AxiosResponse<ICliente>) => {
                    setCliente(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            cliente.id = 0;
            cliente.status = true;
            setCliente(cliente);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        setSending(true);
        cliente.nome = data.nome;
        cliente.dataNascimento = new Date(data.dataNascimento);
        cliente.cpf = data.cpf;
        cliente.rg = data.rg;
        cliente.telefone = data.telefone;
        cliente.logradouro = data.logradouro;
        cliente.numero = data.numero;
        cliente.complemento = data.complemento;
        cliente.cep = data.cep;
        cliente.bairro = data.bairro;
        cliente.municipio = data.municipio;
        cliente.uf = data.uf;
        cliente.observacao = data.observacao;
        cliente.razaoSocial = data.razaoSocial;
        cliente.codIBGE = data.codIBGE;

        if (cliente.id > 0) {
            api.put(`Cliente/UpdateCliente`, cliente)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`grupo atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar grupo. ${err.response?.data}`);
                })

        } else {
            cliente.empresaId = user.empresaSelecionada;
            api.post(`Cliente/Create`, cliente)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`cliente cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar grupo. ${err.response?.data}`);
                })
        }
        setSending(false);
    }

    const onLoadCep = () => {
        const cep = getValues('cep');
        if (cep && cep.length >= 8) {
            api.get(`https://viacep.com.br/ws/${cep}/json/`)
                .then(({ data }: AxiosResponse<any>) => {
                    if (data.erro) {
                        toast.error('CEP não encontrado!');
                        return;
                    }
                    setValue('logradouro', data.logradouro);
                    setValue('bairro', data.bairro);
                    setValue('municipio', data.localidade);
                    setValue('uf', data.uf);
                    setValue('codIBGE', data.ibge);
                    inputRef.current?.focus();
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao buscar CEP. ${err.message}`);
                });
        } else {
            toast.error('Informe um CEP válido!');
        }
    }
    return (
        <BaseModal height={'30%'} width={'50%'} color={color} title={'Cadastro de cliente'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    {!!cliente.id && <InputForm defaultValue={cliente.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />}
                    <InputForm defaultValue={cliente.nome} width={'70%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                    <InputForm defaultValue={format(new Date(cliente.dataNascimento ?? new Date()), 'yyyy-MM-dd')} type={'date'} width={'15%'} title={'Nascimento'} errors={errors} inputName={"dataNascimento"} register={register} />
                    <SelectStatus width={'15%'} selected={cliente.status} setSelected={(v) => { setCliente({ ...cliente, status: v }) }} />
                    <InputForm defaultValue={cliente.cpf} width={'33%'} title={'CPF / CNPJ'} errors={errors} inputName={"cpf"} register={register} />
                    <InputForm defaultValue={cliente.rg} width={'33%'} title={'RG / IE'} errors={errors} inputName={"rg"} register={register} />
                    <InputForm defaultValue={cliente.telefone} width={'33%'} title={'Telefone'} errors={errors} inputName={"telefone"} register={register} />
                    <InputForm defaultValue={cliente.logradouro} width={'70%'} title={'Logradouro'} errors={errors} inputName={"logradouro"} register={register} />
                    <InputForm defaultValue={cliente.numero} width={'15%'} title={'Nro'} errors={errors} inputName={"numero"} register={register} />
                    <InputForm defaultValue={cliente.complemento} width={'15%'} title={'Compl.'} errors={errors} inputName={"complemento"} register={register} />
                    <InputForm onBlur={onLoadCep}  defaultValue={cliente.cep} width={'25%'} title={'CEP'} errors={errors} inputName={"cep"} register={register} />
                    <InputForm defaultValue={cliente.bairro} width={'25%'} title={'Bairro'} errors={errors} inputName={"bairro"} register={register} />
                    <InputForm defaultValue={cliente.municipio} width={'25%'} title={'Cidade'} errors={errors} inputName={"municipio"} register={register} />
                    <InputForm defaultValue={cliente.uf} width={'15%'} title={'UF'} errors={errors} inputName={"uf"} register={register} />
                    <InputForm defaultValue={cliente.observacao} width={'100%'} title={'Observacao'} errors={errors} inputName={"observacao"} register={register} />
                    <div style={{ width: '100%' }}>
                        <h5>Detalhes para Nota Fiscal</h5>
                    </div>
                     <InputForm defaultValue={cliente.razaoSocial} width={'70%'} title={'Razao Social'} errors={errors} inputName={"razaoSocial"} register={register} />
                        <SelectTipoIE width={'30%'} selected={cliente.tipoIE} setSelected={(r) => { setCliente({ ...cliente, tipoIE: r }) }} />
                        <SelectTipoCliente width={'30%'} selected={cliente.isPessoaJuridica} setSelected={(r) => { setCliente({ ...cliente, isPessoaJuridica: r }) }} />
                        <SelectSimNao title={'Consumidor Final'} width={'30%'} selected={cliente.isConsumidorFinal} setSelected={(r) => { setCliente({ ...cliente, isConsumidorFinal: r }) }} />
                        <InputForm defaultValue={cliente.codIBGE} width={'30%'} title={'Cod. IBGE'} errors={errors} inputName={"codIBGE"} register={register} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}




