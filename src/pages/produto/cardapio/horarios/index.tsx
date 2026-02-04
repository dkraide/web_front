import CollapsedDiv from '@/components/CollapsedDiv';
import dynamic from 'next/dynamic';

const DeliveryAreaMap = dynamic(
    () => import('../../../../components/Mapa'),
    { ssr: false }
);
import { useContext, useEffect, useState } from 'react';
import { Badge, Button, Card, Form, Stack } from 'react-bootstrap';
import { mapPayloadToService, mapServiceToPayload, ServiceConfig, ServiceType, TimingType } from '@/services/opendelivery.service';
import {
    getMerchantServices,
    saveMerchantServices
} from '@/services/opendelivery.service';
import { AuthContext } from '@/contexts/AuthContext';
const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7'];

function getNextColor(index: number) {
    return COLORS[index % COLORS.length];
}


// ================== PAGE ==================
export default function ServiceSetupPage() {
    const [services, setServices] = useState<ServiceConfig[]>([]);
    const {getUser} = useContext(AuthContext);
   const [empresaId, setEmpresaId] = useState<number>(0);
    useEffect(() => {
        async function load() {
            if(empresaId == 0){
                const user = await getUser();
                setEmpresaId(user?.empresaSelecionada ?? 0);
                return;
            }
            const data = await getMerchantServices(empresaId);
            const mapped = data.map(mapPayloadToService);
            setServices(mapped);
        }

        load();
    }, [empresaId]);
    function toggleService(type: ServiceType) {
        setServices((prev) => {
            const exists = prev.find((s) => s.serviceType === type);
            if (exists) return prev.filter((s) => s.serviceType !== type);

            return [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    serviceType: type,
                    status: 'AVAILABLE',
                    timing: ['INSTANT'],
                    hours: [],
                },
            ];
        });
    }

    function updateService(id: string, data: Partial<ServiceConfig>) {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    }

    return (
        <div style={{ width: '100%', backgroundColor: 'white', padding: 32, margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1>Configuração completa dos serviços</h1>

            <h2>1. Tipos de serviço</h2>
            <ServiceToggle label="Entrega" active={has(services, 'DELIVERY')} onClick={() => toggleService('DELIVERY')} />
            <ServiceToggle label="Retirada" active={has(services, 'TAKEOUT')} onClick={() => toggleService('TAKEOUT')} />
            <ServiceToggle label="Consumo no local" active={has(services, 'INDOOR')} onClick={() => toggleService('INDOOR')} />
            <Button
                variant="success"
                onClick={async () => {
                    const payload = services.map(s =>
                        mapServiceToPayload(s, empresaId)
                    );

                    await saveMerchantServices(payload);
                    alert('Serviços salvos com sucesso');
                }}
            >
                Salvar configurações
            </Button>


            <hr style={{ margin: '10px 0' }} />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 24,
                }}
            >
                {services.map((service) => (
                    <ServiceCard key={service.id} service={service} onChange={updateService} />
                ))}
            </div>

            <hr style={{ margin: '32px 0' }} />

            <h2>Payload final</h2>
            <pre style={{ background: '#111', color: '#0f0', padding: 16, borderRadius: 8 }}>
                {JSON.stringify(services, null, 2)}
            </pre>
        </div>
    );
}

// ================== COMPONENTS ==================
function ServiceToggle({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            style={{
                marginRight: 12,
                padding: '12px 18px',
                borderRadius: 8,
                border: active ? '2px solid #16a34a' : '1px solid #ccc',
                background: active ? '#dcfce7' : '#fff',
                cursor: 'pointer',
            }}
        >
            {label}
        </button>
    );
}

function ServiceCard({ service, onChange }: { service: ServiceConfig; onChange: any }) {
    return (
        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3>{service.serviceType}</h3>
            <Form.Check
                type="switch"
                id={`status-${service.id}`}
                label={service.status === 'AVAILABLE' ? 'Disponível' : 'Indisponível'}
                checked={service.status === 'AVAILABLE'}
                onChange={(e) =>
                    onChange(service.id, {
                        status: e.target.checked ? 'AVAILABLE' : 'UNAVAILABLE',
                    })
                }
            />
            {
                service.status === 'AVAILABLE' ? (
                    <>
                        <TimingConfig service={service} onChange={onChange} />
                        <HoursConfig service={service} onChange={onChange} />
                        <br />

                        {service.serviceType === 'DELIVERY' && <DeliveryAreaConfig service={service} onChange={onChange} />}
                    </>


                ) : (<></>)
            }



        </div>
    );
}

function TimingConfig({ service, onChange }: any) {
    function toggleTiming(type: TimingType) {
        const exists = service.timing.includes(type);
        const timing = exists
            ? service.timing.filter((t: TimingType) => t !== type)
            : [...service.timing, type];

        onChange(service.id, { timing });
    }

    return (
        <Card body className="mt-3 bg-white text-dark border">
            <h4>Tipos de pedido</h4>

            <Stack gap={2}>
                <Form.Check
                    type="checkbox"
                    label="Pedido imediato"
                    checked={service.timing.includes('INSTANT')}
                    onChange={() => toggleTiming('INSTANT')}
                />

                <Form.Check
                    type="checkbox"
                    label="Pedido agendado"
                    checked={service.timing.includes('SCHEDULED')}
                    onChange={() => toggleTiming('SCHEDULED')}
                />

                <Form.Check
                    type="checkbox"
                    label="Pedido sob demanda"
                    checked={service.timing.includes('ONDEMAND')}
                    onChange={() => toggleTiming('ONDEMAND')}
                />
            </Stack>

            {service.timing.includes('SCHEDULED') && (
                <div className="mt-3">
                    <Form.Label>Intervalo de agendamento</Form.Label>

                    <Form.Select
                        value={service.schedule?.scheduleTimeWindow}
                        onChange={(e) =>
                            onChange(service.id, {
                                schedule: {
                                    ...service.schedule,
                                    scheduleTimeWindow: e.target.value,
                                },
                            })
                        }
                    >
                        <option value="15_MINUTES">A cada 15 minutos</option>
                        <option value="30_MINUTES">A cada 30 minutos</option>
                        <option value="45_MINUTES">A cada 45 minutos</option>
                        <option value="60_MINUTES">A cada 1 hora</option>
                    </Form.Select>
                </div>
            )}
        </Card>
    );
}
export interface IDayConfig {
    day: number; // 0 = Domingo ... 6 = Sábado
    ranges: {
        start: string; // HH:mm
        end: string;   // HH:mm
    }[];
}

interface HoursConfigProps {
    value: IDayConfig[];
    onChange: (value: IDayConfig[]) => void;
}
function HoursConfig({ service, onChange }: any) {
    const WEEK_DAYS = [
        { key: 'SUNDAY', label: 'Domingo' },
        { key: 'MONDAY', label: 'Segunda' },
        { key: 'TUESDAY', label: 'Terça' },
        { key: 'WEDNESDAY', label: 'Quarta' },
        { key: 'THURSDAY', label: 'Quinta' },
        { key: 'FRIDAY', label: 'Sexta' },
        { key: 'SATURDAY', label: 'Sábado' },
    ];

    function addHour(day: string) {
        onChange(service.id, {
            hours: [...service.hours, { day, start: '08:00', end: '12:00' }],
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
        <section className="mt-3">
            <CollapsedDiv title={'Horários de funcionamento'} openned={false}>
                <Stack gap={2}>
                    {WEEK_DAYS.map((day) => {
                        const dayHours = service.hours
                            .map((h: any, index: number) => ({ ...h, index }))
                            .filter((h: any) => h.day === day.key);

                        return (
                            <Card
                                key={day.key}
                                body
                                style={{
                                    backgroundColor: 'white',
                                    padding: 8,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <strong style={{ fontSize: 13 }}>
                                        {day.label}
                                    </strong>

                                    {dayHours.length === 0 && (
                                        <Badge bg="secondary" pill>
                                            Fechado
                                        </Badge>
                                    )}
                                </div>

                                <Stack gap={1} className="mt-2">
                                    {dayHours.map((h: any) => (
                                        <Stack
                                            key={h.index}
                                            direction="horizontal"
                                            gap={1}
                                            className="align-items-center"
                                        >
                                            <Form.Control
                                                type="time"
                                                size="sm"
                                                value={h.start}
                                                onChange={(e) =>
                                                    updateHour(h.index, 'start', e.target.value)
                                                }
                                                style={{ maxWidth: 100 }}
                                            />

                                            <span style={{ fontSize: 12 }}>–</span>

                                            <Form.Control
                                                type="time"
                                                size="sm"
                                                value={h.end}
                                                onChange={(e) =>
                                                    updateHour(h.index, 'end', e.target.value)
                                                }
                                                style={{ maxWidth: 100 }}
                                            />

                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                style={{ padding: '2px 6px' }}
                                                onClick={() => removeHour(h.index)}
                                            >
                                                ✕
                                            </Button>
                                        </Stack>
                                    ))}
                                </Stack>

                                <Button
                                    size="sm"
                                    variant="link"
                                    className="mt-2 p-0"
                                    onClick={() => addHour(day.key)}
                                >
                                    + Adicionar horário
                                </Button>
                            </Card>
                        );
                    })}
                </Stack>
            </CollapsedDiv>
        </section>
    );
}



function has(list: ServiceConfig[], type: ServiceType) {
    return list.some((s) => s.serviceType === type);
}

function DeliveryAreaConfig({
    service,
    onChange,
}: {
    service: ServiceConfig;
    onChange: (id: string, data: Partial<ServiceConfig>) => void;
}) {
    const STORE_LAT = -23.55052;
    const STORE_LNG = -46.633308;

    const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7'];

    function getNextColor() {
        const index = service.areas?.length ?? 0;
        return COLORS[index % COLORS.length];
    }

    function addArea(area: any) {
        const newArea = {
            id: crypto.randomUUID(),
            color: getNextColor(),
            price: {
                value: 0,
                currency: 'BRL',
            },
            estimateDeliveryTime: undefined,
            ...area,
        };

        onChange(service.id, {
            areas: [...(service.areas ?? []), newArea],
        });
    }

    function updateArea(areaId: string, data: any) {
        onChange(service.id, {
            areas: service.areas?.map((a) =>
                a.id === areaId ? { ...a, ...data } : a
            ),
        });
    }

    function removeArea(areaId: string) {
        onChange(service.id, {
            areas: service.areas?.filter((a) => a.id !== areaId),
        });
    }

    return (
        <CollapsedDiv title="Áreas de entrega" openned={false}>
            <section className="mt-4">
                {/* MAPA */}
                <DeliveryAreaMap
                    storeLat={STORE_LAT}
                    storeLng={STORE_LNG}
                    areas={service.areas ?? []}
                    onAddArea={addArea}
                />
                {/* LISTA DE ÁREAS */}
                {service.areas && service.areas.length > 0 && (
                    <Card className="mt-3 bg-white text-dark border">
                        <Card.Body>
                            {service.areas.map((area, index) => (
                                <Card key={area.id} className="mb-3">
                                    <Card.Body>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: 4,
                                                    backgroundColor: area.color,
                                                }}
                                            />
                                            <strong>
                                                Área {index + 1} ({area.type})
                                            </strong>
                                        </div>

                                        <Form.Group className="mb-2">
                                            <Form.Label>Preço da entrega</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={area.price.value}
                                                onChange={(e) =>
                                                    updateArea(area.id, {
                                                        price: {
                                                            ...area.price,
                                                            value: Number(e.target.value),
                                                        },
                                                    })
                                                }
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-2">
                                            <Form.Label>Tempo estimado (min)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={area.estimateDeliveryTime ?? ''}
                                                onChange={(e) =>
                                                    updateArea(area.id, {
                                                        estimateDeliveryTime: Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </Form.Group>

                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => removeArea(area.id)}
                                        >
                                            Remover área
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ))}
                        </Card.Body>
                    </Card>
                )}

                {/* DEBUG */}
                {service.areas && (
                    <pre
                        style={{
                            marginTop: 12,
                            background: '#111',
                            color: '#0f0',
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    >
                        {JSON.stringify(service.areas, null, 2)}
                    </pre>
                )}
            </section>
        </CollapsedDiv>

    );
}

