import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../Base/Index";
import styles from "./styles.module.scss";
import IDuplicata from "@/interfaces/IDuplicata";
import { format } from "date-fns";
import _ from "lodash";
import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import IPix from "@/interfaces/IPix";
import QRCode from "react-qr-code";

interface cancelarProps {
    isOpen: boolean
    duplicatas: IDuplicata[]
    setClose: (res: boolean) => void
}
export default function PagamentoDuplicata({ isOpen, duplicatas, setClose }: cancelarProps) {

    const [pix, setPix] = useState<IPix>()

    useEffect(() => {
        if (!isOpen || !duplicatas || duplicatas.length == 0) {
            return;
        }

        const loadPix = async () => {
            var data = {
                abertos: true,
                valor: Number(_.sumBy(duplicatas, d => d.valor).toFixed(2)),
                empresa: duplicatas[0].empresaId
            }
            await api.post(`/Financeiro/CreatePix`, data)
                .then(({ data }: AxiosResponse) => {
                    setPix(data);
                }).catch((err) => {
                    toast.error(`Erro ao Gerar PIX. ${err.response?.data || err.message}`);
                });
           

        }
        loadPix();

    }, [isOpen])


    setInterval(async () => {
        if (!pix || pix.status != 'ATIVA' || !isOpen) {
            return;
        }
        await api.get(`/Financeiro/GetPix?txid=${pix.txid}&abertos=true`)
            .then(({ data }: AxiosResponse<IPix>) => {
                setPix(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao consultar pagamento do PIX. caso ja tenha pago. apenas recarregue essa pagina!`);
            });
    }, 5000)


    return (
        <BaseModal width={'50%'} height={'30%'} title={'Pagamentos em Aberto'} isOpen={isOpen} setClose={() => { setClose(false) }}>
            {(!!pix && pix.status == 'CONCLUIDA') ? <>
            <h5>Obrigado pelo pagamento =)</h5>
            </> : <>
               
                <div className={styles.content}>
                    <div style={{ width: '60%' }}>
                        <h5>Pagamentos</h5>
                        <table className={'table'}>
                            <thead>
                                <tr>
                                    <th style={{ width: '10%' }}>Numero</th>
                                    <th style={{ width: '50%' }}>Empresa</th>
                                    <th style={{ width: '20%' }}>Vencimento</th>
                                    <th style={{ width: '20%' }}>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicatas?.map((duplicata) => <tr>
                                    <td>{duplicata?.id}</td>
                                    <td>{duplicata?.empresa.nomeFantasia}</td>
                                    <td>{format(new Date(duplicata?.dataVencimento), 'dd/MM/yyyy')}</td>
                                    <td>R$ {duplicata?.valor?.toFixed(2)}</td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ width: '40%' }}>
                        <h5>Total</h5>
                        <table className={"table"}>
                            <thead>
                                <tr>
                                    <th>Qntd</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{duplicatas.length}</td>
                                    <td>R$ {_.sumBy(duplicatas, d => d.valor).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <hr />
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                            {!!pix && <>
                                <h5>Pague agora via PIX!</h5>
                                <QRCode value={pix?.pixCopiaECola || ''} />
                            </>}
                        </div>
                    </div>
                </div>
            </>}

        </BaseModal>
    )
}
