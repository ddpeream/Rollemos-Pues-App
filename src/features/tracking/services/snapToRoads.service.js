/**
 * 🛣️ Snap-to-Roads Service
 *
 * Toma coordenadas GPS crudas y las ajusta a las calles reales
 * usando OSRM (Open Source Routing Machine).
 * Perfil "cycling" porque el patinaje usa vías similares.
 */

const OSRM_BASE = 'https://router.project-osrm.org';
const MAX_COORDS_PER_REQUEST = 100;

/**
 * Ajusta un array de coordenadas a las vías reales.
 * @param {Array<{latitude: number, longitude: number}>} coordinates
 * @returns {Promise<Array<{latitude: number, longitude: number}> | null>}
 *   Coordenadas ajustadas o null si falla.
 */
export const snapToRoads = async (coordinates) => {
  if (!coordinates || coordinates.length < 2) return null;

  try {
    // OSRM tiene límite de 100 coords por request.
    // Si hay más, muestreamos uniformemente manteniendo inicio y final.
    let coords = coordinates;
    if (coords.length > MAX_COORDS_PER_REQUEST) {
      const step = Math.ceil(coords.length / MAX_COORDS_PER_REQUEST);
      coords = coords.filter((_, i) => i % step === 0);
      const last = coordinates[coordinates.length - 1];
      if (coords[coords.length - 1] !== last) {
        coords.push(last);
      }
    }

    // OSRM espera lng,lat (invertido respecto a nuestro lat,lng)
    const coordString = coords
      .map((c) => `${c.longitude},${c.latitude}`)
      .join(';');

    // radiuses: tolerancia en metros para cada punto (25m es razonable para GPS urbano)
    const radiuses = coords.map(() => '25').join(';');

    const url = `${OSRM_BASE}/match/v1/cycling/${coordString}?overview=full&geometries=geojson&radiuses=${radiuses}`;

    const response = await fetch(url, { timeout: 8000 });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.code !== 'Ok' || !data.matchings?.length) return null;

    // Extraer coordenadas ajustadas de todos los matchings
    const snapped = [];
    for (const matching of data.matchings) {
      if (matching.geometry?.coordinates) {
        for (const [lng, lat] of matching.geometry.coordinates) {
          snapped.push({ latitude: lat, longitude: lng });
        }
      }
    }

    return snapped.length > 1 ? snapped : null;
  } catch (err) {
    // Fallo silencioso: se usarán las coordenadas raw
    return null;
  }
};
