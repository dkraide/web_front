import { Spinner } from 'react-bootstrap'
import BaseModal from '../Base/Index'
import styles from './styles.module.scss'

type loadProps = {
    isOpen: boolean
    setClose: () => void
    title?: string
}
export default function LoadingModal({ title, isOpen, setClose }: loadProps) {

    return (
        <BaseModal autoFocus={false} isOpen={isOpen} setClose={setClose} headerOff={true} title={''} width={'100%'} height={'20%'}>
            <div className={styles.container}>
                <div><Spinner style={{ width: '100px', height: '100px' }} size={'sm'} /></div>
                <b style={{ height: '50px', width: '100%', textAlign: 'center' }}>{title || 'Carregando...'}</b>
            </div>
        </BaseModal>
    )

}