import { ReactNode, useState, useRef, useEffect } from 'react';
import styles from './styles.module.scss';

interface Props {
    color?: string;
    width?: string;
    title?: string;
    children: ReactNode;
    openned?: boolean;
    index?: number;
}

export default function CollapsedDiv({ title, color, width, children, openned }: Props) {
    const [isOpen, setIsOpen] = useState(openned ?? false);
    const [height, setHeight] = useState('0px');
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && contentRef.current) {
            setHeight(`${contentRef.current.scrollHeight}px`);
        } else {
            setHeight('0px');
        }
    }, [isOpen, children]);

    return (
        <div className={styles['expandible-card']} style={{ width, backgroundColor: color }}>
            <div
                className={styles['expandible-card__header']}
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3>{title}</h3>
                <span
                    className={`${styles['expandible-card__icon']} ${isOpen ? styles.open : ''
                        }`}
                >
                    ▼
                </span>
            </div>

            <div
                ref={contentRef}
                className={`${styles['expandible-card__content']} ${isOpen ? styles['expandible-card__content_open'] : ''}`}
                style={{ maxHeight: height }}
            >
                <div className={styles['expandible-card__inner']}>{children}</div>
            </div>
        </div>
    );
}
