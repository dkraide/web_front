import { HtmlHTMLAttributes, forwardRef, useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';
import { BiChevronDown } from 'react-icons/bi';
import { AiOutlineSearch } from 'react-icons/ai';
import _ from 'lodash';
import Select, { SelectInstance } from 'react-select';

interface selectProps extends HtmlHTMLAttributes<HTMLDivElement> {
    width?: string
    datas: dataProps[]
    selected?: string
    title?: string
    maxTitleSize?: number
    setSelected: (value: any) => void
    ref?: any
    onKeyDown?: (e) => void
}

interface dataProps {
    value: any
    label: string
}
export  const  SelectBaseRef = forwardRef<SelectInstance<dataProps>, selectProps>(function MyInput(props, ref) {
    const {datas, selected, title, width, id, setSelected, onKeyDown} = props;
    if (!datas) {
        return <></>
    }
    function getSelected(){
        var i = _.findIndex(datas, p => p.value == selected);
        if(i >= 0){
            return datas[i];
        }
        return undefined;

    }
    return <div style={{width: width || '100%', margin: '8px 0px'}}>
         <Select
        onKeyDown={onKeyDown}
        id={id}
        ref={ref}
        value={getSelected()}
        placeholder={`${title}:`}
        styles={{
        control: (base) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: 'black',
        })
    }} 
    noOptionsMessage={(v) => <label>Nenhum item Encontrado</label>} 
    options={datas} 
    onChange={(e) => {setSelected(e.value);
    }} />
    </div>
  });
export function SelectBase({id, maxTitleSize, width, datas, selected, title, setSelected, ...rest }: selectProps) {
    if (!datas) {
        return <></>
    }
    function getSelected(){
        var i = _.findIndex(datas, p => p.value == selected);
        if(i >= 0){
            return datas[i];
        }
        return undefined;

    }
    return <div style={{width: width || '100%'}}>
        <label className={styles.title}>{title}</label>
         <Select
        id={id}
        value={getSelected()}
        placeholder={`${title}:`}
        theme={(theme) => ({
            ...theme,
            borderRadius: 0,
            borderColor: 'transparent',
            colors: {
              ...theme.colors,
            },
          })}
        styles={{
        control: (base) => ({
            ...base,
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderRadius: '0',
            borderColor: 'var(--main)',
            top: '-8px',
            padding: '0px !important',
            margin: '0',
        }),
        
    }} 
    noOptionsMessage={(v) => <label>Nenhum item Encontrado</label>} 
    options={datas} 
    onChange={(e) => {setSelected(e.value);
    
    }} />
    </div>
}
