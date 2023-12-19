import styles from './styles.module.scss';
import IVenda from '@/interfaces/IVenda';
import _ from 'lodash';
import { Button } from 'react-bootstrap';

type atalhoProps = {
   venda: IVenda
   onKey: (e) => void
}

export default function Atalhos({onKey, venda }: atalhoProps) {


    return (
        <div className={styles.carrinho}>
            <h5>Atalhos</h5>
            <button onClick={() => {onKey({key: 'f1', preventDefault: () => {}})}}>(F1)<br/>Caixa</button>
            <button onClick={() => {onKey({key: 'f2', preventDefault: () => {}})}}>(F2)<br/>CPF</button>
            <button onClick={() => {onKey({key: 'f5', preventDefault: () => {}})}}>(F5)<br/>Finalizar</button>
            <button onClick={() => {onKey({key: 'f12', preventDefault: () => {}})}}>(F12)<br/>Limpar</button>
            <button onClick={() => {onKey({key: 'f6', preventDefault: () => {}})}}>(F6)<br/>Vendas</button>
            <button onClick={() => {onKey({key: 'f7', preventDefault: () => {}})}}>(F7)<br/>Sangrias</button>
            <button onClick={() => {onKey({key: 'f8', preventDefault: () => {}})}}>(F8)<br/>Pesquisar</button>
        </div>
    )

}
