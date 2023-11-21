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

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function Visualizar({ user, isOpen, id, setClose, color }: props) {


    const [obj, setObj] = useState<IVenda>({} as IVenda)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        api.get(`/Venda/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IVenda>) => {
                setObj(data);
                setLoading(false);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
                setLoading(false);
            })
    }, []);
    return (
        <BaseModal height={'80%'} width={'80%'} color={color} title={'Visualizar Venda'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.detail}>
                        <h4>Venda</h4>
                        <LabelGroup width={'10%'} title={'Nro'} value={obj.idVenda}/>
                        <LabelGroup width={'10%'} title={'Caixa'} value={obj.idMovimentoCaixa}/>
                        <LabelGroup width={'20%'} title={'Data'} value={format(new Date(obj.dataVenda), 'dd/MM/yyyy HH:mm')}/>
                        <LabelGroup width={'20%'} title={'Usuario'} value={obj.usuario?.nome || obj.idUsuario}/>
                        <LabelGroup width={'20%'} title={'Tipo'} value={obj.estd ? 'FATURADO' : 'ORCAMENTO'}/>
                        <LabelGroup width={'20%'} title={'Status'} value={obj.statusVenda ? 'OK' : 'CANCELADO'}/>
                        <LabelGroup width={'20%'} title={'Cancelamento'} value={obj.statusVenda ? '--' : format(new Date(obj.dataCancelamento), 'dd/MM/yyyy HH:mm')}/>
                        <LabelGroup width={'50%'} title={'Motivo Canc.'} value={obj.statusVenda ? '--' : obj.motivoCancelamento}/>
                    </div>
                    <div className={styles.items}>
                        <h4>Pagamentos</h4>
                        {obj.pagamentos.map((item) => <div key={item.id} className={styles.item}>{item.descricao} - R$ {item.valor.toFixed(2)}</div>)}
                    </div>
                    <div className={styles.items}>
                        <h4>Produtos</h4>
                        {obj.produtos.map((item) => <div key={item.id} className={styles.item}>{item.nomeProduto} - {item.quantidade.toFixed(2)} x   R$ {item.valorTotal.toFixed(2)}</div>)}

                    </div>
                </div>
            )}
        </BaseModal>
    )
}