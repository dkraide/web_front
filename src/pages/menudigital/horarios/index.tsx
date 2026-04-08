import dynamic from 'next/dynamic';

const DeliveryAreaMap = dynamic(
    () => import('@/components/Mapa'),
    { ssr: false }
);
import { useCallback, useContext, useEffect, useState } from 'react';
import {
    mapPayloadToService,
    mapServiceToPayload,
    ServiceConfig,
    ServiceType,
    TimingType,
    getMerchantServices,
    saveMerchantServices,
} from '@/services/opendelivery.service';
import { AuthContext } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';
import IMerchantOpenDelivery from '@/interfaces/IMerchantOpenDelivery';
import styles from './styles.module.scss';

// ---- constants ----
const ALL_SERVICE_TYPES: ServiceType[] = ['DELIVERY', 'TAKEOUT', 'INDOOR'];

export const SERVICE_META: Record<ServiceType, { label: string; emoji: string; description: string }> = {
    DELIVERY: { label: 'Entrega',          emoji: '🛵', description: 'Pedidos entregues no endereço do cliente' },
    TAKEOUT:  { label: 'Retirada',         emoji: '🥡', description: 'Cliente retira no estabelecimento' },
    INDOOR:   { label: 'Consumo no local', emoji: '🍽️', description: 'Pedidos feitos na mesa ou balcão' },
};

/** Garante que os 3 serviços sempre existam, criando UNAVAILABLE para os que faltam */
function ensureAllServices(loaded: ServiceConfig[]): ServiceConfig[] {
    return ALL_SERVICE_TYPES.map((type) => {
        const existing = loaded.find((s) => s.serviceType === type);
        if (existing) return existing;
        return {
            id: crypto.randomUUID(),
            serviceType: type,
            status: 'UNAVAILABLE' as const,
            timing: ['INSTANT'] as TimingType[],
            hours: [],
        };
    });
}

// ======================================================
// PAGE
// ======================================================
export default function ServiceSetupPage() {
    const [services, setServices]             = useState<ServiceConfig[]>(() => ensureAllServices([]));
    const [activeTab, setActiveTab]           = useState<ServiceType>('DELIVERY');
    const { getUser }                         = useContext(AuthContext);
    const [empresaId, setEmpresaId]           = useState<number>(0);
    const [merchantConfig, setMerchantConfig] = useState<IMerchantOpenDelivery>();
    const [saving, setSaving]                 = useState(false);
    const [loading, setLoading]               = useState(true);

    useEffect(() => {
        async function load() {
            if (empresaId === 0) {
                const user = await getUser();
                setEmpresaId(user?.empresaSelecionada ?? 0);
                return;
            }

            setLoading(true);
            try {
                const [rawServices] = await Promise.all([
                    getMerchantServices(empresaId),
                    api
                        .get(`/opendelivery/merchant?empresaId=${empresaId}`)
                        .then(({ data }) => setMerchantConfig(data))
                        .catch(console.error),
                ]);

                setServices(ensureAllServices(rawServices.map(mapPayloadToService)));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [empresaId]);

    const updateService = useCallback((id: string, data: Partial<ServiceConfig>) => {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = services.map((s) => mapServiceToPayload(s, empresaId));
            await saveMerchantServices(payload);
            alert('Serviços salvos com sucesso');
        } finally {
            setSaving(false);
        }
    };

    const activeService = services.find((s) => s.serviceType === activeTab)!;

    return (
        <div className={styles.page}>
            {/* ---- Header ---- */}
            <div className={styles.pageHeader}>
                <div>
                    <h1>Configuração de Serviços</h1>
                    <p>Configure os canais de atendimento do seu estabelecimento</p>
                </div>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving || loading}
                    type="button"
                >
                    {saving ? '⏳ Salvando…' : '💾 Salvar configurações'}
                </button>
            </div>

            {/* ---- Tab bar ---- */}
            <div className={styles.tabBar}>
                {services.map((service) => {
                    const { label, emoji }  = SERVICE_META[service.serviceType];
                    const isActive          = activeTab === service.serviceType;
                    const isAvailable       = service.status === 'AVAILABLE';

                    return (
                        <button
                            key={service.serviceType}
                            type="button"
                            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(service.serviceType)}
                        >
                            <span className={styles.tabEmoji}>{emoji}</span>
                            <span className={styles.tabLabel}>{label}</span>
                            <span className={`${styles.tabDot} ${isAvailable ? styles.dotGreen : styles.dotGray}`} />
                        </button>
                    );
                })}
            </div>

            {/* ---- Tab content ---- */}
            {loading ? (
                <div className={styles.loadingState}>
                    <span className={styles.spinner} />
                    <p>Carregando configurações…</p>
                </div>
            ) : (
                <ServiceCard
                    service={activeService}
                    onChange={updateService}
                    merchantConfig={merchantConfig}
                />
            )}
        </div>
    );
}

// ======================================================
// SERVICE CARD
// ======================================================
function ServiceCard({
    service,
    onChange,
    merchantConfig,
}: {
    service: ServiceConfig;
    onChange: (id: string, data: Partial<ServiceConfig>) => void;
    merchantConfig?: IMerchantOpenDelivery;
}) {
    const { label, emoji, description } = SERVICE_META[service.serviceType];
    const isAvailable = service.status === 'AVAILABLE';

    return (
        <div className={styles.card}>
            {/* Card header */}
            <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                    <span className={styles.cardEmoji}>{emoji}</span>
                    <div>
                        <strong>{label}</strong>
                        <span className={styles.cardDesc}>{description}</span>
                    </div>
                </div>

                <div className={styles.statusToggleArea}>
                    <span className={`${styles.statusLabel} ${isAvailable ? styles.statusOn : styles.statusOff}`}>
                        {isAvailable ? 'Canal ativo' : 'Canal inativo'}
                    </span>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={isAvailable}
                            onChange={(e) =>
                                onChange(service.id, {
                                    status: e.target.checked ? 'AVAILABLE' : 'UNAVAILABLE',
                                })
                            }
                        />
                        <span className={styles.slider} />
                    </label>
                </div>
            </div>

            {/* Body */}
            <div className={styles.cardBody}>
                {!isAvailable && (
                    <div className={styles.inactiveBanner}>
                        <span>⚠️</span>
                        <p>Este canal está inativo. Ative-o para liberar as configurações abaixo.</p>
                    </div>
                )}

                <div className={!isAvailable ? styles.blurred : ''}>
                    <TimingConfig service={service} onChange={onChange} disabled={!isAvailable} />
                    <HoursConfig  service={service} onChange={onChange} disabled={!isAvailable} />
                    {service.serviceType === 'DELIVERY' && merchantConfig && (
                        <DeliveryAreaConfig
                            service={service}
                            onChange={onChange}
                            merchantConfig={merchantConfig}
                            disabled={!isAvailable}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ======================================================
// TIMING CONFIG
// ======================================================
const TIMING_OPTIONS: { value: TimingType; label: string; hint: string }[] = [
    { value: 'INSTANT',   label: 'Pedido imediato', hint: 'Confirmado e preparado na hora' },
    { value: 'SCHEDULED', label: 'Pedido agendado', hint: 'Cliente escolhe data/hora' },
    { value: 'ONDEMAND',  label: 'Sob demanda',     hint: 'Somente quando disponível' },
];

function TimingConfig({ service, onChange, disabled }: { service: ServiceConfig; onChange: any; disabled: boolean }) {
    const [open, setOpen] = useState(true);

    function toggleTiming(type: TimingType) {
        if (disabled) return;
        const exists = service.timing.includes(type);
        const timing = exists
            ? service.timing.filter((t: TimingType) => t !== type)
            : [...service.timing, type];
        onChange(service.id, { timing });
    }

    return (
        <div className={styles.subSection}>
            <button type="button" className={styles.subSectionHeader} onClick={() => setOpen((o) => !o)}>
                <span>Tipos de pedido</span>
                <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▼</span>
            </button>

            {open && (
                <div className={styles.subSectionBody}>
                    <div className={styles.checkGroup}>
                        {TIMING_OPTIONS.map(({ value, label, hint }) => (
                            <label key={value} className={`${styles.checkItem} ${disabled ? styles.checkDisabled : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={service.timing.includes(value)}
                                    onChange={() => toggleTiming(value)}
                                    disabled={disabled}
                                />
                                <div>
                                    <span>{label}</span>
                                    <span className={styles.checkHint}>{hint}</span>
                                </div>
                            </label>
                        ))}
                    </div>

                    {service.timing.includes('SCHEDULED') && !disabled && (
                        <div className={styles.selectField}>
                            <label>Intervalo de agendamento</label>
                            <select
                                value={service.schedule?.scheduleTimeWindow ?? '30_MINUTES'}
                                onChange={(e) =>
                                    onChange(service.id, {
                                        schedule: { ...service.schedule, scheduleTimeWindow: e.target.value },
                                    })
                                }
                            >
                                <option value="15_MINUTES">A cada 15 minutos</option>
                                <option value="30_MINUTES">A cada 30 minutos</option>
                                <option value="45_MINUTES">A cada 45 minutos</option>
                                <option value="60_MINUTES">A cada 1 hora</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ======================================================
// HOURS CONFIG
// ======================================================
const WEEK_DAYS = [
    { key: 'SUNDAY',    label: 'Dom' },
    { key: 'MONDAY',    label: 'Seg' },
    { key: 'TUESDAY',   label: 'Ter' },
    { key: 'WEDNESDAY', label: 'Qua' },
    { key: 'THURSDAY',  label: 'Qui' },
    { key: 'FRIDAY',    label: 'Sex' },
    { key: 'SATURDAY',  label: 'Sáb' },
];

function HoursConfig({ service, onChange, disabled }: { service: ServiceConfig; onChange: any; disabled: boolean }) {
    const [open, setOpen] = useState(false);

    function addHour(day: string) {
        if (disabled) return;
        onChange(service.id, {
            hours: [...service.hours, { day, start: '08:00', end: '18:00' }],
        });
    }

    function updateHour(index: number, field: 'start' | 'end', value: string) {
        const hours = [...service.hours];
        hours[index] = { ...hours[index], [field]: value };
        onChange(service.id, { hours });
    }

    function removeHour(index: number) {
        const hours = [...service.hours];
        hours.splice(index, 1);
        onChange(service.id, { hours });
    }

    return (
        <div className={styles.subSection}>
            <button type="button" className={styles.subSectionHeader} onClick={() => setOpen((o) => !o)}>
                <span>Horários de funcionamento</span>
                <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▼</span>
            </button>

            {open && (
                <div className={styles.subSectionBody}>
                    {WEEK_DAYS.map((day) => {
                        const dayHours = service.hours
                            .map((h: any, index: number) => ({ ...h, index }))
                            .filter((h: any) => h.day === day.key);

                        return (
                            <div key={day.key} className={styles.dayCard}>
                                <div className={styles.dayHeader}>
                                    <strong>{day.label}</strong>
                                    {dayHours.length === 0 && <span className={styles.closedBadge}>Fechado</span>}
                                </div>

                                {dayHours.map((h: any) => (
                                    <div key={h.index} className={styles.timeRow}>
                                        <input type="time" value={h.start} disabled={disabled}
                                            onChange={(e) => updateHour(h.index, 'start', e.target.value)} />
                                        <span>–</span>
                                        <input type="time" value={h.end} disabled={disabled}
                                            onChange={(e) => updateHour(h.index, 'end', e.target.value)} />
                                        {!disabled && (
                                            <button type="button" className={styles.btnRemove} onClick={() => removeHour(h.index)}>✕</button>
                                        )}
                                    </div>
                                ))}

                                {!disabled && (
                                    <button type="button" className={styles.btnLink} onClick={() => addHour(day.key)}>
                                        + Adicionar horário
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ======================================================
// DELIVERY AREA CONFIG
// ======================================================
const AREA_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7'];

function DeliveryAreaConfig({
    service, onChange, merchantConfig, disabled,
}: {
    service: ServiceConfig;
    onChange: (id: string, data: Partial<ServiceConfig>) => void;
    merchantConfig: IMerchantOpenDelivery;
    disabled: boolean;
}) {
    const [open, setOpen]   = useState(false);
    const STORE_LAT         = merchantConfig.latitude  ?? -23.55052;
    const STORE_LNG         = merchantConfig.longitude ?? -46.633308;

    function getNextColor() {
        return AREA_COLORS[(service.areas?.length ?? 0) % AREA_COLORS.length];
    }

    function addArea(area: any) {
        if (disabled) return;
        onChange(service.id, {
            areas: [...(service.areas ?? []),
                { id: crypto.randomUUID(), color: getNextColor(), price: { value: 0, currency: 'BRL' }, estimateDeliveryTime: undefined, ...area }],
        });
    }

    function updateArea(areaId: string, data: any) {
        onChange(service.id, { areas: service.areas?.map((a) => (a.id === areaId ? { ...a, ...data } : a)) });
    }

    function removeArea(areaId: string) {
        onChange(service.id, { areas: service.areas?.filter((a) => a.id !== areaId) });
    }

    return (
        <div className={styles.subSection}>
            <button type="button" className={styles.subSectionHeader} onClick={() => setOpen((o) => !o)}>
                <span>Áreas de entrega</span>
                <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▼</span>
            </button>

            {open && (
                <div className={styles.subSectionBody}>
                    <DeliveryAreaMap
                        storeLat={STORE_LAT}
                        storeLng={STORE_LNG}
                        areas={service.areas ?? []}
                        onAddArea={addArea}
                    />

                    {service.areas?.map((area, index) => (
                        <div key={area.id} className={styles.areaCard}>
                            <div className={styles.areaCardHeader}>
                                <span className={styles.colorDot} style={{ backgroundColor: area.color }} />
                                <strong>Área {index + 1} ({area.type})</strong>
                            </div>

                            <div className={styles.formField}>
                                <label>Preço da entrega (R$)</label>
                                <input type="number" step="0.01" min="0" disabled={disabled} value={area.price.value}
                                    onChange={(e) => updateArea(area.id, { price: { ...area.price, value: Number(e.target.value) } })} />
                            </div>

                            <div className={styles.formField}>
                                <label>Tempo estimado (min)</label>
                                <input type="number" min="0" disabled={disabled} value={area.estimateDeliveryTime ?? ''}
                                    onChange={(e) => updateArea(area.id, { estimateDeliveryTime: Number(e.target.value) })} />
                            </div>

                            {!disabled && (
                                <button type="button" className={styles.btnDanger} onClick={() => removeArea(area.id)}>
                                    Remover área
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}