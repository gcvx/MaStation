import { GasStation, MapFilters } from '@/types/station';

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter and sort stations based on map filters
 * @param stations Array of gas stations
 * @param filters Map filter criteria
 * @returns Filtered and sorted array of stations with distances
 */
export function filterStationsForMap(
  stations: GasStation[],
  filters: MapFilters
): (GasStation & { distance?: number })[] {
  let filteredStations: (GasStation & { distance?: number })[] = stations.filter(station => {
    // Must have coordinates
    if (!station.latitude || !station.longitude) return false;

    // Fuel type filter
    if (filters.fuelType && filters.fuelType !== 'all') {
      const hasFuelType = station.fuels.some(fuel => fuel.name === filters.fuelType);
      if (!hasFuelType) return false;
    }

    // Max price filter
    if (filters.maxPrice !== null && filters.fuelType && filters.fuelType !== 'all') {
      const fuel = station.fuels.find(f => f.name === filters.fuelType);
      if (!fuel || !fuel.price || fuel.price > filters.maxPrice) return false;
    }

    return true;
  });

  // Calculate distances if user location is available
  if (filters.userLatitude !== null && filters.userLongitude !== null) {
    filteredStations = filteredStations.map(station => ({
      ...station,
      distance: calculateDistance(
        filters.userLatitude!,
        filters.userLongitude!,
        station.latitude!,
        station.longitude!
      )
    }));

    // Apply distance filter
    if (filters.maxDistance !== null) {
      filteredStations = filteredStations.filter(station => 
        station.distance !== undefined && station.distance <= filters.maxDistance!
      );
    }
  }

  // Handle Top N feature
  if (filters.topN !== null) {
    // Sort based on the selected criteria
    if (filters.topNOrderBy === 'distance' && filters.userLatitude !== null && filters.userLongitude !== null) {
      filteredStations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (filters.topNOrderBy === 'price' && filters.fuelType && filters.fuelType !== 'all') {
      filteredStations.sort((a, b) => {
        const fuelA = a.fuels.find(f => f.name === filters.fuelType);
        const fuelB = b.fuels.find(f => f.name === filters.fuelType);
        const priceA = fuelA?.price || Infinity;
        const priceB = fuelB?.price || Infinity;
        return priceA - priceB;
      });
    }
    
    // Return only the top N stations
    return filteredStations.slice(0, filters.topN);
  }

  // Default sorting by distance if user location is available
  if (filters.userLatitude !== null && filters.userLongitude !== null) {
    filteredStations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Limit number of stations (regular max stations filter)
  if (filters.maxStations !== null) {
    return filteredStations.slice(0, filters.maxStations);
  }
  
  return filteredStations;
}

/**
 * Get current location using browser geolocation API
 * @returns Promise resolving to {latitude, longitude}
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Get top N stations for table display
 * @param stations Array of gas stations
 * @param filters Map filter criteria
 * @returns Top N stations with all necessary data for table display
 */
export function getTopNStations(
  stations: GasStation[],
  filters: MapFilters
): (GasStation & { distance?: number; selectedFuelPrice?: number })[] {
  if (filters.topN === null) return [];

  // Apply all the same filters as filterStationsForMap but get more comprehensive data
  let filteredStations: (GasStation & { distance?: number; selectedFuelPrice?: number })[] = stations.filter(station => {
    // Must have coordinates
    if (!station.latitude || !station.longitude) return false;

    // Fuel type filter
    if (filters.fuelType && filters.fuelType !== 'all') {
      const hasFuelType = station.fuels.some(fuel => fuel.name === filters.fuelType);
      if (!hasFuelType) return false;
    }

    // Max price filter
    if (filters.maxPrice !== null && filters.fuelType && filters.fuelType !== 'all') {
      const fuel = station.fuels.find(f => f.name === filters.fuelType);
      if (!fuel || !fuel.price || fuel.price > filters.maxPrice) return false;
    }

    return true;
  }).map(station => {
    // Calculate distance if user location is available
    let distance: number | undefined;
    if (filters.userLatitude !== null && filters.userLongitude !== null) {
      distance = calculateDistance(
        filters.userLatitude,
        filters.userLongitude,
        station.latitude!,
        station.longitude!
      );
    }

    // Get selected fuel price
    let selectedFuelPrice: number | undefined;
    if (filters.fuelType && filters.fuelType !== 'all') {
      const fuel = station.fuels.find(f => f.name === filters.fuelType);
      selectedFuelPrice = fuel?.price;
    } else if (filters.fuelType === 'all' && station.fuels.length > 0) {
      // When fuelType is 'all', find the cheapest fuel price
      const fuelWithPrice = station.fuels.filter(f => f.price).sort((a, b) => a.price! - b.price!);
      selectedFuelPrice = fuelWithPrice[0]?.price;
    }

    return {
      ...station,
      distance,
      selectedFuelPrice
    };
  });

  // Apply distance filter if specified
  if (filters.maxDistance !== null && filters.userLatitude !== null && filters.userLongitude !== null) {
    filteredStations = filteredStations.filter(station => 
      station.distance !== undefined && station.distance <= filters.maxDistance!
    );
  }

  // Sort based on the selected criteria
  if (filters.topNOrderBy === 'distance' && filters.userLatitude !== null && filters.userLongitude !== null) {
    filteredStations.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  } else if (filters.topNOrderBy === 'price' && filters.fuelType && filters.fuelType !== 'all') {
    filteredStations.sort((a, b) => {
      const priceA = a.selectedFuelPrice || Infinity;
      const priceB = b.selectedFuelPrice || Infinity;
      return priceA - priceB;
    });
  }
  
  // Return only the top N stations
  return filteredStations.slice(0, filters.topN);
}
export function isStationOpen(station: GasStation): boolean {
  if (!station.openingHours) return true; // Assume open if no hours specified

  const now = new Date();
  const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase() as keyof typeof station.openingHours;
  const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

  const daySchedule = station.openingHours[currentDay];
  if (!daySchedule || daySchedule.closed) return false;

  if (!daySchedule.hours || daySchedule.hours.length === 0) return true;

  return daySchedule.hours.some(timeRange => {
    const openTime = parseInt(timeRange.open.replace(':', ''));
    const closeTime = parseInt(timeRange.close.replace(':', ''));
    
    // Handle overnight hours (e.g., 22:00 - 06:00)
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }
    
    return currentTime >= openTime && currentTime <= closeTime;
  });
}