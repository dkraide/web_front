import { useRouter } from 'next/router';
import styles from './styles.module.scss';
import { useEffect, useState } from 'react';
import IVenda from '@/interfaces/IVenda';
import { api } from '@/services/apiClient';
import { AxiosResponse } from 'axios';
import LoadingModal from '@/components/Modals/LoadingModal';
import { Spinner } from 'react-bootstrap';
import { format } from 'date-fns';


export default function Impressao() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [nota, setNota] = useState<IVenda>({} as IVenda);

    useEffect(() => {
        const { id } = router.query;
        if (!id) {
            return;
        }
        api.get(`/Venda/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IVenda>) => {
                setNota(data);
                setLoading(false);
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 300)
            })
            .catch((err) => {

            });
    }, [router.isReady]);


    if (loading) {
        return <Spinner ></Spinner>
    }

    return (
        <table className={styles.printerticket}>
            <thead>
                <tr>
                    <th colSpan={3}>{nota.empresa.nomeFantasia} <br />
                        {nota.empresa.razaoSocial} <br />
                        {nota.empresa.endereco} , {nota.empresa.nro} - {nota.empresa.cep} <br />
                        {nota.empresa.bairro} - {nota.empresa.cidade}/{nota.empresa.uf}

                    </th>
                </tr>
                {nota.nomeCliente && <>
                    <tr>
                        <th colSpan={3}>
                            {nota.nomeCliente} <br />
                            {nota.cpfCliente}
                        </th>
                    </tr>
                </>}
                <tr>
                    <th className={styles.ttu} colSpan={3}>
                        <b>Cupom não fiscal</b>
                    </th>
                </tr>
                <tr>
                    <th colSpan={3}>{nota.id} - {format(new Date(nota.dataVenda), 'dd/MM/yyyy HH:mm:ss')}</th>
                </tr>
            </thead>
            <tbody>
                <tr className={styles.top}>
                    <td>PRODUTO|R$ VLR UN</td>
                    <td>QNTD</td>
                    <td>R$ TOTAL</td>
                </tr>
                {nota.produtos.map((produto) => {
                    return (
                        <>
                            <tr className={styles.top}>
                                <td colSpan={3}>{produto.nomeProduto}</td>
                            </tr>
                            <tr>
                                <td>R${produto.valorUnitario.toFixed(2)}</td>
                                <td>{produto.quantidade.toFixed(2)}</td>
                                <td>R${produto.valorTotal.toFixed(2)}</td>
                            </tr>
                        </>
                    )
                })}
            </tbody>
            <tfoot>
                <tr className={[styles.sup, styles.ttu, "p--0"].join(' ')}>
                    <td colSpan={3}>
                        <b>Totais</b>
                    </td>
                </tr>
                <tr className={styles.ttu}>
                    <td colSpan={2}>Sub-total</td>
                    <td align="right">R${nota.valorSubTotal.toFixed(2)}</td>
                </tr>
                <tr className={styles.ttu}>
                    <td colSpan={2}>Acrescimos</td>
                    <td align="right">R${nota.valorAcrescimo.toFixed(2)}</td>
                </tr>
                <tr className={styles.ttu}>
                    <td colSpan={2}>Desconto</td>
                    <td align="right">R${nota.valorDesconto.toFixed(2)}</td>
                </tr>
                <tr className={styles.ttu}>
                    <td colSpan={2}>Total</td>
                    <td align="right">R${nota.valorTotal.toFixed(2)}</td>
                </tr>
                <tr className={[styles.sup, styles.ttu, "p--0"].join(' ')}>
                    <td colSpan={3}>
                        <b>Pagamentos</b>
                    </td>
                </tr>
                {nota.pagamentos.map(pag => {
                    return (
                        <tr className={styles.ttu}>
                            <td colSpan={2}>{pag.descricao}</td>
                            <td align="right">R${pag.valor.toFixed(2)}</td>
                        </tr>
                    )
                })}
                <tr className={styles.ttu}>
                    <td colSpan={2}>Total pago</td>
                    <td align="right">R${nota.valorTotal.toFixed(2)}</td>
                </tr>
                {nota.logradouro && <>
                    <tr className={styles.sup}>
                        <td colSpan={3} align="center">
                            <b>Entrega:</b><br />
                            {nota.logradouro},  {nota.numero} -  {nota.cep} <br />
                            {nota.bairro} - {nota.municipio}/{nota.uf} <br />
                        </td>
                    </tr>
                </>}
            </tfoot>
        </table>
    )
}