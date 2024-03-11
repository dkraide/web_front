import styles from './styles.module.scss';
import { InputHTMLAttributes,  forwardRef } from 'react';
import React from "react";
import InputMask from 'react-input-mask';

interface inputProps extends InputHTMLAttributes<HTMLInputElement> {
    title: string
    width?: string
    minWidth?: string
    invalid?: boolean
    error?: string
}

const InputGroup = ({title, width, minWidth, invalid, error, name,...rest }: inputProps) => {
    return (
        <div className={styles["group"]} style={{width: width || '100%', minWidth: minWidth || 'auto'}}>
            <span className={error ? styles["error"] : styles['']}>{error}</span>
            <input  type="text"  {...rest}  name={name}/>
            <span className={styles["bar"]}></span>
            <label>{title}</label>
        </div>
    )
}

interface inputForm extends InputHTMLAttributes<HTMLInputElement>{
    title?: string
    width?: string
    minWidth?: string
    invalid?: boolean
    errors?: any
    register?: any,
    inputName: string,
    rules?: any

}
const InputForm = ({rules, title, width,minWidth, inputName, register, errors,onChange,  ...rest } : inputForm) => {
    return (
        <div className={styles["group"]} style={{width: width || '100%', minWidth: minWidth || 'auto'}}>
        <span className={errors[inputName] ? styles["error"] : styles['']}>{errors[inputName] && 'campo invalido'}</span>
        <input {...register(inputName, {...rules, onChange: onChange})} {...rest} />
        <span className={styles["bar"]}></span>
        <label>{title}</label>
        </div>
    );
};


interface inputFormMask extends InputHTMLAttributes<HTMLInputElement>{
    title: string
    width?: string
    minWidth?: string
    invalid?: boolean
    errors?: any
    register?: any,
    inputName: string,
    rules?: any,
    mask: string

}
const InputFormMask = ({mask, rules, title, width,minWidth, inputName, register, errors, ...rest } : inputFormMask) => {
    return (
        <div className={styles["group"]} style={{width: width || '100%', minWidth: minWidth || 'auto'}}>
        <span className={errors[inputName] ? styles["error"] : styles['']}>{errors[inputName] && 'campo invalido'}</span>
        <InputMask {...register(inputName, rules)} {...rest} mask={mask} />
        <span className={styles["bar"]}></span>
        <label>{title}</label>
        </div>
    );
};


  const InputGroupRef = forwardRef<HTMLInputElement, inputProps>(function MyInput(props, ref) {
    const { title, width, minWidth, invalid, error, name,...rest  } = props;
    return (
        <div className={styles["group"]} style={{width: width || '100%', minWidth: minWidth || 'auto'}}>
            <span className={error ? styles["error"] : styles['']}>{error}</span>
            <input ref={ref}  type="text"   name={name}/>
            <span className={styles["bar"]}></span>
            <label>{title}</label>
        </div>
    )
  });
  
export {InputForm, InputGroup, InputGroupRef, InputFormMask};


