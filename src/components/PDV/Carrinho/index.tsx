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
            <table className={"table"}>
                <thead>
                    <tr>
                        <th style={{width: '10%'}}>#</th>
                        <th style={{width: '50%'}}>Produto</th>
                        <th style={{width: '10%'}}>Qntd</th>
                        <th style={{width: '10%'}}>Vlr Un.</th>
                        <th style={{width: '10%'}}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {!produtos ? <><span>Carrinho vazio</span></> :
                       produtos?.map((p, index) => <ItemCarrinho onEditCarrinho={onEditCarrinho} key={index} item={p} index={index} onRemoveCarrinho={onRemoveCarrinho} />)}
                </tbody>
            </table>

        </div>
    )

}
type itemCarrinhoProps = {
    item: IVendaProduto,
    index: number,
    onRemoveCarrinho: (index) => Promise<void>
    onEditCarrinho: (index, edited) => Promise<void>
}
const ItemCarrinho = ({ item, onRemoveCarrinho, index, onEditCarrinho }: itemCarrinhoProps) => {

    const [onRemove, setOnRemove] = useState(false)
    const [onEdit, setOnEdit] = useState(false)

    return (
        <tr>
            <td>
                <CustomButton onClick={() => { setOnRemove(true) }} size={'sm'} typeButton={'danger'}><FontAwesomeIcon size={'sm'} icon={faTrash} color={'black'} /></CustomButton>
                <CustomButton onClick={() => { setOnEdit(true) }} size={'sm'} typeButton={'warning'}><FontAwesomeIcon size={'sm'} icon={faEdit} color={'black'} /></CustomButton>
            </td>
            <td>{item.nomeProduto}</td>
            <td>{item.quantidade?.toFixed(3) || '0.000'}</td>
            <td>R$ {item.valorUnitario?.toFixed(2) || '0.00'}</td>
            <td>R$ {item.valorTotal?.toFixed(2) || '0.00'}</td>
            {onRemove && <Confirm isOpen={onRemove} message={`Deseja remover o item ${item.nomeProduto} - ${item.quantidade.toFixed(2)} x R$ ${item.valorTotal.toFixed(2)} ?`} setClose={(v) => {
                if (v) {
                    onRemoveCarrinho(index);
                }
                setOnRemove(false);
            }} />}
            {onEdit && <EditItem isOpen={onEdit} vendaProduto={{ ...item }} setClose={(v) => {
                if (v) {
                    onEditCarrinho(index, v);
                }
                setOnEdit(false);
            }} />}
        </tr>

    )

}
