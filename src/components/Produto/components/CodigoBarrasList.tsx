import { Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import CustomButton from '@/components/ui/Buttons';
import ICodBarras from '@/interfaces/ICodBarras';
import styles from '../styles.module.scss';

interface CodigoBarrasListProps {
    codigos?: ICodBarras[];
    onAdd: (codigo: string) => void;
    onRemove: (index: number) => void;
    register: any;
}

export default function CodigoBarrasList({
    codigos,
    onAdd,
    onRemove,
    register,
}: CodigoBarrasListProps) {
    const handleAdd = () => {
        const input = document.querySelector<HTMLInputElement>('[name="codigoBarras"]');
        if (input?.value) {
            onAdd(input.value);
        }
    };

    return (
        <div style={{ width: '50%', marginBottom: 10 }}>
            <hr />
            <b>Codigos de barras</b>
            <InputGroup className="mb-3">
                <Form.Control
                    placeholder="Codigo de Barras"
                    aria-label="Codigo de Barras"
                    aria-describedby="basic-addon2"
                    {...register('codigoBarras')}
                />
                <CustomButton
                    style={{ zIndex: 0 }}
                    typeButton="dark"
                    id="button-addon2"
                    onClick={handleAdd}
                >
                    Adicionar
                </CustomButton>
            </InputGroup>
            <div className={styles.codigos}>
                {codigos && codigos.length > 0 && codigos.map((c, index) => (
                    <div key={index} className={styles.codigoItem}>
                        <a
                            className="btn btn-danger"
                            onClick={() => onRemove(index)}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </a>
                        <label>{c.codigo}</label>
                    </div>
                ))}
            </div>
        </div>
    );
}