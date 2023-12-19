import IVendaProduto from '@/interfaces/IVendaProduto';
import styles from './styles.module.scss';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import Confirm from '@/components/Modals/Confirm';
import EditItem from '../EditItem';

type carrinhoProps = {
    produtos: IVendaProduto[] | undefined
    onRemoveCarrinho: (index) => Promise<void>
    onEditCarrinho: (index, edited) => Promise<void>
}

export default function Carrinho({ produtos, onRemoveCarrinho, onEditCarrinho }: carrinhoProps) {

    return (
        <div className={styles.carrinho}>
            <h5>Carrinho</h5>
            {produtos?.map((p, index) => <ItemCarrinho onEditCarrinho={onEditCarrinho}  key={index} item={p} index={index} onRemoveCarrinho={onRemoveCarrinho} />)}
        </div>
    )

}
type itemCarrinhoProps = {
    item: IVendaProduto,
    index: number,
    onRemoveCarrinho: (index) =>  Promise<void>
    onEditCarrinho: (index, edited) => Promise<void>
}
const ItemCarrinho = ({item, onRemoveCarrinho, index, onEditCarrinho}: itemCarrinhoProps) => {

    const [onRemove, setOnRemove] = useState(false)
    const [onEdit, setOnEdit] = useState(false)

    return (
        <div className={styles.item}>
            <div style={{ width: '10%', justifyContent: 'space-around', display: 'flex' }}>
                <CustomButton onClick={() => { setOnRemove(true) }} size={'sm'} typeButton={'danger'}><FontAwesomeIcon size={'sm'} icon={faTrash} color={'black'} /></CustomButton>
                <CustomButton onClick={() => { setOnEdit(true) }} size={'sm'} typeButton={'warning'}><FontAwesomeIcon size={'sm'} icon={faEdit} color={'black'} /></CustomButton>
            </div>
            <b style={{ width: '50%' }}>{item.nomeProduto}</b>
            <b style={{ width: '15%' }}>{item.quantidade?.toFixed(3) || '0.000'}</b>
            <b style={{ width: '15%' }}>R$ {item.valorUnitario?.toFixed(2) || '0.00'}</b>
            <b style={{ width: '15%' }}>R$ {item.valorTotal?.toFixed(2) || '0.00'}</b>
            {onRemove && <Confirm isOpen={onRemove} message={`Deseja remover o item ${item.nomeProduto} - ${item.quantidade.toFixed(2)} x R$ ${item.valorTotal.toFixed(2)} ?`} setClose={(v) => {
                  if(v){
                        onRemoveCarrinho(index);
                  }
                  setOnRemove(false);
            }} />}
             {onEdit && <EditItem isOpen={onEdit} vendaProduto={{...item}} setClose={(v) => {
                  if(v){
                    onEditCarrinho(index, v);
                  }
                  setOnEdit(false);
            }} />}
        </div>

    )

}
