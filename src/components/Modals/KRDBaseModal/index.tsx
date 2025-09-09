"use client";

import { ReactNode, HTMLAttributes, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.scss";

export interface BaseModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  title?: string;
  setClose: (res?: any) => void;
  width?: number;   // 10 a 100 (%)
  height?: number;  // 10 a 100 (%)
  headerOff?: boolean;
  children: ReactNode;
}

export default function KRDBaseModal({
  isOpen,
  title,
  setClose,
  width = 50,
  height = 50,
  headerOff = false,
  children,
  ...props
}: BaseModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={() => setClose(undefined)} // clicar fora fecha
    >
      <div
        className={styles.modal}
        style={{ width: `${width}%`, height: `${height}%` }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {!headerOff && (
          <div className={styles.header}>
            <h2>{title}</h2>
            <button onClick={() => setClose(undefined)}>✕</button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
