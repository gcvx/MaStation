/**
 * Geocoding service using OpenStreetMap Nominatim API
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    country?: string;
  };
}

/**
 * Geocode an address using OpenStreetMap Nominatim API
 * @param address Address to geocode
 * @returns Promise resolving to geocode result
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 3) {
    throw new Error('L\'adresse doit contenir au moins 3 caractères');
  }

  const encodedAddress = encodeURIComponent(address.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=fr&addressdetails=1&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GasStationViewer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: {
        house_number: result.address?.house_number,
        road: result.address?.road,
        postcode: result.address?.postcode,
        city: result.address?.city || result.address?.town || result.address?.village,
        country: result.address?.country
      }
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Impossible de géolocaliser cette adresse. Vérifiez votre connexion internet.');
  }
}

/**
 * Reverse geocode coordinates to get an address
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise resolving to address string
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GasStationViewer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.address) {
      return null;
    }

    const address = data.address;
    const parts: string[] = [];

    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    if (address.postcode && (address.city || address.town || address.village)) {
      parts.push(`${address.postcode} ${address.city || address.town || address.village}`);
    }

    return parts.join(', ') || data.display_name;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}