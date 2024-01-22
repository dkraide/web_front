import { HTMLAttributes} from "react";
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
    return(
        <Modal
        size="xl"
        show={isOpen}
        onHide={() => setClose()}
        dialogClassName="modal-90w"
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
          backgroundColor: 'var(--gray-100)',
          height: height || '100vh'
        }}> 
        {children}
        </Modal.Body>
      </Modal>
    )
}