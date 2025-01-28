import styles from './styles.module.scss';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import React from 'react';
import { useState, useEffect } from "react";
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faComputer, faCloud, faStar,faCalendarAlt , faUsers, faThumbsUp , faPlay} from "@fortawesome/free-solid-svg-icons"; // Ícone específico



export default function Home() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
    const benefits = [
        {
          title: "Telas Eficientes",
          description:
            "Interface moderna e intuitiva para vendas e cadastros rápidos, eliminando filas e transtornos.",
          icon: <FontAwesomeIcon icon={faComputer} />,
        },
        {
          title: "Integração com a Nuvem",
          description:
            "Gerencie sua loja de qualquer lugar com nosso site e aplicativo.",
          icon: <FontAwesomeIcon icon={faCloud} />,
        },
        {
          title: "Teste Grátis",
          description:
            "Um mês de sistema completo sem compromisso. Pague apenas se gostar!",
          icon: <FontAwesomeIcon icon={faStar} />,
        },
      ];

      const features = [
        "Configuração de impressoras, SAT e balanças",
        "Suporte 24/7",
        "Controle de Estoque",
        "Fluxo de Caixa",
        "Relatórios Detalhados",
        "Emissão de CF-e, NFC-e e NF-e",
      ];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Define "mobile" como largura <= 768px
    };

    handleResize(); // Chama uma vez para definir o estado inicial
    window.addEventListener('resize', handleResize); // Atualiza quando a janela é redimensionada

    return () => window.removeEventListener('resize', handleResize); // Remove o listener
  }, []);


  return (
    <div className={styles.page}>
      <header className={styles.header}>
      <nav className={styles.nav_bar}>
        <div className={styles.headerContent}>
          <img className={styles.logo} src="/logo.png" alt="logo da empresa" />
          {!isMobile && (
            <div className={styles.text}>
              <h1>KRD</h1>
              <h2>System</h2>
            </div>
          )}
        </div>
        <div>
          <CustomButton
            style={{ marginRight: 10 }}
            typeButton={"main"}
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Área Cliente
          </CustomButton>
        </div>
      </nav>
    </header>

      {/* Seções da página */}
      <div id="home" className={styles.sectionHome}>
        <h1>O sistema mais <span>SIMPLES</span> e <span>COMPLETO</span> para o seu negócio!</h1>
        <p className="subtitle">Transforme sua gestão com tecnologia que funciona</p>
        <a
                href="https://wa.me/5519971037836?text=Gostaria%20de%20saber%20mais%20sobre%20a%20KRD!"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.nav_Experiment}
              >
                Começar agora
              </a>

              <div className={styles.videoContainer}>
              {/* Thumbnail com Botão Play */}
                <div className={styles.thumbnail} onClick={() => setIsVideoOpen(true)}>
                <img src="/thumb.png" alt="Vídeo KRD System" />
                <FontAwesomeIcon icon={faPlay} className={styles.playIcon} />
              </div>

              {/* Modal do Vídeo */}
              {isVideoOpen && (
              <div className={styles.modalOverlay} onClick={() => setIsVideoOpen(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/m3_vaq4iBJ0"
                    title="Vídeo Institucional"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
            </div>
        </div>
    )}
</div>
      </div>

      

      <section id="benefits" className={styles.sectionBenefits}>
      <h2 className={styles.sectionTitle}>Por que escolher a KRD System?</h2>
      <div className={styles.cardsContainer}>
      {benefits.map((benefit, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.icon}>{benefit.icon}</div>
          <h3 className={styles.title}>{benefit.title}</h3>
          <p className={styles.description}>{benefit.description}</p>
        </div>
      ))}
    </div>
      </section>
      <section className={styles.featuresSection}>
      <h2 className={styles.title}>Recursos Exclusivos</h2>
      <div className={styles.featuresGrid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureCard}>
            <FontAwesomeIcon icon={faCheck} className={styles.icon} />
            <p>{feature}</p>
          </div>
        ))}
      </div>
    </section>
    <div className={styles.Faleconosco}>
    <a
      href="https://wa.me/5519971037836?text=Gostaria%20de%20saber%20mais%20sobre%20a%20KRD!"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.contactButton}
    >
      <FontAwesomeIcon icon={faWhatsapp} className={styles.iconwpp} />
      Fale Conosco
    </a>
    </div>

    <section className={styles.longevitySection}>
      <div className={styles.content}>
        <h2>+ de 5 anos de mercado</h2>
        <p>Centenas de clientes satisfeitos confiando na KRD System para transformar seus negócios.</p>
        <div className={styles.icons}>
          <div>
            <FontAwesomeIcon icon={faCalendarAlt} className={styles.icon} />
            <p>Experiência</p>
          </div>
          <div>
            <FontAwesomeIcon icon={faUsers} className={styles.icon} />
            <p>Clientes satisfeitos</p>
          </div>
          <div>
            <FontAwesomeIcon icon={faThumbsUp} className={styles.icon} />
            <p>Confiabilidade</p>
          </div>
        </div>
      </div>
    </section>

    </div>
  );
}
