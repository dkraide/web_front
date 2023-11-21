import styles from './styles.module.scss';
type props ={
    url: string
    size: string
    height?: string
    width?: string
    onClick?: () => void
}
export default function PictureBox({height, width, onClick, url, size}: props){
   return(
    <div onClick={onClick} style={{width: width || size, height: height || size}} className={styles.box}>
        <img className={styles.img} src={url} onError={(e) => {e.currentTarget.src = '/FecharCancelar.png'}} height={height || size} width={width  || size}  alt={'imagem'}></img>
    </div>
   )
}