// Datos de muestra para probar el front-end sin Supabase conectado todavía.
export const MOCK_CONTACTS = [
  { id: "1", name: "Nacho", initial: "N", phone: "+598 98318222" },
  { id: "2", name: "Andrea", initial: "A", phone: "+598 99 000 002" },
  { id: "3", name: "Ceci", initial: "C", phone: "+598 99 000 003" },
];

export const MOCK_ALERTS = [
  { id: "1", created_at: new Date(Date.now() - 5 * 60000).toISOString(), type: "zone_exit", text: "Salió de la zona segura por 6 minutos" },
  { id: "2", created_at: new Date(Date.now() - 60 * 60000).toISOString(), type: "checkin", text: 'Check-in: "Estoy bien"' },
];

export const MOCK_ZONES = [
  { id: "z1", name: "Casa", lat: -34.9011, lng: -56.1645, radius_m: 200 },
];
export const MOCK_LOCATION = { lat: -34.9013, lng: -56.1642 };
export const MOCK_MAMA_PROFILE = {
  id: "mock-mama",
  name: "Laura",
  email: "lisboaser@gmail.com",
  phone: "+598 99 000 000",
  role: "mama",
};
