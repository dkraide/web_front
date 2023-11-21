import { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import IEmpresa from '@/interfaces/IEmpresa'
import { InputForm } from '@/components/ui/InputGroup'
import { AxiosError, AxiosResponse } from 'axios'
import { fGetNumber, fGetOnlyNumber } from '@/utils/functions'
import { apiViaCep } from '@/services/apiViaCep'
import { toast } from 'react-toastify'
import SelectEstado from '@/components/Selects/SelectEstado'
import SelectCidade from '@/components/Selects/SelectCidade'
import { api } from '@/services/apiClient'
import { useForm } from 'react-hook-form'
import { AuthContext } from '@/contexts/AuthContext'
import CustomButton from '@/components/ui/Buttons'
import { Spinner } from 'react-bootstrap'


export default function Empresa() {
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IEmpresa>()
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const { getUser } = useContext(AuthContext);
    useEffect(() => {
        const loadData = async () => {
            const id = (await getUser()).empresaSelecionada;
            if (id > 0) {
                api.get(`/Empresa/Select?id=${id}`)
                    .then(({ data }: AxiosResponse) => {
                        setObjeto(data);
                        setLoading(false);
                    })
                    .catch((err) => {
                        toast.error(`Erro ao buscar dados. ${err.message}`)
                        setLoading(false);
                    })
            } else {
                setLoading(false);
            }

        }
        loadData();
    }, []);

    const onSubmit = async (data: any) => {
        setSending(true);
        console.log(data);
        objeto.cnpj = data.cnpj;
        objeto.inscricaoEstadual = data.inscricaoEstadual;
        objeto.nomeFantasia = data.nomeFantasia;
        objeto.razaoSocial = data.razaoSocial;
        objeto.endereco = data.endereco;
        objeto.nro = data.nro;
        objeto.complemento = data.complemento;
        objeto.cep = data.cep;
        objeto.bairro = data.bairro;
        objeto.email = data.email;
        objeto.telefone = data.telefone;
        api.put(`Empresa/Update`, objeto)
            .then(({ data }: AxiosResponse) => {
                toast.success(`grupo atualizado com sucesso!`);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar grupo. ${err.response?.data}`);
            })
    }
    function getCep() {
        var cep = fGetOnlyNumber(getValues("cep"));
        apiViaCep.get(`/${cep}/json`)
            .then(({ data }: AxiosResponse) => {
                setObjeto({ ...objeto, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf, codCidade: data.ibge })
                setValue("endereco", data.logradouro);
                setValue("bairro", data.bairro);

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar o cep. ${err.message}`);
            })
    }
    if (!objeto) {
        return <Spinner size={'sm'} />
    }
    return (
        <div className={styles.container}>
            <InputForm defaultValue={objeto.cnpj} width={'50%'} title={'CNPJ / CPF'} errors={errors} inputName={"cnpj"} register={register} />
            <InputForm defaultValue={objeto.inscricaoEstadual} width={'50%'} title={'IE / RG'} errors={errors} inputName={"inscricaoEstadual"} register={register} />
            <InputForm defaultValue={objeto.nomeFantasia} width={'50%'} title={'Nome Fantasia'} errors={errors} inputName={"nomeFantasia"} register={register} />
            <InputForm defaultValue={objeto.razaoSocial} width={'50%'} title={'Razao Social'} errors={errors} inputName={"razaoSocial"} register={register} />
            <InputForm defaultValue={objeto.endereco} width={'50%'} title={'Logradouro'} errors={errors} inputName={"endereco"} register={register} />
            <InputForm defaultValue={objeto.nro} width={'15%'} title={'Nro'} errors={errors} inputName={"nro"} register={register} />
            <InputForm defaultValue={objeto.complemento} width={'15%'} title={'Compl.'} errors={errors} inputName={"complemento"} register={register} />
            <InputForm onBlur={getCep} defaultValue={objeto.cep} width={'20%'} title={'CEP'} errors={errors} inputName={"cep"} register={register} />
            <InputForm defaultValue={objeto.bairro} width={'20%'} title={'Bairro'} errors={errors} inputName={"bairro"} register={register} />
            <SelectEstado selected={objeto.uf} setSelected={(v) => {
                setObjeto({ ...objeto, uf: v.sigla })
            }} width={'23%'} />
            <SelectCidade uf={objeto.uf} selected={objeto.codCidade} setSelected={(v) => {
                setObjeto({ ...objeto, codCidade: v.id, cidade: v.nome })
            }} width={'23%'} />
            <InputForm defaultValue={objeto.email} width={'50%'} title={'Email'} errors={errors} inputName={"email"} register={register} />
            <InputForm defaultValue={objeto.telefone} width={'50%'} title={'Telefone'} errors={errors} inputName={"telefone"} register={register} />
            <div style={{ width: '100%' }}>
                <CustomButton typeButton={'dark'} onClick={() => { handleSubmit(onSubmit)() }}>Salvar</CustomButton>
            </div>
        </div>
    )
}