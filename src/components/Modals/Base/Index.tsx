import { HTMLAttributes, ReactNode, } from "react";
import styles from './styles.module.scss';
import { AiOutlineClose } from "react-icons/ai";
import { Modal } from "react-bootstrap";

export interface baseModalProps extends HTMLAttributes<HTMLDivElement> {
    isOpen: boolean
    title?: string
    setClose: () => void
    width?: string
    height?: string
    color?: string
    background?: string
    headerOff?: boolean
}
export default function BaseModal({headerOff, background, color, height, width, title, isOpen, children, setClose, ...rest }: baseModalProps) {
    if (!isOpen) {
        return <></>
    }
    // return (
    //     <div className={styles.container}  onClick={(e) => {
    //         // if (e.target == e.currentTarget) {
    //         //     setClose();
    //         // }
    //     }}>
    //         <div className={styles.content} style={{height: height, width: width, background: background, backgroundColor: color}}> 
    //             <div hidden={headerOff} className={styles.header}>
    //                 <h3>{title || 'Janela'}</h3>
    //                 <AiOutlineClose  className={styles.icon} onClick={() => {setClose()}}/>
    //             </div>
    //             {children}
    //         </div>
    //     </div>
    // )
    return(
        <Modal
        size="xl"
        show={isOpen}
        onHide={() => setClose()}
        dialogClassName="modal-90w modal-90h"
        aria-labelledby="example-custom-modal-styling-title"
        scrollable={true}
        centered
        
      >
        <Modal.Header closeButton hidden={headerOff} style={{
          backgroundColor: 'var(--gray-100)'
        }}>
          <Modal.Title id="example-custom-modal-styling-title" >
           {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
          backgroundColor: 'var(--gray-100)'
        }}> 
        {children}
        </Modal.Body>
      </Modal>
    )
}