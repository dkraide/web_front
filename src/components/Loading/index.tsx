import styles from './styles.module.scss';
import Spinner from 'react-bootstrap/Spinner';

export default function Loading() {
    return (
        <div className={styles.container}>
            <Spinner   animation="border" />
        </div>
    )
}