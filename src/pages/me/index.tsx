import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import IEmpresa from '@/interfaces/IEmpresa';
import IUsuario from '@/interfaces/IUsuario';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { LabelGroup } from '@/components/ui/LabelGroup';
import Loading from '@/components/Loading';
import IDuplicata from '@/interfaces/IDuplicata';
import { format } from 'date-fns';
import { AuthContext } from '@/contexts/AuthContext';
import CustomButton from '@/components/ui/Buttons';
import { useForm } from 'react-hook-form';
import { InputForm } from '@/components/ui/InputGroup';

export default function Me() {

    const [empresas, setEmpresas] = useState<IEmpresa[]>([])
    const [user, setUser] = useState<IUsuario>();
    const [onEditPass, SetOnEditPass] = useState(false);
    const {signOut} = useContext(AuthContext);

    const loadData = async () => {
        api.get(`/Usuario/Me`)
            .then(({ data }: AxiosResponse) => {
                setUser(data.usuario);
                setEmpresas(data.empresas);

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar seus dados de usuario.`);
                return;
            })
    }

    useEffect(() => {
        loadData();
    }, []);


    return (
        <div>
            <h3>Meus Dados</h3>
            {user ? <>
                <div className={styles.container}>
                    <LabelGroup width={'40%'} title={'Nome'} value={user.nome} />
                    <LabelGroup width={'40%'} title={'CPF'} value={user.cpf} />
                    <LabelGroup width={'40%'} title={'Telefone'} value={user.telefone} />
                    <LabelGroup width={'40%'} title={'Email'} value={user.email} />
                    <CustomButton typeButton={'dark'} onClick={() => {
                        SetOnEditPass(true);
                    }}>Alterar Senha</CustomButton>
                    {onEditPass && <ResetPassword signOut={signOut}/>}

                </div></> : <Loading />}
            <hr />
            <h3>Empresas</h3>
            {empresas.map((e) => <ItemEmpresa {...e}/>)}
        </div>
    )
}
const ItemEmpresa = ({id, nomeFantasia, razaoSocial, cnpj, inscricaoEstadual, valorMensal,
                      endereco, nro, bairro, cep, cidade, uf, email, telefone }: IEmpresa) => {


   const[duplicata, setDuplicata] = useState<IDuplicata>()
   useEffect(() => {
           getDuplicata();
   }, [])
   async function getDuplicata(){
       api.get(`/Financeiro/UltimaDuplicata?empresaid=${id}`)
       .then(({data}: AxiosResponse) => {
            if(data && data.length > 0){
                setDuplicata(data[0])
            }

       }).catch((err: AxiosError) => {
                 toast.error(`Erro ao buscar duplicata da empresa ${nomeFantasia}.`)
       });
   }
   return(
    <>
    <div className={styles.container}>
                    <LabelGroup width={'40%'} title={'Nome Fantasia'} value={nomeFantasia} />
                    <LabelGroup width={'40%'} title={'Razao Social'} value={razaoSocial} />
                    <LabelGroup width={'40%'} title={'CNPJ'} value={cnpj} />
                    <LabelGroup width={'40%'} title={'Inscricao Estadual'} value={inscricaoEstadual} />
                    <LabelGroup width={'40%'} title={'Email'} value={email} />
                    <LabelGroup width={'40%'} title={'Telefone'} value={telefone} />
                    <LabelGroup width={'100%'} title={'Endereco'} value={`${endereco}, ${nro} - ${cep} / ${bairro} - ${cidade}/ ${uf}`} />
                    {duplicata &&
                    <div className={styles.container}>
                        <b style={{width: '100%'}}>Ultima mensalidade</b>
                        <LabelGroup width={'40%'} title={'Vencimento'} value={format(new Date(duplicata.dataVencimento), 'dd/MM/yyyy')} />
                        <LabelGroup width={'30%'} title={'Valor'} value={`R$ ${duplicata.valor.toFixed(2)}`} />
                        <LabelGroup width={'30%'} title={'Status'} value={duplicata.isPago ? 'PAGO' : 'EM ABERTO'} />
                    </div>}
    </div>
    <hr/>
    </>
   )
}

const ResetPassword = ({signOut}) => {
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


        const onSubmit = async (data: any) =>{
            if(!data.oldPassword || data.oldPassword.length == 0){
                toast.error(`informe sua senha atual para alterar.`);
                return;
            }
            if(!data.newPassword || data.newPassword.length < 6){
                toast.error(`nova senha invalida. Ela precisa contar no minimo 6 digitos`);
                return;
            }
            if(data.newPassword !== data.confirmPassword){
                toast.error(`Nova senha e confirme nova senha nao conferem.`);
                return;
            }

            await api.put(`/User/UpdatePassword?oldPassword=${data.oldPassword}&password=${data.newPassword}`)
            .then(({data}: AxiosResponse) => {
                toast.success(`Senha alterada com sucesso. Necessario entrar novamente.`);
                signOut();
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao alterar senha. ${err.response?.data || err.message}`);
            })
        }
        
  return(
    <>
    <hr/>
    <div className={styles.container}>
         <InputForm type={'password'}  width={'30%'} title={'Senha Atual'} errors={errors} inputName={"oldPassword"} register={register} />
         <InputForm type={'password'}   width={'30%'} title={'Nova Senha'} errors={errors} inputName={"newPassword"} register={register} />
         <InputForm type={'password'}  width={'30%'} title={'Confirme Nova Senha'} errors={errors} inputName={"confirmPassword"} register={register} />
         <CustomButton typeButton={'dark'} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
        
    </div>
    </>
  )
}