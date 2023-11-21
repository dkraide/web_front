import { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import IEmpresa from '@/interfaces/IEmpresa'
import { InputForm, InputFormMask } from '@/components/ui/InputGroup'
import { AxiosError, AxiosResponse } from 'axios'
import { blobToBase64, fGetNumber, getURLImagemMenu, sendImage } from '@/utils/functions'
import { apiViaCep } from '@/services/apiViaCep'
import { toast } from 'react-toastify'
import SelectEstado from '@/components/Selects/SelectEstado'
import SelectCidade from '@/components/Selects/SelectCidade'
import { api } from '@/services/apiClient'
import { useForm } from 'react-hook-form'
import { AuthContext } from '@/contexts/AuthContext'
import CustomButton from '@/components/ui/Buttons'
import { Spinner } from 'react-bootstrap'
import IMenuDigitalConfiguracao from '@/interfaces/IMenuDigitalConfiguracao'
import SelectSimNao from '@/components/Selects/SelectSimNao'
import PictureBox from '@/components/ui/PictureBox'


export default function Configuracao() {
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IMenuDigitalConfiguracao>()
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const { getUser } = useContext(AuthContext);
    useEffect(() => {
        const loadData = async () => {
            const id = (await getUser()).empresaSelecionada;
            if (id > 0) {
                api.get(`/MenuDigital/Configuracao?id=${id}&withHorarios=true`)
                    .then(({ data }: AxiosResponse) => {
                        setObjeto(data);
                        console.log(data);
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
        var horario = "";
        if(objeto.todoDia){
            horario += `${data.iniciot}#${data.fimt};`
        }else{
            var horario = "";
            if(data.iniciodom && data.fimdom){
                horario += `${data.iniciodom}#${data.fimdom};`
            }else{
                 horario += `@;`
            }
            if(data.inicioseg && data.fimseg){
                horario += `${data.inicioseg}#${data.fimseg};`
            }else{
                 horario += `@;`
            }
            if(data.inicioter && data.fimter){
                horario += `${data.inicioter}#${data.fimter};`
            }else{
                 horario += `@;`
            }
            if(data.inicioqua && data.fimqua){
                horario += `${data.inicioqua}#${data.fimqua};`
            }else{
                 horario += `@;`
            }
            if(data.inicioqui && data.fimqui){
                horario += `${data.inicioqua}#${data.fimqua};`
            }else{
                 horario += `@;`
            }
            if(data.iniciosex && data.fimsex){
                horario += `${data.iniciosex}#${data.fimsex};`
            }else{
                 horario += `@;`
            }
            if(data.iniciosab && data.fimsab){
                horario += `${data.iniciosab}#${data.fimsab};`
            }else{
                 horario += `@;`
            }
        }
        objeto.horario = horario;
        objeto.valorInicial = fGetNumber(data.valorInicial);
        objeto.valorPorKm = fGetNumber(data.valorPorKm);
        objeto.limiteKm = fGetNumber(data.limiteKm);
        console.log(data);
        api.put(`MenuDigital/Configuracao`, objeto)
            .then(({ data }: AxiosResponse) => {
                toast.success(`grupo atualizado com sucesso!`);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar grupo. ${err.response?.data}`);
            })
    }
    if (!objeto) {
        return <Spinner size={'sm'} />
    }

    function changeDiaEspecifico(index: number, checked: boolean){
        if(checked){
            objeto.horarios[index].abertura = '10:00';
            objeto.horarios[index].fechamento = '20:00';
        }else{
            objeto.horarios[index].abertura = 'FECHADO';
            objeto.horarios[index].fechamento = 'FECHADO';
        }
        setObjeto({...objeto, horarios: objeto.horarios});
    }
    function setImage(){
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
           var imagemstring = await blobToBase64(files[0])
            var obj = {
                imagemString: imagemstring,
                idProduto: -1,
                empresaid: objeto.empresaId
            };
            var res = await sendImage(obj);
            if(res){
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        }
    }
    return (
        <>
            <h3>Imagem Principal do Menu</h3>
            <hr/>
            <PictureBox width={'700px'} height={'200px'}  onClick={() => {setImage()}} url={getURLImagemMenu(undefined, `${objeto.empresaId}folder`)} size={undefined} />
            <h3>Configuracao</h3>
            <div className={styles.container}>
                <SelectSimNao title={'Entrega'} width={'25%'} selected={objeto.entrega} setSelected={(v) => { setObjeto({ ...objeto, entrega: v }) }} />
                <SelectSimNao title={'Valor Fixo'} width={'25%'} selected={objeto.isValorFixo} setSelected={(v) => { setObjeto({ ...objeto, isValorFixo: v }) }} />
                <InputForm defaultValue={objeto.valorInicial} width={'15%'} title={'Valor Inicial'} errors={errors} inputName={"valorInicial"} register={register} />
                <InputForm defaultValue={objeto.valorPorKm} width={'15%'} title={'Valor por KM '} errors={errors} inputName={"valorPorKm"} register={register} />
                <InputForm defaultValue={objeto.limiteKm} width={'15%'} title={'Limite KM'} errors={errors} inputName={"limiteKm"} register={register} />
            </div>
            <hr/>
            <h3>Horarios</h3>
            <SelectSimNao width={'30%'} title={'Todos os Dias'} setSelected={(v) => setObjeto({ ...objeto, todoDia: v })} selected={objeto.todoDia} />
            <div className={styles.container}>
                {objeto.todoDia ?
                    <TodoDia inicio={objeto.horario.split('#')[0]} fim={objeto.horario.split('#')[1]} register={register} errors={errors} /> :
                    <DiaEspecifico changeDiaEspecifico={changeDiaEspecifico} horarios={objeto.horarios} register={register} errors={errors} />}

            </div>
            <div style={{ width: '100%' }}>
                <CustomButton typeButton={'dark'} onClick={() => { handleSubmit(onSubmit)() }}>Salvar</CustomButton>
            </div>
        </>
    )
}

const TodoDia = ({ inicio, fim, register, errors }) => {
    return (
        <div className={styles.container}>
            <InputFormMask mask={'99:99'} defaultValue={inicio} width={'15%'} title={'Abertura'} errors={errors} inputName={"iniciot"} register={register} />
            <InputFormMask mask={'99:99'} defaultValue={fim} width={'15%'} title={'Fecha'} errors={errors} inputName={"fimt"} register={register} />
        </div>
    )
}

const DiaEspecifico = ({ horarios, register, errors, changeDiaEspecifico }) => {

    function isFechado(index) {
        return horarios[index].abertura === 'FECHADO';
    }
    return (
        <div className={styles.containerDias}>
            <div className={styles.container}>
                <div className={styles.day}>
                    <input onChange={(e) => {changeDiaEspecifico(0, e.target.checked)}} type={'checkbox'} checked={horarios[0].abertura !== 'FECHADO'} />
                    <h5>Domingo</h5>
                </div>
                {
                    isFechado(0) ? <b>FECHADO</b> :
                        <>
                            <InputFormMask mask={'99:99'} defaultValue={horarios[0].abertura} width={'30%'} title={'Abertura'} errors={errors} inputName={"iniciodom"} register={register} />
                            <InputFormMask mask={'99:99'} defaultValue={horarios[0].fechamento} width={'30%'} title={'Fecha'} errors={errors} inputName={"fimdom"} register={register} />
                        </>
                }
            </div>
            <div className={styles.container}>
                <div className={styles.day}>
                    <input onChange={(e) => {changeDiaEspecifico(1, e.target.checked)}} type={'checkbox'} checked={horarios[1].abertura !== 'FECHADO'} />
                    <h5>Segunda-Feira</h5>
                </div>
                {
                    isFechado(1) ? <b>FECHADO</b> :
                        <>
                            <InputFormMask mask={'99:99'} defaultValue={horarios[1].abertura} width={'30%'} title={'Abertura'} errors={errors} inputName={"inicioseg"} register={register} />
                            <InputFormMask mask={'99:99'} defaultValue={horarios[1].fechamento} width={'30%'} title={'Fecha'} errors={errors} inputName={"fimseg"} register={register} />
                        </>
                }

            </div>
            <div className={styles.container}>
                <div className={styles.day}>
                    <input onChange={(e) => {changeDiaEspecifico(2, e.target.checked)}} type={'checkbox'} checked={horarios[2].abertura !== 'FECHADO'} />
                    <h5>Terca-Feira</h5>
                </div>
                {
                    isFechado(2) ? <b>FECHADO</b> :
                        <>
                            <InputFormMask mask={'99:99'} defaultValue={horarios[2].abertura} width={'30%'} title={'Abertura'} errors={errors} inputName={"inicioter"} register={register} />
                            <InputFormMask mask={'99:99'} defaultValue={horarios[2].fechamento} width={'30%'} title={'Fecha'} errors={errors} inputName={"fimter"} register={register} />
                        </>
                }
            </div>
            <div className={styles.container}>
                <div className={styles.day}>
                    <input onChange={(e) => {changeDiaEspecifico(3, e.target.checked)}} type={'checkbox'} checked={horarios[3].abertura !== 'FECHADO'} />
                    <h5>Quarta-Feira</h5>
                </div>
                {
                    isFechado(3) ? <b>FECHADO</b> :
                        <>
                            <InputFormMask mask={'99:99'} defaultValue={horarios[3].abertura} width={'30%'} title={'Abertura'} errors={errors} inputName={"inicioqua"} register={register} />
                            <InputFormMask mask={'99:99'} defaultValue={horarios[3].fechamento} width={'30%'} title={'Fecha'} errors={errors} inputName={"fimqua"} register={register} />
                        </>
                }
            </div>
            <div className={styles.container}>
                <div className={styles.day}>
                    <input onChange={(e) => {changeDiaEspecifico(4, e.target.checked)}} type={'checkbox'} checked={horarios[4].abertura !== 'FECHADO'} />
                    <h5>Quinta-Feira</h5>
                </div>
                {
                    isFechado(4) ? <b>FECHADO</b> :
                        <>
                            <InputFormMask mask={'99:99'} defaultValue={horarios[4].abertura} width={'30%'} title={'Abertura'} errors={errors} inputName={"inicioqui"} register={register} />
                            <InputFormMask mask={'99:99'} defaultValue={horarios[4].fechamento} width={'30%'} title={'Fecha'} errors={errors} inputName={"fimqui"} register={register} />
                        </>
                }
            </div>
            <div className={styles.container}>
                <div className={styles.day}>
                    <input onChange={(e) => {changeDiaEspecifico(5, e.target.checked)}} type={'checkbox'} checked={horarios[5].abertura !== 'FECHADO'} />
                    <h5>Sexta-Feira</h5>
                </div>
                {
                    isFechado(5) ? <b>FECHADO</b> :
                        <>
                            <InputFormMask mask={'99:99'} defaultValue={horarios[5].abertura} width={'30%'} title={'Abertura'} errors={errors} inputName={"iniciosex"} register={register} />
                            <InputFormMask mask={'99:99'} defaultValue={horarios[5].fechamento} width={'30%'} title={'Fecha'} errors={errors} inputName={"fimsex"} register={register} />
                        </>
                }
            </div>
            <div className={styles.container}>
                <div className={styles.day}>
                    <input onChange={(e) => {changeDiaEspecifico(6, e.target.checked)}} type={'checkbox'} checked={horarios[6].abertura !== 'FECHADO'} />
                    <h5>Sabado</h5>
                </div>
                {
                    isFechado(6) ? <b>FECHADO</b> :
                        <>
                            <InputFormMask mask={'99:99'} defaultValue={horarios[6].abertura} width={'30%'} title={'Abertura'} errors={errors} inputName={"iniciosab"} register={register} />
                            <InputFormMask mask={'99:99'} defaultValue={horarios[6].fechamento} width={'30%'} title={'Fecha'} errors={errors} inputName={"fimsab"} register={register} />
                        </>
                }
            </div>
        </div>
    )
}