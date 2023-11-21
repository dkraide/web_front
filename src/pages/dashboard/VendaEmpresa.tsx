import IEmpresa from "@/interfaces/IEmpresa"
import IVenda from "@/interfaces/IVenda"
import styles from './styles.module.scss';

interface resProps{
    total: number
    qntd: number
    custo: number
    empresa: IEmpresa
    vendas: IVenda[]
}
interface props{
    obj: resProps
}
export default function VendaEmpresa({obj}: props){
    if(!obj){
        return <div></div>
    }
    
    return(
        <div className={styles.itemVenda}>
            <div className={styles.header}>
                  <b>{obj.empresa.nomeFantasia}</b>
            </div>
            <div className={styles.body}>
                <ItemValue text={'Quantidade'} value={`${obj.qntd}`} />
                <ItemValue text={'Vendas'} value={`R$ ${obj.total.toFixed(2)}`} />
                <ItemValue text={'Custo'} value={`R$ ${obj.custo.toFixed(2)}`} />
                <ItemValue text={'Lucro'} value={`R$ ${(obj.total - obj.custo).toFixed(2)}`} />
            </div>
        </div>
    )

}
const ItemValue = ({value, text}) => {
    return(
        <div className={styles.itemValue}>
             <label className={styles.value}>{value}</label>
             <label className={styles.text}>{text}</label>
        </div>
    )
}