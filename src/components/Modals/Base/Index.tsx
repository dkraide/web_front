import { HTMLAttributes, ReactNode } from "react";
import { Modal } from "react-bootstrap";

export interface baseModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  title?: string;
  setClose: () => void;
  width?: number;      // 10 a 100, múltiplo de 10
  height?: number;     // 10 a 100, múltiplo de 10
  color?: string;
  background?: string;
  headerOff?: boolean;
  children: ReactNode;
}

export default function BaseModal({
  headerOff,
  background,
  color,
  width = 90,   // padrão 90%
  height = 90,  // padrão 90%
  title,
  isOpen,
  children,
  setClose,
  ...rest
}: baseModalProps) {
  if (!isOpen) return null;

  // garantir que a largura/altura estejam entre 10 e 100
  const clamp = (value: number) => Math.min(100, Math.max(10, Math.round(value / 10) * 10));

  const widthClass = `modal-width-${clamp(width)}`;
  const heightClass = `modal-height-${clamp(height)}`;

  return (
    <Modal
      show={isOpen}
      onHide={setClose}
      centered
      size={'xl'}
      style={{height: '100vh'}}
      scrollable
      {...rest}
    >
      {!headerOff && (
        <Modal.Header
          closeButton
        >
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      )}

      <Modal.Body
        style={{
          backgroundColor: background || "var(--gray-100)",
        }}
      >
        {children}
      </Modal.Body>
    </Modal>
  );
}
