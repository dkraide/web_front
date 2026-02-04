import { HTMLAttributes, useEffect, useRef } from "react";
import styles from "./styles.module.scss";

export interface baseModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  title?: string;
  setClose: () => void;
  width?: string;
  height?: string;
  color?: string;
  background?: string;
  headerOff?: boolean;
}

export default function BaseModal({
  headerOff,
  background,
  color,
  height,
  width,
  title,
  isOpen,
  children,
  setClose,
  ...rest
}: baseModalProps) {

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [setClose]);

  // Fechar clicando fora
  const handleClickOutside = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseDown={handleClickOutside}>
      <div
        className={styles.container}
        style={{
          width: width || "80%",
          height: height || "80vh",
          background: background || "white",
          color: color || "inherit",
        }}
        ref={modalRef}
        {...rest}
      >
        {!headerOff && (
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button className={styles.closeBtn} onClick={setClose}>✕</button>
          </div>
        )}

        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
