import styles from './styles.module.scss';
import { InputHTMLAttributes, forwardRef, useEffect, useState } from 'react';
import React from "react";
import { isMobile } from 'react-device-detect';
import InputMask from 'react-input-mask';



interface inputProps extends InputHTMLAttributes<HTMLInputElement> {
    title: string
    width?: string
    minWidth?: string
    invalid?: boolean
    error?: string
}

interface InputGroupProps extends InputHTMLAttributes<HTMLInputElement> {
  title: string
  width?: string
  minWidth?: string
  invalid?: boolean
  error?: string
}
 
const InputGroup = ({
  title,
  width,
  minWidth,
  invalid,
  error,
  name,
  ...rest
}: InputGroupProps) => {
  const hasError = invalid || !!error
 
  return (
    <div
      className={styles.group}
      style={{
        width: width || '100%',
        minWidth: isMobile ? '50%' : minWidth || 'auto',
      }}
    >
      <label className={`${styles.label} ${hasError ? styles.labelError : ''}`}>
        {title}
      </label>
      <input
        {...rest}
        name={name}
        className={`${styles.input} ${hasError ? styles.inputError : ''}`}
      />
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  )
}
 

// ── InputForm (react-hook-form) ──────────────────────────
interface InputFormProps extends InputHTMLAttributes<HTMLInputElement> {
  title?: string
  width?: string
  minWidth?: string
  invalid?: boolean
  errors?: any
  register?: any
  inputName: string
  rules?: any
}
 
const InputForm = ({
  rules,
  title,
  width,
  minWidth,
  inputName,
  register,
  errors,
  onChange,
  ...rest
}: InputFormProps) => {
  const hasError = !!errors?.[inputName]
 
  return (
    <div
      className={styles.group}
      style={{
        width: width || '100%',
        minWidth: isMobile ? '50%' : minWidth || 'auto',
      }}
    >
      {title && (
        <label className={`${styles.label} ${hasError ? styles.labelError : ''}`}>
          {title}
        </label>
      )}
      <input
        {...register(inputName, { ...rules, onChange })}
        {...rest}
        className={`${styles.input} ${hasError ? styles.inputError : ''}`}
      />
      {hasError && <span className={styles.errorMsg}>Campo inválido</span>}
    </div>
  )
}
 
// ── InputFormMask (react-hook-form + máscara) ────────────
interface InputFormMaskProps extends InputHTMLAttributes<HTMLInputElement> {
  title: string
  width?: string
  minWidth?: string
  invalid?: boolean
  errors?: any
  register?: any
  inputName: string
  rules?: any
  mask: string
}
 
const InputFormMask = ({
  mask,
  rules,
  title,
  width,
  minWidth,
  inputName,
  register,
  errors,
  ...rest
}: InputFormMaskProps) => {
  const hasError = !!errors?.[inputName]
 
  return (
    <div
      className={styles.group}
      style={{
        width: width || '100%',
        minWidth: isMobile ? '50%' : minWidth || 'auto',
      }}
    >
      {title && (
        <label className={`${styles.label} ${hasError ? styles.labelError : ''}`}>
          {title}
        </label>
      )}
      <InputMask
        {...register(inputName, rules)}
        {...rest}
        mask={mask}
        className={`${styles.input} ${hasError ? styles.inputError : ''}`}
      />
      {hasError && <span className={styles.errorMsg}>Campo inválido</span>}
    </div>
  )
}
 
// ── InputGroupRef (com forwardRef) ───────────────────────
interface InputGroupRefProps extends InputHTMLAttributes<HTMLInputElement> {
  title: string
  width?: string
  minWidth?: string
  invalid?: boolean
  error?: string
}
 
const InputGroupRef = forwardRef<HTMLInputElement, InputGroupRefProps>(
  function InputGroupRef({ title, width, minWidth, invalid, error, name, ...rest }, ref) {
    const hasError = invalid || !!error
 
    return (
      <div
        className={styles.group}
        style={{
          width: width || '100%',
          minWidth: isMobile ? '50%' : minWidth || 'auto',
        }}
      >
        <label className={`${styles.label} ${hasError ? styles.labelError : ''}`}>
          {title}
        </label>
        <input
          {...rest}
          ref={ref}
          name={name}
          className={`${styles.input} ${hasError ? styles.inputError : ''}`}
        />
        {error && <span className={styles.errorMsg}>{error}</span>}
      </div>
    )
  })
export { InputForm, InputGroup, InputGroupRef, InputFormMask };


