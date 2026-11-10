import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';

export interface MultiSelectOption {
    value: string
    label: string
}

interface Props {
    title: string
    options: MultiSelectOption[]
    selected: string[]
    onChange: (selected: string[]) => void
}

/** Dropdown com checkboxes para escolher varios valores. */
export default function MultiSelect({ title, options, selected, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const toggle = (v: string) =>
        onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

    const resumo = selected.length === 0
        ? 'Nenhuma'
        : selected.length === options.length
            ? 'Todas'
            : selected.length <= 2
                ? options.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                : `${selected.length} selecionadas`;

    return (
        <div className={styles.wrap} ref={ref}>
            <span className={styles.title}>{title}</span>
            <button type="button" className={styles.button} onClick={() => setOpen(!open)}>
                {resumo} <span className={styles.caret}>▾</span>
            </button>
            {open && (
                <div className={styles.menu}>
                    <div className={styles.actions}>
                        <a onClick={() => onChange(options.map(o => o.value))}>Todas</a>
                        <a onClick={() => onChange([])}>Limpar</a>
                    </div>
                    {options.map(o => (
                        <label key={o.value} className={styles.option}>
                            <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
                            {o.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
