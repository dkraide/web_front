import React from "react";
import styles from "./styles.module.scss";

export default function UnderConstruction() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>🚧</div>
        <h1>Página em Construção</h1>
        <p>Estamos trabalhando duro para deixar tudo pronto. Volte em breve!</p>
        <span className={styles.badge}>🔧 Em manutenção</span>
      </div>
    </div>
  );
}
