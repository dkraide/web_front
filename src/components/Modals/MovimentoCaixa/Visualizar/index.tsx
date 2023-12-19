import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import BaseModal from "../../Base/Index";
import _ from "lodash";
import IVenda from "@/interfaces/IVenda";
import { LabelGroup } from "@/components/ui/LabelGroup";
import { format } from "date-fns";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { Spinner } from "react-bootstrap";

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface valorProps {
    forma: string
    qntd: number
    valor: number
}
export default function Visualizar({ user, isOpen, id, setClose, color }: props) {


    const [obj, setObj] = useState<IMovimentoCaixa>({} as IMovimentoCaixa)
    const [totais, setTotais] = useState<valorProps[]>()
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        api.get(`/MovimentoCaixa/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IMovimentoCaixa>) => {
                setObj(data);
                setLoading(false);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
                setLoading(false);
            })
            api.get(`/MovimentoCaixa/GetTotais?id=${id}`)
            .then(({ data }: AxiosResponse<valorProps[]>) => {
                setTotais(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar totais. ${err.message}`)
            })
    }, []);

    function calcularVendas(){
        if(!totais){
            return 0;
        }
        var total = 0;
        totais.map(p => {
            if(p.forma.toUpperCase().includes('DINHEIRO')){
                total += p.valor
            }
        });
        return total;
    }
    function calcularSangrias(){
        if(!obj || !obj.sangrias){
            return 0;
        }
        var total = _.sumBy(obj.sangrias, o => o.isSangria ? o.valorMovimento : 0);
        return total;
    }
    function calculaEntradas(){
        if(!obj || !obj.sangrias){
            return 0;
        }
        var total = _.sumBy(obj.sangrias, o => !o.isSangria ? o.valorMovimento : 0);
        return total;
    }
    function calculaEsperado(){
        var sangrias = calcularSangrias();
        var entradas = calculaEntradas();
        var vendas = calcularVendas();
        var resultado = obj.valorDinheiro + vendas + entradas - sangrias;
        return resultado;
    }
    function calculaDiferenca(){
       var resultado = calculaEsperado();
       return resultado - obj.valorDinheiroFinal;
    }
   
    return (
        <BaseModal height={'80%'} width={'80%'} color={color} title={'Visualizar Movimento Caixa'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.detail}>
                        <h4>Movimento</h4>
                        <LabelGroup width={'10%'} title={'Nro'} value={obj.idMovimentoCaixa}/>
                        <LabelGroup width={'20%'} title={'Abertura'} value={format(new Date(obj.dataMovimento || new Date()), 'dd/MM/yyyy HH:mm')}/>
                        <LabelGroup width={'20%'} title={'Usuario'} value={obj.usuario?.nome || obj.idUsuario}/>
                        <LabelGroup width={'20%'} title={'Status'} value={obj.status ? 'FECHADO' : 'ABERTO'}/>
                        <LabelGroup width={'20%'} title={'Fechamento'} value={obj.status ? format(new Date(obj.dataFechamento), 'dd/MM/yyyy HH:mm') : '--'}/>
                        <h4>Totais</h4>
                        <LabelGroup width={'15%'} title={'Abertura (+)'} value={obj.valorDinheiro.toFixed(2)}/>
                        <LabelGroup width={'15%'} title={'Vendas (+)'} value={calcularVendas().toFixed(2)}/>
                        <LabelGroup width={'15%'} title={'Entradas (+)'} value={calculaEntradas().toFixed(2)}/>
                        <LabelGroup width={'15%'} title={'Sangrias (-)'} value={calcularSangrias().toFixed(2)}/>
                        <LabelGroup width={'15%'} title={'Informado (=)'} value={obj.status ? obj.valorDinheiroFinal.toFixed(2) : '--'}/>
                        <LabelGroup width={'10%'} title={'Esperado (=)'} value={obj.status ? calculaEsperado().toFixed(2) : '--'}/>
                        <LabelGroup width={'10%'} title={'Diferenca (=)'} value={obj.status ? calculaDiferenca().toFixed(2) : '--'}/>
                        <hr/>
                    </div>
                    <div className={styles.totais}>
                        <h4>Totais</h4>
                        {!totais ? <div><Spinner/><p><b>Carregando totais...</b></p></div> : <div>
                            {totais?.map((item, index) => <div key={index} className={styles.item}>
                            <b style={{width: '50%'}}>{item.forma}</b>
                            <b style={{width: '25%'}}>{item.qntd}</b>
                            <b style={{width: '25%'}}>R$ {item.valor.toFixed(2)}</b>
                        </div>)} 
                        <div className={styles.item}>
                            <b style={{width: '50%'}}>TOTAL</b>
                            <b style={{width: '25%'}}>{_.sumBy(totais, t => t.qntd)}</b>
                            <b style={{width: '25%'}}>R$ {_.sumBy(totais, t => t.valor).toFixed(2)}</b>
                        </div>
                            </div>}
                    </div>
                    <div className={styles.vendas}>
                        <h4>Vendas</h4>
                        {obj.vendas?.map((item) => 
                            <div key={item.id} className={styles.item}>
                                <LabelGroup width={'20%'} value={item.idVenda} title={'Nro'}/>
                                <LabelGroup width={'40%'} value={format(new Date(item.dataVenda), 'dd/MM/yyyy HH:mm')} title={'Nro'}/>
                                <LabelGroup width={'20%'} value={item.valorTotal.toFixed(2)} title={'Valor'}/>
                                <LabelGroup width={'20%'} value={item.statusVenda ? 'OK' : 'Cancelada'} title={'Status'}/>
                                <LabelGroup width={'20%'} value={item.estd ? 'FATURADA' : 'ORCAMENTO'} title={'Tipo'}/>
                                <LabelGroup width={'20%'} value={item.usuario?.nome ||  '--'} title={'Usuario'}/>
                            </div>)}
                    </div>
                    <div className={styles.sangrias}>
                        <h4>Sangrias</h4>
                        {obj.sangrias?.map((item) => <div key={item.id} className={styles.item}>
                        <LabelGroup width={'20%'} value={item.idSangriaReforco} title={'Nro'}/>
                        <LabelGroup width={'20%'} value={item.isSangria ? 'SANGRIA' : 'ENTRADA'} title={'Tipo'}/>
                        <LabelGroup width={'60%'} value={format(new Date(item.dataSangria), 'dd/MM/yyyy HH:mm')} title={'Data'}/>
                        <LabelGroup width={'20%'} value={item.valorMovimento.toFixed(2)} title={'Valor'}/>
                        <LabelGroup width={'80%'} value={item.motivo} title={'Descricao'}/>
                      </div>)}

                    </div>
                </div>
            )}
        </BaseModal>
    )
}