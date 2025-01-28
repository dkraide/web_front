import styles from './styles.module.scss';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import React from 'react';
import { useState, useEffect } from "react";
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons';


export default function Home() {
  const palavras = ["Estabilidade", "Liberdade", "Controle","Gerenciamento","Planejamento","Otimização","Inovação","Gestão","Autonomia","Segurança"]; // Lista de palavras
  const [indice, setIndice] = useState(0); // Estado para controlar a palavra atual

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((prevIndice) => (prevIndice + 1) % palavras.length); // Troca a palavra
    }, 2000); // Troca a cada 2 segundos

    return () => clearInterval(intervalo); // Limpa o intervalo ao desmontar
  }, [palavras.length]);

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
        <nav className={styles.navbar}>
          <ul className={styles.nav_list}>
            {!isMobile && (
              <>
                <li className={styles.nav_item}>
                  <a href="#home" className={styles.nav_link}>
                    Início
                  </a>
                </li>
                <li className={styles.nav_item}>
                  <a href="#benefits" className={styles.nav_link}>
                    Benefícios
                  </a>
                </li>
                <li className={styles.nav_item}>
                  <a href="#contact" className={styles.nav_link}>
                    Contato
                  </a>
                </li>
              </>
            )}
            <li className={styles.nav_item}>
              <a
                href="https://wa.me/5519971037836?text=Gostaria%20de%20saber%20mais%20sobre%20a%20KRD!"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.nav_Experiment}
              >
                Experimente agora!
              </a>
            </li>
          </ul>
        </nav>
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
      <section id="home" className={styles.sectionHome}>
        <p>A KRD System vem se tornando um dos melhores sistemas com a ajuda de nossos clientes. Ouvimos cada dica e sugestão para construir o melhor para o seu negócio, atualizando o sistema todos os dias, com telas e ferramentas novas, conforme a necessidade de cada estabelecimento. Podemos dizer com tranquilidade que quem escolhe uma vez não troca nunca mais.</p>
        <h2>Com a KRD você tem mais</h2>
        <h2 className={styles.mudarPalavra}>{palavras[indice]}</h2>
        <div className={styles.videoContainer}>
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/m3_vaq4iBJ0"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      </section>
      <section id="benefits" className={styles.sectionBenefits}>
        <div className={styles.slide}>
          <div className={styles.pagina}>
            <h3 className={styles.infoBar}>Telas eficientes</h3>
            <div className={styles.texto}>
              <div className={styles.linha}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Telas simples e modernas.</p>
              </div>
              <div className={styles.linha}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Faça vendas e cadastros de produtos de forma rápida e eficiente!</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Passe vendas de forma dinâmica e ágil!</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Organização visual que simplifica sua rotina.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Navegação intuitiva e fácil de usar.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Otimize tarefas diárias com ferramentas rápidas.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Conecte diferentes módulos de forma ágil.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Facilidade de automatizar e cadastrar promoções!</p>
              </div>
              
            </div>
          </div>
          <div className={styles.pagina}>
          <h3 className={styles.infoBar}>Integração com a nuvem</h3>
            <div className={styles.texto}>
              <div className={styles.linha}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Cadastre produtos, promoções e gerencie sua loja de qualquer lugar!</p>
              </div>
              <div className={styles.linha}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>A KRD possui sites e aplicativos para você sempre conseguir acompanhar seu negócio.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Controle estoque, pedidos e promoções de forma fácil e rápida.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Tenha acesso a relatórios completos e ferramentas para otimizar sua gestão.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Reduza custos e aumente a eficiência com soluções integradas.</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Deixe a administração do seu negócio na palma da sua mão.</p>
              </div>        
            </div>
          </div>
          <div className={styles.pagina}>
          <h3 className={styles.infoBar}>Outros benefícios</h3>
            <div className={styles.texto}>
              <div className={styles.linha}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Configuramos impressoras, SAT, balança, etc;</p>
              </div>
              <div className={styles.linha}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Suporte 24 horas 7 dias por semana;</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Controle de Estoque;</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Fluxo de Caixa;</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Dezenas de relatórios diferentes;</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Emissão de CF-e, NFC-e e NF-e;</p>
              </div>
              <div className={styles.linha}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <p>Instalamos e treinamos gratuitamente. Além disso você terá um mês para usar o sistema completo.
Ou seja, Você só paga se realmente gostar dos nossos serviços!</p>
              </div>        
            </div>
          </div>
        </div>
      </section>
      <section id="contact" className={styles.sectionContact}>
        <div className={styles.buttons}>
        <h2>Venha testar gratuitamente ou tirar dúvidas!</h2>
          <a
            href="https://wa.me/5519971037836?text=Gostaria%20de%20saber%20mais%20sobre%20a%20KRD!"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
          >
          <FontAwesomeIcon icon={faWhatsapp} />
          </a>
          <a
            href="https://instagram.com/krdsystem"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instagramButton}
          >
          <FontAwesomeIcon icon={faInstagram} />
          </a>
        </div>
      </section>
    </div>
  );
}
