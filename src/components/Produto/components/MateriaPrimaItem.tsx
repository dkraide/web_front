import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import CustomButton from '@/components/ui/Buttons';
import IProdutoMateriaPrima from '@/interfaces/IProdutoMateriaPrima';
import styles from '../styles.module.scss';

interface MateriaPrimaItemProps {
    item: IProdutoMateriaPrima;
    onRemove: () => void;
}

export default function MateriaPrimaItem({ item, onRemove }: MateriaPrimaItemProps) {
    return (
        <div className={styles.grupo}>
            <div style={{ width: '90%', display: 'flex', flexDirection: 'row' }}>
                <div style={{ width: '70%' }}>
                    <h5>
                        {item.materiaPrima?.nome} - {item.opcional ? 'Opcional' : 'Obrigatorio'}
                    </h5>
                    <b>Quantidade: {item.quantidadeMateriaPrima}</b>
                </div>
            </div>
            <div style={{ width: '10%' }}>
                <CustomButton onClick={onRemove}>
                    <FontAwesomeIcon icon={faTrash} />
                </CustomButton>
            </div>
        </div>
    );
}