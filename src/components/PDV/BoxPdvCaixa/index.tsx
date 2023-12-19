import IUsuario from '@/interfaces/IUsuario';
import styles from './styles.module.scss';
import IVenda from '@/interfaces/IVenda';
import _ from 'lodash';
import IMovimentoCaixa from '@/interfaces/IMovimentoCaixa';

type carrinhoProps = {
    caixa: IMovimentoCaixa
}

export default function BoxPdvCaixa({ caixa }: carrinhoProps) {

    return (
        <div className={styles.carrinho}>
            <p>MovimentoCaixa</p>
            {caixa ?
                <>
                    <b>{caixa.id} - ABERTO</b>
                </> : <>
                    <b>CAIXA FECHADO</b>
                </>}
        </div>
    )

}
