import IUsuario from '@/interfaces/IUsuario';
import styles from './styles.module.scss';
import IVenda from '@/interfaces/IVenda';
import _ from 'lodash';

type carrinhoProps = {
   usuario: IUsuario
}

export default function Usuario({ usuario }: carrinhoProps) {

    return (
        <div className={styles.carrinho}>
            <p>Bem vindo,</p>
            <b>{usuario.nome}</b>
        </div>
    )

}
