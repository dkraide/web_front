import { HtmlHTMLAttributes, forwardRef, useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';
import _ from 'lodash';
import Select, { SelectInstance } from 'react-select';

interface selectProps extends HtmlHTMLAttributes<HTMLDivElement> {
    width?: string
    datas: dataProps[]
    selected?: string
    title?: string
    error?: string
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
    const {datas, selected, title, width, id, setSelected, onKeyDown, error} = props;
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
        })
    }} 
    noOptionsMessage={(v) => <label>Nenhum item Encontrado</label>} 
    options={datas} 
    onChange={(e) => {setSelected(e.value);
    }}
     />
    </div>
  });
export function SelectBase({error, id, maxTitleSize, width, datas, selected, title, setSelected, ...rest }: selectProps) {
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
    return <div style={{width: width || '100%', minWidth: '150px'}}>
        <label style={{color: error ? '#df2222' : ''}} className={styles.title}>{title} {error ? '-' : ''} {error ?? ''}</label>
         <Select
        id={id}
        value={getSelected()}
        placeholder={`${title}:`}
        theme={(theme) => ({
            ...theme,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: error ? '#df2222' : 'transparent',
            colors: {
              ...theme.colors,
              primary: 'var(--main)'
            },
          })}
        styles={{
    }} 
    noOptionsMessage={(v) => <label>Nenhum item Encontrado</label>} 
    options={datas} 
    onChange={(e) => {setSelected(e.value);
    
    }} />
    </div>
} 
 