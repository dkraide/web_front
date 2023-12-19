import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import GetDinheiroCaixa from "./GetDinheiroCaixa";
import { useEffect, useState } from "react";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import LoadingModal from "@/components/Modals/LoadingModal";
import { format } from "date-fns";
import _ from "lodash";
import ISangriaReforco from "@/interfaces/ISangriaReforco";

interface cancelarProps {
    isOpen: boolean
    setClose: (res: IMovimentoCaixa) => void
    caixa?: IMovimentoCaixa
    usuarioCaixa: IUsuarioCaixa
}
export default function Caixa({ usuarioCaixa, caixa, isOpen, setClose }: cancelarProps) {
    const {
        register,
        formState: { errors } } =
        useForm();

    const [getDinheiro, setGetDinheiro] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vendas, setVendas] = useState(0);
    const [sangrias, setSangrias] = useState(0);
    const [movimentoCaixa, setMovimentoCaixa] = useState<IMovimentoCaixa | undefined>(caixa);


    useEffect(()  => {
        setMovimentoCaixa(caixa);
        if(isOpen && movimentoCaixa?.id != undefined){
            const sangrias = async () => {
                setLoading(true);
                await api.get(`/MovimentoCaixa/Sangrias?MovimentoCaixaId=${caixa.id}`)
                .then(({data}: AxiosResponse<ISangriaReforco[]>) => {
                    setSangrias(_.sumBy(data, p => p.valorMovimento));
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao carregar Sangrias`);
                })
                await api.get(`/MovimentoCaixa/Vendas?MovimentoCaixaId=${caixa.id}&OnlyDinheiro=true`)
                .then(({data}: AxiosResponse) => {
                    setVendas(data);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao carregar vendas`);
                })
                setLoading(false);

            }
            sangrias();
        }
    }, [isOpen])
    async function abrirFecharCaixa(valor: number) {
        setLoading(true);
        if (!movimentoCaixa.id) {
            var obj = {
                idMovimentoCaixa: 0,
                id: 0,
                idUsuario: usuarioCaixa.idUsuario,
                usuarioId: usuarioCaixa.id,
                dataMovimento: new Date(),
                dataFechamento: new Date(),
                status: false,
                valorDinheiro: valor,
                valorDinheiroFinal: 0,
                computadorID: 'NUVEM',
                usuario: undefined,
                empresaId: usuarioCaixa.empresaId,
                sangrias: [],
                vendas: [],
                attOnline: false
            } as IMovimentoCaixa;

            await api.post(`/MovimentoCaixa/Abrir`, obj)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Caixa aberto com sucesso!`);
                    setClose(data);
                }).catch((err: AxiosError) => {
                    toast.error(`Erro ao abrir caixa. ${err.response?.data || err.message}`);
                    return;
                });
        } else {
            movimentoCaixa.valorDinheiroFinal = valor;
            movimentoCaixa.dataFechamento = new Date();
            await api.post(`/MovimentoCaixa/Fechar`, movimentoCaixa)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Caixa fechado com sucesso!`);
                    setMovimentoCaixa(data);
                }).catch((err: AxiosError) => {
                    toast.error(`Erro ao fechar caixa. ${err.response?.data || err.message}`);
                    return;
                });
        }
        setLoading(false);
    }


   if(loading){
    return  <LoadingModal isOpen={loading} setClose={() => { }} />
   }
   if(getDinheiro){
     return <GetDinheiroCaixa isOpen={getDinheiro} setClose={(v) => {
        if (v != undefined) {
            abrirFecharCaixa(v);
        }
        setGetDinheiro(false);
    }} />
   }

   function calculaEsperado(){
        return movimentoCaixa.valorDinheiro + vendas - sangrias;
   }
   function calculaDiferenca(){
       var esperado = calculaEsperado();
       return  movimentoCaixa.valorDinheiroFinal - esperado;
   }

   console.log(movimentoCaixa);
   console.log(caixa);

    return (
        <BaseModal headerOff={!movimentoCaixa?.id} width={'50%'} height={'50%'} title={'Movimento Caixa'} isOpen={isOpen} setClose={
            () => { setClose(movimentoCaixa)}}>
            <div className={styles.content}>
                {movimentoCaixa?.id ?
                    <div className={styles.aberto}>
                        <InputForm defaultValue={movimentoCaixa.id} readOnly={true} width={'15%'} title={'Numero'} register={register} errors={errors} inputName={'id'} />
                        <InputForm defaultValue={format(new Date(movimentoCaixa.dataMovimento), 'dd/MM/yyyy HH:mm')} readOnly={true} width={'35%'} title={'Abertura'} register={register} errors={errors} inputName={'dataMovimento'} />
                        <InputForm defaultValue={movimentoCaixa.status ? 'FECHADO' : 'ABERTO'} readOnly={true} width={'15%'} title={'Status'} register={register} errors={errors} inputName={'status'} />
                        {movimentoCaixa.status ?
                            <InputForm defaultValue={format(new Date(movimentoCaixa.dataFechamento), 'dd/MM/yyyy HH:mm')} readOnly={true} width={'35%'} title={'Fechamento'} register={register} errors={errors} inputName={'dataFechamento'} /> :
                            <CustomButton style={{ height: '40px', marginTop: '10px' }} typeButton={'dark'} onClick={() => setGetDinheiro(true)}>Fechar Caixa</CustomButton>}
                       <div style={{width: '100%', display: 'flex', justifyContent: 'end'}}>
                       <div className={styles.formaPagamento}>
                            <h5>Totais</h5>
                            <ul className={styles.formas}>
                                <li className={styles.liTotal}>
                                    <label>Abertura</label>
                                    <label>R$ {movimentoCaixa.valorDinheiro.toFixed(2)}</label>
                                </li>
                                <li className={[styles.liTotal].join(' ')}>
                                    <label>Sangrias </label>
                                    <label>R$ {sangrias.toFixed(2)}</label>
                                </li>
                                <li className={[styles.liTotal].join(' ')}>
                                    <label>Vendas</label>
                                    <label>R$ {vendas.toFixed(2)}</label>
                                </li>
                                <li className={styles.liTotal}>
                                    <label>Valor Final</label>
                                    <label>{!movimentoCaixa.status ? '--' : `R$ ${movimentoCaixa.valorDinheiroFinal.toFixed(2)}`}</label>
                                </li>
                                <li className={styles.liTotal}>
                                    <label>Esperado</label>
                                    <label>{!movimentoCaixa.status ? '--' : `R$ ${calculaEsperado().toFixed(2)}`}</label>
                                </li>
                                <li className={[styles.liTotal, styles.selected].join(' ')}>
                                    <label>Diferenca</label>
                                    <label>{!movimentoCaixa.status ? '--' : `R$ ${calculaDiferenca().toFixed(2)}`}</label>
                                </li>
                            </ul>
                        </div>
                       </div>
                    </div> :
                    <div className={styles.fechado}>
                        <h1>Caixa Fechado</h1>
                        <h5>Abra o caixa para comecar a fazer vendas.</h5>
                        <CustomButton onClick={() => setGetDinheiro(true)} typeButton={'dark'}>Abrir Caixa</CustomButton>
                    </div>
                }
            </div>
           
        </BaseModal>
    )
}
