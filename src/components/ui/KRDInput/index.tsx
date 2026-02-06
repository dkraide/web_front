import InputMask from 'react-input-mask';
import { Controller } from 'react-hook-form';
import { isMobile } from 'react-device-detect';

type Props = {
  label: string;
  control: any;
  name: string;
  type?: string;
  disabled?: boolean;
  width?: string;
  mask?: string;
  error?: string;
  isCurrency?: boolean;
  placeholder?: string;
};

export default function KRDInput({
  label,
  control,
  name,
  type = 'text',
  disabled,
  width = '100%',
  mask,
  error,
  isCurrency = false,
  placeholder,
}: Props) {
  const inputStyle = {
    padding: '6px 8px',
    borderRadius: 6,
    border: error ? '1px solid #dc3545' : '1px solid #ccc',
    width: '100%',
    fontSize: 14,
  };

  const isNumber = type === 'number';

  // Função para formatar valor numérico como moeda
  const formatCurrency = (numericValue: number) => {
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para converter string de moeda em número
  const parseCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue ? parseFloat(numericValue) / 100 : 0;
  };

  return (
     <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width, minWidth: isMobile ? '50%' : '' }}>
      <label style={{ fontSize: 13 }}>{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value, ...field } }) => {
          if (isCurrency) {
            // Garante que o value sempre seja número
            const displayValue = typeof value === 'number' && value > 0 
              ? formatCurrency(value) 
              : '';

            return (
              <input
                {...field}
                type="text"
                value={displayValue}
                onChange={(e) => {
                  const numericValue = parseCurrency(e.target.value);
                  onChange(numericValue);
                }}
                disabled={disabled}
                style={inputStyle}
                placeholder="R$ 0,00"
              />
            );
          }

          if (mask) {
            return (
              <InputMask
                {...field}
                value={value || ''}
                onChange={onChange}
                mask={mask}
                disabled={disabled}
              >
                {(inputProps: any) => (
                  <input
                    {...inputProps}
                    type={type}
                    style={inputStyle}
                  />
                )}
              </InputMask>
            );
          }

          return (
            <input
              {...field}
              value={value ?? ''}
              onChange={(e) => {
                const newValue = isNumber ? e.target.valueAsNumber : e.target.value;
                onChange(newValue);
              }}
              placeholder={placeholder}
              type={type}
              disabled={disabled}
              style={inputStyle}
            />
          );
        }}
      />
      {error && (
        <span style={{ fontSize: 11, color: '#dc3545' }}>
          {error}
        </span>
      )}
    </div>
  );
}