import styles from './styles.module.scss';
import { isMobile } from 'react-device-detect';
import { useEffect, useState } from 'react';
import CustomTable from '@/components/ui/CustomTable';
import { IPremioretirado } from '@/interfaces/IPremioRetirado';
import { format } from 'date-fns';

type props = {
    premios: IPremioretirado[]
}

export default function PontosUtilizados({premios}: props){
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    if(loading){
        return(
            <></>
        )
    }

      return(
            <div>
                {isMobile ? (<FormMobile premios={premios}/>) : (<FormWeb premios={premios}/>)}
            </div>
         )
    
}

const FormWeb = ({ premios }: props) => {
    const columns = [
        {
            name: 'Cliente',
            selector: (row: IPremioretirado) => row.clienteid,
            cell: (row: IPremioretirado) => row.cliente?.nome ?? row.clienteid,
            sortable: true,
        },
        {
            name: 'Premio',
            selector: (row: IPremioretirado) => row.descricao,
            cell: (row: IPremioretirado) => <>{row.descricao}</>,
            sortable: true,
        },
         {
            name: 'Data',
            selector: (row: IPremioretirado) => row.data,
            cell: (row: IPremioretirado) => <>{format(new Date(row.data), 'dd/MM/yy HH:mm')}</>,
            sortable: true,
        },
         {
            name: 'Pontos',
            selector: (row: IPremioretirado) => row.pontos,
            cell: (row: IPremioretirado) => <>{row.pontos}</>,
            sortable: true,
        },
    ]

    return (
        <div className={styles.container}>
            <CustomTable
                columns={columns}
                data={premios}
            />
        </div>
    )

}
const FormMobile = ({ premios }: props) => {
    const Item = (item: IPremioretirado) => {
        return (
            <div className={styles.item}>
                <span className={styles.w100}>Cliente<br /><b>{item.cliente?.nome ?? item.clienteid}</b></span>
                 <span className={styles.w100}>Premio<br /><b>{item.descricao}</b></span>
                <span className={styles.w40}>Data<br /><b>{format(new Date(item.data), 'dd/MM/yy HH:mm')}</b></span>
                <span className={styles.w30}>Pontos<br /><b>{item.pontos}</b></span>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {premios?.map((venda) => Item(venda))}
        </div>
    )

}