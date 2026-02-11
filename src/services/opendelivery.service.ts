import IMerchantOpenDelivery from "@/interfaces/IMerchantOpenDelivery";
import { api } from "./apiClient";

async function getMerchantServices(empresaId: number) {
    const { data } = await api.get(
        `/opendelivery/merchant/services`,
        { params: { EmpresaId: empresaId } }
    );

    return data;
}

async function saveMerchantServices(payload: any[]) {
    const { data } = await api.post(
        `/opendelivery/merchant/services`,
        payload
    );

    return data;
}

export interface RadiusArea {
    id: string;
    type: 'RADIUS';
    color: string;
    geoMidpointLatitude: number;
    geoMidpointLongitude: number;
    radiusMeters: number;
    price: Price;
    estimateDeliveryTime?: number;
}
export interface Price {
    value: number;
    currency: string;
}
export interface PolygonArea {
    id: string;
    type: 'POLYGON';
    color: string;
    geoCoordinates: { lat: number; lng: number }[];
    price: Price;
    estimateDeliveryTime?: number;
}
export interface ScheduleConfig {
    scheduleTimeWindow: string;
    scheduleStartWindow: string;
    scheduleEndWindow: string;
}

export interface ServiceHours {
    day: string;
    open: boolean;
    start: string;
    end: string;
}
export type ServiceType = 'DELIVERY' | 'TAKEOUT' | 'INDOOR';
export type ServiceStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type TimingType = 'INSTANT' | 'SCHEDULED' | 'ONDEMAND';
export type DeliveryArea = PolygonArea | RadiusArea;
export interface ServiceConfig {
    id: string;
    status: ServiceStatus;
    serviceType: ServiceType;
    timing: TimingType[];
    schedule?: ScheduleConfig;
    hours: ServiceHours[];
    areas?: DeliveryArea[];

    store_lat?: number;
    store_lng?: number;
}

function mapServiceToPayload(
    service: ServiceConfig,
    empresaId: number,
) {
    return {
        id: service.id,
        status: service.status,
        serviceType: service.serviceType,

        serviceTiming: {
            timing: service.timing,
            schedule: service.schedule,
            hours: service.hours,
        },

        serviceArea: service.areas
            ? {
                areas: service.areas,
            }
            : null,

        empresaId,
    };
}
function mapPayloadToService(payload: any): ServiceConfig {
    const serviceTiming = JSON.parse(payload.serviceTiming) || {};
    const serviceArea = JSON.parse(payload.serviceArea) || {};
    return {
        id: payload.id,
        status: payload.status,
        serviceType: payload.serviceType,

        timing: serviceTiming?.timing ?? ['INSTANT'],
        schedule: serviceTiming?.schedule,
        hours: serviceTiming?.hours ?? [],

        areas: serviceArea?.areas ?? [],
    };
}


export {mapPayloadToService,  mapServiceToPayload, getMerchantServices, saveMerchantServices};