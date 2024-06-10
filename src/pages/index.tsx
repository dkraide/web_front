import styles from '../styles/home.module.scss';
import { FormEvent, useContext, useState } from 'react';
import { canSSRGuest } from '../utils/CanSSRGuest';
import Image from 'next/image';
import { useWindowSize } from 'rooks';
import CustomButton from '@/components/ui/Buttons';
import { title } from 'process';

export default function Home() {

  const { innerWidth } = useWindowSize();
  const isMobile = innerWidth < 600;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={"container-scroller"}>
      <nav className={[styles["navbar"], styles["default-layout-navbar"], styles["col-lg-12"], styles["p-0"], styles["fixed-top"], styles["d-flex"], styles["flex-row"]].join(' ')}>
        <Image src={'/krd_logo.png'} alt={'krd'} width={180} height={70} />
        <CustomButton style={{ marginRight: 10 }} typeButton={'main'} onClick={() => {
          window.location.href = '/login'
        }}>Área Cliente</CustomButton>
      </nav>
      <div className={[styles["container-fluid"], styles["page-body-wrapper"]].join(' ')}>
        <div className={styles['main-panel']}>
          <div className={styles.principal}>
            <div style={{ width: '100%', marginBottom: '20px' }}>
              <label className={styles.title}>O sistema mais <b>SIMPLES</b> e <b>COMPLETO</b> para o seu negócio!</label>
            </div>
            <div className={[styles.video].join(' ')}>
              <iframe width="100%" height="100%" src="https://www.youtube.com/embed/m3_vaq4iBJ0?si=1gZRmUD614npJ6nr" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            </div>
            <div className={styles.prices}>
              <div className={styles.card100}>
                <div className={styles['card-title']}>
                  Por que escolher a KRD System para seu negócio ?
                </div>
                <div className={styles['card-body']}>
                  A KRD System vem se tornando um dos melhores sistemas com a ajuda de nossos clientes. Ouvimos cada dica e sugestão para construir o melhor para o seu negócio, atualizando o sistema todos os dias, com telas e ferramentas novas, conforme a necessidade de cada estabelecimento.
                  Podemos dizer com tranquilidade que quem escolhe uma vez não troca nunca mais.
                  <hr />
                  Chame a gente através de nosso <a href="https://api.whatsapp.com/send?phone=5519971037836">WhatsApp</a> ou <a href={'https://www.instagram.com/krdsystem'}>Instagram</a> e tiraremos todas as suas dúvidas.
                  Não perca tempo, venha ser KRD System!
                </div>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles['card-title']}>
                Telas eficientes
              </div>
              <div className={styles['card-body']}>
                Com telas simples e modernas, você consegue passar vendas e realizar cadastros como
                de produtos de forma rápida e eficiente, ganhando tempo ao efetuar vendas, evitando filas e transtornos.
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles['card-title']}>
                Integração com a nuvem
              </div>
              <div className={styles['card-body']}>
                Cadastre produtos, promoções e gerencie sua loja de qualquer lugar.<br />
                A KRDSystem possui site e aplicativo, para você acompanhar seu negócio sem precisar estar lá!
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles['card-title']}>
                Pague apenas se gostar!
              </div>
              <div className={styles['card-body']}>
                Instalamos e treinamos gratuitamente. Além disso você terá um mês para usar o sistema completo. <br />
                Ou seja, Você só paga se realmente gostar dos nossos serviços!
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles['card-title']}>
                Outros benefícios
              </div>
              <div className={styles['card-body']}>
                • Configuramos impressoras, SAT, balança, etc;<br />
                • Suporte 24 horas 7 dias por semana;<br />
                • Controle de Estoque;<br />
                • Fluxo de Caixa;<br />
                • Dezenas de relatórios diferentes;<br />
                • Emissão de CF-e, NFC-e e NF-e;<br />
                • Muito mais!<br />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
  return (
    <div className={[styles.container, 'container-scroller'].join(' ')}>
      <nav className={styles.navbar}>
        <Image src={'/krd_logo.png'} alt={'krd'} width={180} height={70} />
        <CustomButton style={{ marginRight: 10 }} typeButton={'main'} onClick={() => {
          window.location.href = '/login'
        }}>Área Cliente</CustomButton>
      </nav>
      <div className={styles.principal}>
        <div style={{ width: '100%' }}>
          <label className={styles.title}>O sistema mais <b>SIMPLES</b> e <b>COMPLETO</b> para o seu negócio!</label>
        </div>
        <div className={styles.card}>
          <div className={styles['card-title']}>
            Telas eficientes
          </div>
          <div className={styles['card-body']}>
            Com telas simples e modernas, você consegue passar vendas e realizar cadastros como
            de produtos de forma rápida e eficiente, ganhando tempo ao efetuar vendas, evitando filas e transtornos.
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles['card-title']}>
            Integração com a nuvem
          </div>
          <div className={styles['card-body']}>
            Cadastre produtos, promoções e gerencie sua loja de qualquer lugar.<br />
            A KRDSystem possui site e aplicativo, para você acompanhar seu negócio sem precisar estar lá!
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles['card-title']}>
            Pague apenas se gostar!
          </div>
          <div className={styles['card-body']}>
            Instalamos e treinamos gratuitamente. Além disso você terá um mês para usar o sistema completo. <br />
            Ou seja, Você só paga se realmente gostar dos nossos serviços!
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles['card-title']}>
            Outros benefícios
          </div>
          <div className={styles['card-body']}>
            • Configuramos impressoras, SAT, balança, etc;<br />
            • Suporte 24 horas 7 dias por semana;<br />
            • Controle de Estoque;<br />
            • Fluxo de Caixa;<br />
            • Dezenas de relatórios diferentes;<br />
            • Emissão de CF-e, NFC-e e NF-e;<br />
            • Muito mais!<br />
          </div>
        </div>
      </div>


    </div>
  )
}
export const getServerSideProps = canSSRGuest(async (ctx) => {
  return {
    props: {}
  }
})