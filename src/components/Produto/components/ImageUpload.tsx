import { isMobile } from 'react-device-detect';

interface ImageUploadProps {
    currentImage?: string;
    imagePreview?: string | null;
    onImageChange: (file: File) => void;
}

export default function ImageUpload({ currentImage, imagePreview, onImageChange }: ImageUploadProps) {
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onImageChange(file);
    };

    return (
        <>
            <input
                type="file"
                accept="image/*"
                hidden
                id="imageInput"
                onChange={handleImageChange}
            />

            <div
                style={{
                    width: isMobile ? '100%' : '25%',
                    cursor: 'pointer',
                    display: 'flex',
                }}
                onClick={() => document.getElementById('imageInput')?.click()}
            >
                <img
                    src={imagePreview ?? currentImage ?? '/comida.png'}
                    onError={(e) => {
                        e.currentTarget.src = '/comida.png';
                    }}
                    style={{
                        margin: '0px auto',
                        width: '90%',
                        height: 250,
                        objectFit: 'fill',
                        borderRadius: 8,
                    }}
                    alt="Imagem do produto"
                />
            </div>
        </>
    );
}