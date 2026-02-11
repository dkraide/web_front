'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Card, Form, ButtonGroup, ToggleButton } from 'react-bootstrap';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type AreaType = 'RADIUS' | 'POLYGON';

interface Area {
    id: string;
    type: AreaType;
    color: string;

    geoCoordinates?: { lat: number; lng: number }[];

    geoMidpointLatitude?: number;
    geoMidpointLongitude?: number;
    radiusMeters?: number;
}

interface Props {
    storeLat: number;
    storeLng: number;
    areas: Area[];
    onAddArea: (area: any) => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7'];

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/* ============ DRAW CONTROL ============ */
function DrawControl({ onPolygonCreated }: { onPolygonCreated: (coords: any[], color: string) => void }) {
    const map = useMap();
    const drawnItems = useRef(new L.FeatureGroup());

    useEffect(() => {
        map.addLayer(drawnItems.current);

        const drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems.current },
            draw: {
                polygon: {},
                rectangle: false,
                circle: false,
                marker: false,
                polyline: false,
                circlemarker: false,
            },
        });

        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, (e: any) => {
            const layer = e.layer;
            const color = getRandomColor();

            layer.setStyle({ color });
            drawnItems.current.addLayer(layer);

            const latlngs = layer.getLatLngs()[0].map((p: any) => ({
                lat: p.lat,
                lng: p.lng,
            }));

            onPolygonCreated(latlngs, color);
        });

        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems.current);
        };
    }, [map, onPolygonCreated]);

    return null;
}

/* ============ MAP ============ */
export default function DeliveryAreaMap({
    storeLat,
    storeLng,
    areas,
    onAddArea,
}: Props) {
    const [areaType, setAreaType] = useState<AreaType>('RADIUS');
    const [radiusKm, setRadiusKm] = useState(3);

    function addRadiusArea() {
        const color = getRandomColor();

        onAddArea({
            type: 'RADIUS',
            color,
            geoMidpointLatitude: storeLat,
            geoMidpointLongitude: storeLng,
            radiusMeters: radiusKm * 1000,
        });
    }

    return (
        <Card className="bg-white text-dark border">
            <Card.Body>
                <ButtonGroup className="mb-3">
                    <ToggleButton
                        id="radius"
                        type="radio"
                        variant="outline-primary"
                        checked={areaType === 'RADIUS'}
                        value=""
                        onChange={() => setAreaType('RADIUS')}
                    >
                        Raio
                    </ToggleButton>

                    <ToggleButton
                        id="polygon"
                        type="radio"
                        variant="outline-primary"
                        checked={areaType === 'POLYGON'}
                        value=""
                        onChange={() => setAreaType('POLYGON')}
                    >
                        Polígono
                    </ToggleButton>
                </ButtonGroup>

                {areaType === 'RADIUS' && (
                    <>
                        <Form.Control
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={radiusKm}
                            onChange={(e) => setRadiusKm(Number(e.target.value))}
                        />

                        <button
                            className="btn btn-sm btn-outline-primary mt-2"
                            onClick={addRadiusArea}
                        >
                            + Adicionar raio
                        </button>
                    </>
                )}

                <MapContainer
                    center={[storeLat, storeLng]}
                    zoom={14}
                    style={{ height: 400, marginTop: 16 }}
                >
                    <Marker position={[storeLat, storeLng]}>
                        <Popup>Local da loja</Popup>
                    </Marker>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* ÁREAS EXISTENTES */}
                    {areas.map((area) =>
                        area.type === 'POLYGON' ? (
                            <Polygon
                                key={area.id}
                                positions={area.geoCoordinates!.map((p) => [p.lat, p.lng])}
                                pathOptions={{ color: area.color, fillOpacity: 0.2 }}
                            />
                        ) : (
                            <Circle
                                key={area.id}
                                center={[
                                    area.geoMidpointLatitude!,
                                    area.geoMidpointLongitude!,
                                ]}
                                radius={area.radiusMeters!}
                                pathOptions={{ color: area.color, fillOpacity: 0.2 }}
                            />
                        )
                    )}

                    {/* DRAW */}
                    {areaType === 'POLYGON' && (
                        <DrawControl
                            onPolygonCreated={(coords, color) =>
                                onAddArea({
                                    type: 'POLYGON',
                                    color,
                                    geoCoordinates: coords,
                                })
                            }
                        />
                    )}
                </MapContainer>
            </Card.Body>
        </Card>
    );
}
