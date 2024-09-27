import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { InputForm } from '@/components/ui/InputGroup';
import { FieldValues, UseFormSetValue, useForm } from 'react-hook-form';
import { register } from 'module';
import { Button } from 'react-bootstrap';
import CustomButton from '@/components/ui/Buttons';
import { fGetNumber, fGetOnlyNumber } from '@/utils/functions';
import IWebService from '@/interfaces/IWebService';
import IEmpresa from '@/interfaces/IEmpresa';
import Loading from '@/components/Loading';
import SelectCidade from '@/components/Selects/SelectCidade';
import SelectEstado from '@/components/Selects/SelectEstado';
import { apiViaCep } from '@/services/apiViaCep';


export default function Configuracao() {
    const { getUser } = useContext(AuthContext);
    const [user, setUser] = useState<IUsuario>();

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();



    useEffect(() => {
        const loadData = async () => {
            var user = await getUser();
            setUser(user);
        }
        loadData();
    }, [])





    if (!user) {
        return <></>
    }
    return (
        <>
            <ConfiguracaoNFCE handleSubmit={handleSubmit} setValue={setValue} register={register} errors={errors} user={user} />
            <ConfiguracaoEmpresa getValues={getValues} handleSubmit={handleSubmit} setValue={setValue} register={register} errors={errors} user={user} />

        </>
    )


}

type props = {
    user: IUsuario
    register: any
    errors: any
    setValue: UseFormSetValue<FieldValues>
    handleSubmit: any
    getValues?: any
}


const ConfiguracaoNFCE = ({ handleSubmit, user, register, errors, setValue }: props) => {
    const [config, setConfig] = useState<IWebService>()

    const loadData = async () => {
        await api.get(`/ConfigNFCE/Select?empresaId=${user.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setConfig(data);

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar configuracao. ${err.response?.data || err.message}`);
            })

    }


    useEffect(() => {
        loadData();

    }, [])

    if (!config) {
        return <></>
    }

    function getFile() {
        var input = document.createElement("input");
        input.type = "file";
        input.click();
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            var formData = new FormData();
            formData.append('file', files[0], files[0].name)
            formData.append('empresa', config.empresaId.toString())
           
            api.put(`ConfigNFCE/SetCertificado`, formData, { headers: { "Content-Type": 'multipart/form-data' } })
                .then(({ data }: AxiosResponse) => {
                    setValue('fileName', files[0].name)
                    toast.success(`Certificado enviado com sucesso!`);
                }).catch((err: AxiosError) => {
                    toast.error(`Erro ao enviar certificado`);
                })
        }

    }
    const onSubmit = async (data: any) => {
        config.certSenha = data.certSenha;
        config.serieNf = fGetNumber(data.serie);
        config.numeracaoNf = fGetNumber(data.nnf);
        api.put(`ConfigNFCE/Update`, config)
            .then(({ data }: AxiosResponse) => {
                toast.success(`objeto cadastrado com sucesso!`);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao criar objeto. ${err.response?.data}`);
            })
    }



    return (
        <div className={styles.container}>
            <h5>Configuracao NFC-e / NF-e</h5>
            <CustomButton onClick={getFile} style={{ width: '20%', height: '40px' }} typeButton={'dark'}>Carregar Arquivo</CustomButton>
            <InputForm readOnly={true} width={'50%'} title={'Arquivo .pfx'} register={register} errors={errors} inputName={'fileName'} defaultValue={config.fileName || 'Nenhum arquivo selecionado'} />
            <InputForm width={'30%'} title={'Senha Certificado'} register={register} errors={errors} inputName={'certSenha'} defaultValue={config.certSenha} />
            <InputForm width={'30%'} title={'Nnf'} register={register} errors={errors} inputName={'nnf'} defaultValue={config.numeracaoNf} />
            <InputForm width={'30%'} title={'Serie'} register={register} errors={errors} inputName={'serie'} defaultValue={config.serieNf} />
            <InputForm width={'30%'} title={'Codigo CSC'} register={register} errors={errors} inputName={'idCsc'} defaultValue={config.idCsc} />
            <InputForm width={'30%'} title={'Numero CSC'} register={register} errors={errors} inputName={'csc'} defaultValue={config.csc} />
            <CustomButton typeButton={'dark'} style={{ width: '30%', height: '40px' }} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
        </div>
    )
}

const ConfiguracaoEmpresa = ({ handleSubmit, user, register, errors, setValue, getValues }: props) => {

    const [objeto, setObjeto] = useState<IEmpresa>()
    const [sending, setSending] = useState(false);

    const loadData = async () => {
        await api.get(`/Empresa/Select?Id=${user.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setObjeto(data);

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar empresa. ${err.response?.data || err.message}`);
            })

    }

    useEffect(() => {
        loadData();

    }, [])


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
        console.log(cep);
    }

    const onSubmit = async (data: any) => {
        setSending(true);
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
        if (objeto.id > 0) {
            api.put(`Empresa/Update`, objeto)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Empresa atualizada com sucesso!`);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar empresa. ${err.response?.data}`);
                })
        }
        setSending(false);
    }





    if (!objeto) {
        return <></>
    }

    return (
        <div className={styles.container}>
            <h5>Dados da Empresa</h5>
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
            <div className={styles.button}>
                <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
            </div>
        </div>
    )


}