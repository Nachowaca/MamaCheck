import { View, Platform } from "react-native";
import { C } from "../theme/colors";

const HTML = (lat, lng, zones, accent, safeColor, dangerColor) => `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>
  html,body,#map{height:100%;margin:0;background:#1b2334}
  .leaflet-control-attribution{font-size:9px;background:rgba(22,24,38,0.7);color:#e9e9ed}
  .leaflet-control-attribution a{color:${accent}}
  .leaflet-control-zoom{border:none!important;box-shadow:0 2px 8px rgba(0,0,0,0.15)!important}
  .leaflet-control-zoom a{
    width:34px!important;height:34px!important;line-height:34px!important;
    font-size:19px!important;color:${accent}!important;background:#f3f5fe!important;
  }
  .leaflet-control-zoom a:first-child{border-top-left-radius:10px!important;border-top-right-radius:10px!important}
  .leaflet-control-zoom a:last-child{border-bottom-left-radius:10px!important;border-bottom-right-radius:10px!important}
  .zone-label{font-size:11px;font-weight:600;color:${accent};background:rgba(243,245,254,0.9);padding:1px 6px;border-radius:8px;white-space:nowrap}
</style>
</head><body>
<div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
  var zones = ${JSON.stringify(zones)};
  var SAFE = '${safeColor}';
  var DANGER = '${dangerColor}';

  // Fórmula haversine, igual a la que usa el chequeo real del lado del
  // servidor (locationTask.js) — así el color del punto en el mapa
  // coincide con si mamá está realmente "dentro" de alguna zona o no.
  function distanceMeters(lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var toRad = function (d) { return (d * Math.PI) / 180; };
    var dLat = toRad(lat2 - lat1);
    var dLng = toRad(lng2 - lng1);
    var a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function isInsideAnyZone(lat, lng) {
    if (!zones.length) return true;
    return zones.some(function (z) { return distanceMeters(lat, lng, z.lat, z.lng) <= z.radius_m; });
  }
  function makeDotIcon(color) {
    return L.divIcon({
      className: '',
      html: '<div style="width:22px;height:22px;border-radius:50%;background:' + color + '40;display:flex;align-items:center;justify-content:center"><div style="width:14px;height:14px;border-radius:50%;background:' + color + ';border:2.5px solid #f3f5fe"></div></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([${lat}, ${lng}], 16);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Un círculo por cada zona segura (casa de mamá, casa de un familiar,
  // etc.) — el punto de mamá se dibuja aparte, así si se aleja de todas
  // se ve la distancia real hacia la más cercana.
  var zoneCircles = zones.map(function (z) {
    return L.circle([z.lat, z.lng], { radius: z.radius_m, color: '${accent}', weight: 1.5, dashArray: '4 4', fillOpacity: 0.06 })
      .bindTooltip(z.name || 'Zona segura', { permanent: true, direction: 'top', className: 'zone-label', offset: [0, -4] })
      .addTo(map);
  });

  var marker = L.marker([${lat}, ${lng}], { icon: makeDotIcon(isInsideAnyZone(${lat}, ${lng}) ? SAFE : DANGER) }).addTo(map);

  var bounds = L.featureGroup(zoneCircles.concat([marker])).getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
  } else {
    map.setView([${lat}, ${lng}], 16);
  }

  document.addEventListener('message', handleMessage);
  window.addEventListener('message', handleMessage);
  function handleMessage(e) {
    try {
      var data = JSON.parse(e.data);
      if (data.lat && data.lng) {
        marker.setLatLng([data.lat, data.lng]);
        marker.setIcon(makeDotIcon(isInsideAnyZone(data.lat, data.lng) ? SAFE : DANGER));
        var newBounds = L.featureGroup(zoneCircles.concat([marker])).getBounds();
        map.fitBounds(newBounds, { padding: [36, 36], maxZoom: 16 });
      }
    } catch (err) {}
  }
</script>
</body></html>
`;

// En nativo (Expo Go / build real) usamos react-native-webview.
// En web (solo para previsualizar acá en el chat) no lo soporta, así que
// caemos a un <iframe> del navegador con el mismo HTML.
const NativeWebView = Platform.OS === "web" ? null : require("react-native-webview").WebView;

export default function OsmMap({ lat, lng, zones = [], height = 300 }) {
  if (lat == null || lng == null) {
    return <View style={{ height, backgroundColor: "#1b2334" }} />;
  }
  const html = HTML(lat, lng, zones, C.accent, "#4caf82", C.danger);

  if (Platform.OS === "web") {
    return (
      <View style={{ height, borderRadius: 8, overflow: "hidden" }}>
        <iframe
          title="mapa"
          srcDoc={html}
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </View>
    );
  }

  return (
    <View style={{ height, borderRadius: 8, overflow: "hidden" }}>
      <NativeWebView
        source={{ html }}
        style={{ backgroundColor: "#1b2334" }}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  );
}
