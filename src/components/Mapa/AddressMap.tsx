import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente helper para invalidar o tamanho do mapa
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  return null;
}

type Props = {
  street?: string;
  number?: string;
  city?: string;
  state?: string;
};

export default function AddressMap({ street, number, city, state }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!street || !number) return;

    const endereco = `${street}, ${number}, ${city ?? ''}, ${state ?? ''}`;

    const buscarCoordenadas = async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`
      );
      const data = await res.json();
      if (data?.length > 0) {
        setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    };

    buscarCoordenadas();
  }, [street, number, city, state]);

  if (!position) {
    return <div>Informe rua e número para visualizar no mapa</div>;
  }

  return (
    <MapContainer
      center={position}
      zoom={16}
      style={{ height: '300px', width: '100%' }}
    >
      <MapResizer /> {/* ← Adicione este componente */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>Local da loja</Popup>
      </Marker>
    </MapContainer>
  );
}