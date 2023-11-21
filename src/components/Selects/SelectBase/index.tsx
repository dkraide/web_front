import { HtmlHTMLAttributes, useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';
import { BiChevronDown } from 'react-icons/bi';
import { AiOutlineSearch } from 'react-icons/ai';
import _ from 'lodash';

interface selectProps extends HtmlHTMLAttributes<HTMLDivElement> {
    width?: string
    datas: dataProps[]
    selected?: any
    title?: string
    maxTitleSize?: number
    setSelected: (value: any) => void
}

interface dataProps {
    value: any
    text: string
}
export function SelectBase({ maxTitleSize, width, datas, selected, title, setSelected, ...rest }: selectProps) {
    const [inputValue, setInputValue] = useState("");
    const [open, setOpen] = useState(false);
    const [text, setText] = useState<string>();
    const [filtered, setFiltered] = useState(datas);
    const searchRef = useRef<HTMLInputElement>(null);

    if (!datas) {
        return <></>
    }

    useEffect(() => {
        if (inputValue === "") {
            setFiltered(datas);
        } else {
            var f = _.filter(datas, p => p.text.toLowerCase().includes(inputValue.toLowerCase()))
            setFiltered(f);
        }
    }, [inputValue, datas]);

    useEffect(() => {
          if(open){
            searchRef.current?.focus();
          }
    }, [open]);

    function getStringMax(value: string) {
        if (!value || !maxTitleSize) {
            return value;
        }
        return value.length > maxTitleSize ? value.substring(0, maxTitleSize) : value;
    }
    return <div style={{ height: open ? 'auto' : '40px', width: width || '100%' }} className={styles.header} >
        <div className={styles.title}
            onClick={() => { setOpen(!open) }}>
            <label className={styles.titleLabel}> {getStringMax(title) || 'Item'}: {text ? getStringMax(text) : 'Selecione...'}</label>
            <div className={open ? styles.activeIcon : null}>
                <BiChevronDown size={20} />
            </div>
        </div>
        <ul className={styles.content} style={{ display: open ? 'block' : 'none' }}>
            <div className={styles.boxSearch}>
                <AiOutlineSearch className={styles.icon} />
                <input
                    ref={searchRef}
                    className={styles.inputSearch}
                    type="text"
                    placeholder={"Pesquisar"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            setSelected(filtered[0].value);
                            setOpen(false);
                        }
                    }}
                />
            </div>
            {
                filtered.map(data => {
                    if (data.value == selected && (!text || text !== data.text)) {
                        setText(data.text);
                    }
                    return <li
                        className={styles.value}
                        key={data.value}
                        onClick={() => {
                            setSelected(data.value);
                            setOpen(false);
                        }}
                    >{data.text}</li>
                })
            }
        </ul>
    </div>
}
