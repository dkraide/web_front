import React from 'react';
import styles from './styles.module.scss';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  labelOn?: string;
  labelOff?: string;
}

const KRDToggleSwitch = ({
  isOn,
  onToggle,
  labelOn = 'On',
  labelOff = 'Off',
}: ToggleSwitchProps) => {
  return (
    <div className={styles.wrapper}>
      <span className={`${styles.sideLabel} ${!isOn ? styles.active : ''}`}>
        {labelOff}
      </span>

      <div
        className={`${styles.switch} ${isOn ? styles.on : styles.off}`}
        onClick={onToggle}
      >
        <div className={styles.thumb} />
      </div>

      <span className={`${styles.sideLabel} ${isOn ? styles.active : ''}`}>
        {labelOn}
      </span>
    </div>
  );
};

export default KRDToggleSwitch;
