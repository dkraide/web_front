import IVenda from '@/interfaces/IVenda';
import styles from './styles.module.scss';
import { isMobile } from 'react-device-detect';
import { format } from 'date-fns';
import { GetCurrencyBRL } from '@/utils/functions';
import CustomTable from '@/components/ui/CustomTable';
import { useEffect, useState } from 'react';

type props = {
    vendas: IVenda[]
}

export default function PontosGerados({ vendas }: props) {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(false);
    }, [])

    if(loading){
        return (
            <></>
        )
    }
     return(
        <div>
            {isMobile ? (<FormMobile vendas={vendas}/>) : (<FormWeb vendas={vendas}/>)}
        </div>
     )
}

const FormWeb = ({ vendas }: props) => {
    const columns = [
        {
            name: 'Venda',
            selector: (row: IVenda) => row.id,
            cell: (row: IVenda) => row.id,
            sortable: true,
        },
        {
            name: 'Data',
            selector: (row: IVenda) => (row.dataVenda ?? '').toString(),
            cell: (row: IVenda) => <>{format(new Date(row.dataVenda), 'dd/MM/yy HH:mm')}</>,
            sortable: true,
        },
         {
            name: 'Cliente',
            selector: (row: IVenda) => row.clienteId,
            cell: (row: IVenda) => row.cliente?.nome ?? row.clienteId.toString(),
            sortable: true,
        },
         {
            name: 'Status',
            selector: (row: IVenda) => row.valorTotal,
            cell: (row: IVenda) => <>{row.statusVenda ? 'OK' : 'CANCELADA'}</>,
            sortable: true,
        },
        {
            name: 'Valor',
            selector: (row: IVenda) => row.valorTotal,
            cell: (row: IVenda) => <>{GetCurrencyBRL(row.valorTotal)}</>,
            sortable: true,
        },
        {
            name: 'Pontos',
            selector: (row: IVenda) => row.pontosGanhos,
            cell: (row: IVenda) => <>{row.pontosGanhos}</>,
            sortable: true,
        }
    ]

    return (
        <div className={styles.container}>
            <CustomTable
                columns={columns}
                data={vendas}
            />
        </div>
    )

}
const FormMobile = ({ vendas }: props) => {
    const Item = (item: IVenda) => {
        return (
            <div className={styles.item}>
                <span className={styles.w20}>Venda<br /><b>{item.id}</b></span>
                <span className={styles.w30}>Data<br /><b>{format(new Date(item.dataVenda), 'dd/MM/yy HH:mm')}</b></span>
                <span className={styles.w30}>Status<br /><b>{item.statusVenda ? 'OK' : 'CANCELADA'}</b></span>
                <span className={styles.w20}>Valor<br /><b>{GetCurrencyBRL(item.valorTotal)}</b></span>
                <span className={styles.w20}>Cliente<br /><b>{item.cliente?.nome ?? item.clienteId}</b></span>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {vendas?.map((venda) => Item(venda))}
        </div>
    )

}