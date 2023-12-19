import { Spinner } from 'react-bootstrap'
import BaseModal from '../Base/Index'
import styles from './styles.module.scss'

type loadProps = {
    isOpen: boolean
    setClose: () => void
}
export default function LoadingModal({isOpen, setClose}: loadProps){

    return(
        <BaseModal autoFocus={false} isOpen={isOpen} setClose={setClose} headerOff={true} title={''} width={'20%'} height={'20%'}>
            <div className={styles.container}>
                <Spinner color={'black'}  style={{width: '120px', height: '120px'}}/>
            </div>
        </BaseModal>
    )

}