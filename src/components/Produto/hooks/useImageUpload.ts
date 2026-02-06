
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { api } from '@/services/apiClient';

export function useImageUpload() {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [hasNewImage, setHasNewImage] = useState(false);

    useEffect(() => {
        // Cleanup do preview quando componente desmontar
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (file: File) => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setHasNewImage(true);
    };

    const uploadImagemAsync = async (produtoId: number): Promise<string | null> => {
        if (!imageFile || !hasNewImage) {
            return null;
        }

        try {
            const formData = new FormData();
            formData.append('file', imageFile);

            const { data } = await api.post(`/Produto/${produtoId}/uploadImagem`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Imagem enviada com sucesso!');
            setHasNewImage(false); // Marca que a imagem foi enviada
            return data.localPath;
        } catch (err) {
            const error = err as AxiosError;
            toast.error(`Erro ao enviar imagem: ${error.message}`);
            return null;
        }
    };

    const resetImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setImageFile(null);
        setHasNewImage(false);
    };

    return {
        imagePreview,
        imageFile,
        hasNewImage,
        handleImageChange,
        uploadImagemAsync,
        resetImage,
    };
}