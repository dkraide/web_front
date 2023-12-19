import { useContext, useEffect, useState } from 'react';
import styles from  './styles.module.scss';
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
import { fGetNumber } from '@/utils/functions';
import IWebService from '@/interfaces/IWebService';


export default function Configuracao(){
    const {getUser} = useContext(AuthContext);
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
    
    



    if(!user){
        return <></>
    }
    return(
        <>
        <ConfiguracaoNFCE handleSubmit={handleSubmit} setValue={setValue} register={register} errors={errors} user={user}/>
        
        </>
    )


}

type props = {
    user: IUsuario
    register: any
    errors: any
    setValue: UseFormSetValue<FieldValues>
    handleSubmit: any
}


const ConfiguracaoNFCE = ({handleSubmit, user, register, errors, setValue} : props) => {
    const [config, setConfig] = useState<IWebService>()

    const loadData = async () => {
        await api.get(`/ConfigNFCE/Select?empresaId=${user.empresaSelecionada}`)
        .then(({data}: AxiosResponse) => {
            setConfig(data);

        }).catch((err: AxiosError) => {
            toast.error(`Erro ao carregar configuracao. ${err.response?.data || err.message}`);
        })

    }


    useEffect(() => {
        loadData();

    }, [])

    if(!config){
        return <></>
    }

    function getFile(){
        var input = document.createElement("input");
        input.type = "file";
        input.click();
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            var formData = new FormData();
            formData.append('file', files[0], files[0].name)
            formData.append('empresa', config.empresaId.toString())
            setTimeout(() => {
            }, 500)
            api.put(`ConfigNFCE/SetCertificado`, formData, {headers: {"Content-Type": 'multipart/form-data'}})
            .then(({data}: AxiosResponse) => {
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



    return(
        <div className={styles.container}>
            <h5>Configuracao NFC-e / NF-e</h5>
            <CustomButton onClick={getFile} style={{width: '20%', height: '40px'}} typeButton={'dark'}>Carregar Arquivo</CustomButton>
            <InputForm readOnly={true} width={'50%'} title={'Arquivo .pfx'} register={register} errors={errors} inputName={'fileName'} defaultValue={config.fileName || 'Nenhum arquivo selecionado'}  />
            <InputForm width={'30%'} title={'Senha Certificado'} register={register} errors={errors} inputName={'certSenha'} defaultValue={config.certSenha}  />
            <InputForm width={'30%'} title={'Nnf'} register={register} errors={errors} inputName={'nnf'} defaultValue={config.numeracaoNf}  />
            <InputForm width={'30%'} title={'Serie'} register={register} errors={errors} inputName={'serie'} defaultValue={config.serieNf}  />
            <InputForm width={'30%'} title={'Codigo CSC'} register={register} errors={errors} inputName={'idCsc'} defaultValue={config.idCsc}  />
            <InputForm width={'30%'} title={'Numero CSC'} register={register} errors={errors} inputName={'csc'} defaultValue={config.csc}  />
            <CustomButton typeButton={'dark'}style={{width: '30%', height: '40px'}} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
        </div>
    )


}