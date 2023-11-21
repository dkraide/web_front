import { HTMLAttributes, ReactNode, } from "react";
import styles from './styles.module.scss';
import { AiOutlineClose } from "react-icons/ai";

export interface baseModalProps extends HTMLAttributes<HTMLDivElement> {
    isOpen: boolean
    title?: string
    setClose: () => void
    width?: string
    height?: string
    color?: string
}
export default function BaseModal({color, height, width, title, isOpen, children, setClose, ...rest }: baseModalProps) {
    if (!isOpen) {
        return <></>
    }
    return (
        <div className={styles.container}  onClick={(e) => {
            // if (e.target == e.currentTarget) {
            //     setClose();
            // }
        }}>
            <div className={styles.content} style={{height: height, width: width, backgroundColor: color}}> 
                <div className={styles.header}>
                    <h3>{title || 'Janela'}</h3>
                    <AiOutlineClose  className={styles.icon} onClick={() => {setClose()}}/>
                </div>
                {children}
            </div>
        </div>
    )
}