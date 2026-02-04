import styles from './styles.module.scss';
import BaseModal from '../../Base/Index';
import { useContext, useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import { api } from '@/services/apiClient';
import IMerchantOpenDelivery from '@/interfaces/IMerchantOpenDelivery';
import { AuthContext } from '@/contexts/AuthContext';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useForm } from 'react-hook-form';
import ImageUpload from '@/components/ImageUpload';
import KRDInput from '@/components/ui/KRDInput';
import cep from 'cep-promise';
import { Button } from 'react-bootstrap';
import { zodResolver } from '@hookform/resolvers/zod';
import { merchantSchema } from '@/schemas/MerchantSchema';
import z from 'zod';


type props = {
    setClose: (value?: boolean) => void;
}
export type MerchantFormData = z.infer<typeof merchantSchema>;


export default function EditMerchantForm({ setClose }: props) {
    const [merchant, setMerchant] = useState<IMerchantOpenDelivery | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { getUser } = useContext(AuthContext);

    const loadData = async () => {
        if (!loading) {
            setLoading(true);
        }
        const user = await getUser();
        await api.get(`/opendelivery/merchant?empresaId=${user.empresaSelecionada}`).then(response => {
            setMerchant(response.data);
        }).catch(error => {
            console.log(error);
        });
        setLoading(false);

    }
    const maskCep = (value?: string) =>
        value
            ? value.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')
            : '';

    const maskCnpj = (value?: string) =>
        value
            ? value
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
            : '';

    const maskWhatsapp = (value?: string) =>
        value
            ? value
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
            : '';

    useEffect(() => {
        if (merchant) {
            setValue('document', maskCnpj(merchant.document));
            setValue('name', merchant.name);
            setValue('corporateName', merchant.corporateName);
            setValue('description', merchant.description);
            setValue('commercialPhone', merchant.commercialPhone);
            setValue('whatsappNumber', maskWhatsapp(merchant.whatsappNumber));
            setValue('contactEmails', merchant.contactEmails);
            setValue('averageTicket', merchant.averageTicket);
            setValue('averagePreparationTime', merchant.averagePreparationTime);
            setValue('minOrderValue', merchant.minOrderValue);
            setValue('postalCode', maskCep(merchant.postalCode));
            setValue('street', merchant.street);
            setValue('number', merchant.number);
            setValue('district', merchant.district);
            setValue('city', merchant.city);
            setValue('state', merchant.state);
            setValue('complement', merchant.complement);
            setValue('reference', merchant.reference);
        }
    }, [merchant]);


    useEffect(() => {
        loadData();

    }, []);
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitted },
        getValues,
        setValue,
    } = useForm<MerchantFormData>({
        resolver: zodResolver(merchantSchema),
        defaultValues: {
            minOrderValue: 0,
            averagePreparationTime: 0,
            averageTicket: 0,
        },
    });



    const onUploadImagem = async (file: File, isLogo: boolean) => {
        if (!merchant) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('isLogo', String(isLogo));
        formData.append('merchantId', merchant.id);

        const { data } = await api.post(
            '/opendelivery/merchant/uploadimage',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (isLogo) {
            setMerchant({
                ...merchant,
                logoUrl: data.url,
                logoCrc32: data.crc32
            });
        } else {
            setMerchant({
                ...merchant,
                bannerUrl: data.url,
                bannerCrc32: data.crc32
            });
        }
    };
    const buscarCep = async (cepValue: string) => {
        const result = await cep(cepValue);

        setValue('street', result.street);
        setValue('district', result.neighborhood);
        setValue('city', result.city);
        setValue('state', result.state);

        // buscar lat/lng via OpenStreetMap
        const geo = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${result.street},${result.city}`
        ).then(r => r.json());

        if (geo?.[0]) {
            setMerchant({ ...merchant, latitude: Number(geo[0].lat), longitude: Number(geo[0].lon) });
        }

    };

    const onSubmit = async (data: MerchantFormData) => {
        if (!merchant) return;

        try {
            setLoading(true);

            const payload = {
                ...merchant,
                document: data.document.replace(/\D/g, ''),
                corporateName: data.corporateName,
                postalCode: data.postalCode.replace(/\D/g, ''),
                street: data.street,
                number: data.number,
                district: data.district,
                city: data.city,
                state: data.state,
                averageTicket: Number(data.averageTicket),
                averagePreparationTime: Number(data.averagePreparationTime),
                minOrderValue: Number(data.minOrderValue),
                whatsappNumber: data.whatsappNumber.replace(/\D/g, ''),
                commercialPhone: data.commercialPhone.replace(/\D/g, ''),
                contactEmails: data.contactEmails,
                name: data.name,
                description: data.description,
                complement: data.complement,
                reference: data.reference,
            };
            await api.post('/opendelivery/merchant', payload);
            setClose(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };





    return (
        <BaseModal width={'95vw'} setClose={setClose} title="Editar Estabelecimento" isOpen={true}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Tabs
                            defaultActiveKey="home"
                            id="uncontrolled-tab-example"
                            className="mb-3"
                        >
                            <Tab eventKey="home" title="Principal">
                                <div className={styles.formGrid}>
                                    <KRDInput
                                        label="CNPJ"
                                        name="document"
                                        control={control}
                                        mask="99.999.999/9999-99"
                                        width="30%"
                                        error={errors.document?.message?.toString()}
                                    />
                                    <KRDInput width={'33%'} label="Nome Fantasia" name="name" control={control} error={errors.name?.message?.toString()} />
                                    <KRDInput width={'33%'} label="Razão Social" name="corporateName" control={control} error={errors.corporateName?.message?.toString()} />
                                    <KRDInput width={'100%'} label="Descrição (Ex: Sorveteria)" name="description" control={control} error={errors.description?.message?.toString()} />
                                    <KRDInput isCurrency={true} type={'number'} width={'20%'} label="Ticket médio" name="averageTicket" control={control} error={errors.averageTicket?.message?.toString()} />
                                    <KRDInput type={'number'} width={'20%'} label="Tempo médio de preparo" name="averagePreparationTime" control={control} error={errors.averagePreparationTime?.message?.toString()} />
                                    <KRDInput isCurrency={true} type={'number'} width={'20%'} label="Pedido Minimo" name="minOrderValue" control={control} error={errors.minOrderValue?.message?.toString()} />
                                </div>
                                <div className={styles.images}>
                                    <ImageUpload
                                        label="Logo"
                                        preview={merchant?.logoUrl}
                                        onUpload={(file) => onUploadImagem(file, true)}
                                    />

                                    <ImageUpload
                                        label="Banner"
                                        preview={merchant?.bannerUrl}
                                        onUpload={(file) => onUploadImagem(file, false)}
                                    />
                                    <div style={{ width: '25%' }}>
                                        <AcceptedCardsComponent value={merchant?.acceptedCards} onChange={(v) => setMerchant({ ...merchant, acceptedCards: v })} />
                                    </div>
                                     <div style={{ width: '40%' }}>
                                        <MerchantCategoriesComponent value={merchant?.merchantCategories} onChange={(v) => setMerchant({ ...merchant, merchantCategories: v })} />
                                    </div>
                                </div>
                            </Tab>

                            <Tab eventKey="profile" title="Endereço e contato">
                                <div className={styles.formGrid}>
                                    <h5>Contato</h5>
                                    <KRDInput width={'20%'} label="Telefone Comercial" name="commercialPhone" control={control} error={errors.commercialPhone?.message?.toString()} />
                                    <KRDInput mask="(99) 99999-9999" width={'20%'} label="WhatsApp" name="whatsappNumber" control={control} error={errors.whatsappNumber?.message?.toString()} />
                                    <KRDInput width={'50%'} label="Emails(separado por virgula)" name="contactEmails" control={control} error={errors.contactEmails?.message?.toString()} />
                                    <div className={styles.divider}>
                                        <hr />
                                    </div>
                                    <h5>Endereço</h5>
                                    <KRDInput
                                        label="CEP"
                                        name="postalCode"
                                        control={control}
                                        mask="99999-999"
                                        width="30%"
                                        error={errors.postalCode?.message}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        style={{ height: 38, marginTop: 22 }}
                                        onClick={() => buscarCep(getValues('postalCode'))}
                                    >Buscar CEP</Button>


                                    <KRDInput width={'70%'} label="Rua" name="street" control={control} />
                                    <KRDInput width={'12%'} label="Número" name="number" control={control} />
                                    <KRDInput width={'12%'} label="Complemento" name="complement" control={control} />
                                    <KRDInput width={'40%'} label="Bairro" name="district" control={control} />
                                    <KRDInput width={'40%'} label="Cidade" name="city" control={control} />
                                    <KRDInput width={'10%'} label="Estado" name="state" control={control} />
                                    <KRDInput width={'100%'} label="referência" name="reference" control={control} />
                                </div>
                            </Tab>
                            <Tab eventKey="contact" title="Horário de funcionamento" disabled>
                                Tab content for Contact
                            </Tab>
                        </Tabs>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setClose()}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={loading}
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </BaseModal>
    )

}

type Tag = {
    label: string;
    value: string;
};

type AcceptedCardsProps = {
    value: string;
    onChange: (newValue: string) => void;
};

const AcceptedCardsComponent = ({ value, onChange }: AcceptedCardsProps) => {
    const tags: Tag[] = [
        { value: "VISA", label: "VISA" },
        { value: "MASTERCARD", label: "MASTERCARD" },
        { value: "DINERS", label: "DINERS CLUB" },
        { value: "AMEX", label: "AMERICAN EXPRESS" },
        { value: "HIPERCARD", label: "HIPERCARD" },
        { value: "ELO", label: "ELO" },
        { value: "AURA", label: "AURA" },
        { value: "DISCOVER", label: "DISCOVER" },
        { value: "VR_BENEFICIOS", label: "VR Benefícios" },
        { value: "SODEXO", label: "Sodexo" },
        { value: "TICKET", label: "Ticket" },
        { value: "GOOD_CARD", label: "Good Card" },
        { value: "BANESCARD", label: "Banescard" },
        { value: "SOROCARD", label: "Sorocred" },
        { value: "POLICARD", label: "Policard" },
        { value: "VALECARD", label: "Valecard" },
        { value: "AGICARD", label: "Agicard" },
        { value: "JCB", label: "JCB" },
        { value: "CREDSYSTEM", label: "Credsystem" },
        { value: "CABAL", label: "Cabal" },
        { value: "GREEN_CARD", label: "Green Card" },
        { value: "VEROCHEQUE", label: "Verocheque" },
        { value: "AVISTA", label: "À vista" },
        { value: "OTHER", label: "Outros" },
    ];

    const [selecteds, setSelecteds] = useState<string[]>([]);

    useEffect(() => {
        if (!value) return;

        setSelecteds(value.split(','));
    }, [value]);

    const isSelected = (s: string) => selecteds.includes(s);

    const onToggle = (s: string) => {
        const newList = isSelected(s)
            ? selecteds.filter(x => x !== s)
            : [...selecteds, s];

        setSelecteds(newList);
        onChange(newList.join(','));
    };

    const Item = ({ label, value }: Tag) => {
        return (
            <span
                onClick={() => onToggle(value)}
                className={
                    isSelected(value)
                        ? styles.itemSelected
                        : styles.itemNonSelected
                }
            >
                {label}
            </span>
        );
    };

    return (
        <div className={styles.acceptedCards}>
            <b>Cartões Aceitos</b>
            <div className={styles.items}>
                {tags.map(tag => (
                    <Item
                        key={tag.value}
                        label={tag.label}
                        value={tag.value}
                    />
                ))}
            </div>
        </div>
    );
};
type MerchantCategoriesProps = {
    value: string;
    onChange: (newValue: string) => void;
};
const MerchantCategoriesComponent = ({ value, onChange }: MerchantCategoriesProps) => {
    const tags: Tag[] = [
        { value: "BURGERS", label: "Hambúrgueres" },
        { value: "PIZZA", label: "Pizza" },
        { value: "FAST_FOOD", label: "Fast Food" },
        { value: "HOT_DOG", label: "Cachorro-quente" },
        { value: "JAPANESE", label: "Japonesa" },
        { value: "DESSERTS", label: "Sobremesas" },
        { value: "AMERICAN", label: "Americana" },
        { value: "ICE_CREAM", label: "Sorvetes" },
        { value: "BBQ", label: "Churrasco" },
        { value: "SANDWICH", label: "Sanduíches" },
        { value: "MEXICAN", label: "Mexicana" },
        { value: "BRAZILIAN", label: "Brasileira" },
        { value: "PASTRY", label: "Salgados" },
        { value: "ARABIAN", label: "Árabe" },
        { value: "COMFORT_FOOD", label: "Comida Caseira" },
        { value: "VEGETARIAN", label: "Vegetariana" },
        { value: "VEGAN", label: "Vegana" },
        { value: "BAKERY", label: "Padaria" },
        { value: "HEALTHY", label: "Saudável" },
        { value: "ITALIAN", label: "Italiana" },
        { value: "CHINESE", label: "Chinesa" },
        { value: "JUICE_SMOOTHIES", label: "Sucos & Smoothies" },
        { value: "SEAFOOD", label: "Frutos do Mar" },
        { value: "CAFE", label: "Café" },
        { value: "SALADS", label: "Saladas" },
        { value: "COFFEE_TEA", label: "Café & Chá" },
        { value: "PASTA", label: "Massas" },
        { value: "BREAKFAST_BRUNCH", label: "Café da Manhã / Brunch" },
        { value: "LATIN_AMERICAN", label: "Latino-Americana" },
        { value: "CONVENIENCE", label: "Conveniência" },
        { value: "PUB", label: "Pub" },
        { value: "HAWAIIAN", label: "Havaiana" },
        { value: "EUROPEAN", label: "Europeia" },
        { value: "FAMILY_MEALS", label: "Refeições em Família" },
        { value: "FRENCH", label: "Francesa" },
        { value: "INDIAN", label: "Indiana" },
        { value: "PORTUGUESE", label: "Portuguesa" },
        { value: "SPANISH", label: "Espanhola" },
        { value: "GOURMET", label: "Gourmet" },
        { value: "KIDS_FRIENDLY", label: "Amigável para Crianças" },
        { value: "SOUTH_AMERICAN", label: "Sul-Americana" },
        { value: "SPECIALTY_FOODS", label: "Comidas Especiais" },
        { value: "ARGENTINIAN", label: "Argentina" },
        { value: "PREMIUM", label: "Premium" },
        { value: "AFFORDABLE_MEALS", label: "Refeições Acessíveis" },
    ];

    const [selecteds, setSelecteds] = useState<string[]>([]);

    useEffect(() => {
        if (!value) return;
        setSelecteds(value.split(','));
    }, [value]);

    const isSelected = (s: string) => selecteds.includes(s);

    const onToggle = (s: string) => {
        const newList = isSelected(s)
            ? selecteds.filter(x => x !== s)
            : [...selecteds, s];

        setSelecteds(newList);
        onChange(newList.join(','));
    };

    const Item = ({ label, value }: Tag) => (
        <span
            onClick={() => onToggle(value)}
            className={
                isSelected(value)
                    ? styles.itemSelected
                    : styles.itemNonSelected
            }
        >
            {label}
        </span>
    );

    return (
        <div className={styles.merchantCategories}>
            <b>Categorias do Estabelecimento</b>
            <div className={styles.items}>
                {tags.map(tag => (
                    <Item
                        key={tag.value}
                        label={tag.label}
                        value={tag.value}
                    />
                ))}
            </div>
        </div>
    );
};


