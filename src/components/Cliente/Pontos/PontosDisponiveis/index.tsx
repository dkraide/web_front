import ICliente from '@/interfaces/ICliente';
import styles from './styles.module.scss';
import { isMobile } from 'react-device-detect';
import { useEffect, useState } from 'react';
import CustomTable from '@/components/ui/CustomTable';

type props = {
    clientes: ICliente[]
}

export default function PontosDisponiveis({clientes}: props){
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
                {isMobile ? (<FormMobile clientes={clientes}/>) : (<FormWeb clientes={clientes}/>)}
            </div>
         )
    
}

const FormWeb = ({ clientes }: props) => {
    const columns = [
        {
            name: 'Cliente',
            selector: (row: ICliente) => row.nome,
            cell: (row: ICliente) => row.nome,
            sortable: true,
        },
        {
            name: 'Telefone',
            selector: (row: ICliente) => row.telefone,
            cell: (row: ICliente) => <>{row.telefone}</>,
            sortable: true,
        },
         {
            name: 'CPF',
            selector: (row: ICliente) => row.cpf,
            cell: (row: ICliente) => row.cpf,
            sortable: true,
        },
         {
            name: 'Pontos',
            selector: (row: ICliente) => row.pontos,
            cell: (row: ICliente) => <>{row.pontos}</>,
            sortable: true,
        },
    ]

    return (
        <div className={styles.container}>
            <CustomTable
                columns={columns}
                data={clientes}
            />
        </div>
    )

}
const FormMobile = ({ clientes }: props) => {
    const Item = (item: ICliente) => {
        return (
            <div className={styles.item}>
                <span className={styles.w100}>Cliente<br /><b>{item.nome}</b></span>
                <span className={styles.w30}>CPF<br /><b>{item.cpf}</b></span>
                <span className={styles.w30}>Telefone<br /><b>{item.telefone}</b></span>
                <span className={styles.w20}>Pontos<br /><b>{item.pontos}</b></span>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {clientes?.map((venda) => Item(venda))}
        </div>
    )

}