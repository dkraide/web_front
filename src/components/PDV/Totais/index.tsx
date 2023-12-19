import IVendaProduto from '@/interfaces/IVendaProduto';
import styles from './styles.module.scss';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import Confirm from '@/components/Modals/Confirm';
import EditItem from '../EditItem';
import IVenda from '@/interfaces/IVenda';
import _ from 'lodash';

type carrinhoProps = {
   venda: IVenda
}

export default function Totais({ venda }: carrinhoProps) {

    return (
        <div className={styles.carrinho}>
            <h5>Totais</h5>
            <div className={styles.item}>
                <b>Produtos</b>
                <b>R$ {_.sumBy(venda?.produtos, p => (p.produto.valor > p.valorUnitario ? p.produto.valor : p.valorUnitario) * p.quantidade)?.toFixed(2) || '0.00'}</b>
            </div>
            <div className={styles.item}>
                <b>Descontos</b>
                <b>R$ {_.sumBy(venda?.produtos, p => (p.produto.valor > p.valorUnitario ?( p.produto.valor - p.valorUnitario) :  0) * p.quantidade)?.toFixed(2) || '0.00'}</b>
            </div>
            <div className={styles.item}>
                <b>Total</b>
                <b>R$ {_.sumBy(venda?.produtos, p => p.valorTotal)?.toFixed(2) || '0.00'}</b>
            </div>
           
        </div>
    )

}
