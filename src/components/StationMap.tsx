import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GasStation } from '@/types/station';
import { translations } from '@/lib/translations';
import { isStationOpen } from '@/lib/mapUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Verify leaflet is loaded correctly
if (!L || typeof L.map !== 'function') {
  console.error('Leaflet failed to load properly');
}

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface StationMapProps {
  stations: (GasStation & { distance?: number })[];
  userLocation?: { latitude: number; longitude: number } | null;
  selectedFuelType?: string;
  onStationClick?: (station: GasStation) => void;
}

export function StationMap({ 
  stations, 
  userLocation, 
  selectedFuelType,
  onStationClick 
}: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const isMountedRef = useRef(true);

  // Safe cleanup function
  const safeCleanup = useCallback(() => {
    try {
      // Clear markers first to prevent access to invalid DOM elements
      if (markersRef.current) {
        markersRef.current.clearLayers();
        markersRef.current = null;
      }
      
      // Remove map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off(); // Remove all event listeners
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      if (isMountedRef.current) {
        setIsMapLoaded(false);
      }
    } catch (error) {
      // Silently handle cleanup errors to prevent console spam
      console.warn('Map cleanup error (ignored):', error);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!mapRef.current) return;

    let timeoutId: NodeJS.Timeout;

    try {
      // Initialize map with a small delay to ensure DOM is ready
      timeoutId = setTimeout(() => {
        if (!isMountedRef.current || !mapRef.current) return;

        try {
          if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current, {
              center: [46.227638, 2.213749], // Center of France
              zoom: 6,
              zoomControl: true,
              attributionControl: true
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 18,
            }).addTo(mapInstanceRef.current);

            // Initialize markers layer group
            markersRef.current = L.layerGroup().addTo(mapInstanceRef.current);

            // Mark map as loaded
            if (isMountedRef.current) {
              setIsMapLoaded(true);
              setMapError(null);
            }
          }
        } catch (error) {
          console.error('Error initializing map:', error);
          if (isMountedRef.current) {
            setMapError('Erreur lors du chargement de la carte. Veuillez rafraîchir la page.');
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error setting up map initialization:', error);
      if (isMountedRef.current) {
        setMapError('Erreur lors du chargement de la carte. Veuillez rafraîchir la page.');
      }
    }

    return () => {
      isMountedRef.current = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      safeCleanup();
    };
  }, [safeCleanup]);

  // Update markers when stations change
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded || !isMountedRef.current) return;

    let timeoutId: NodeJS.Timeout;

    try {
      // Add a small delay to ensure the map is fully ready
      timeoutId = setTimeout(() => {
        if (!mapInstanceRef.current || !isMountedRef.current) return;

        // Ensure markers layer group exists
        if (!markersRef.current) {
          markersRef.current = L.layerGroup().addTo(mapInstanceRef.current);
        }

        try {
          // Clear existing markers safely
          markersRef.current.clearLayers();

          // Add user location marker if available
          if (userLocation && markersRef.current) {
            const userIcon = L.divIcon({
              html: `<div style="
                width: 20px; 
                height: 20px; 
                background: #3b82f6; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>`,
              className: 'custom-user-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
              .bindPopup('Votre position')
              .addTo(markersRef.current);
          }

          // Add station markers
          stations.forEach(station => {
            if (!station.latitude || !station.longitude || !markersRef.current || !isMountedRef.current) return;

            // Determine marker color based on fuel availability and open status
            const isOpen = isStationOpen(station);
            const hasSelectedFuel = !selectedFuelType || selectedFuelType === 'all' || 
              station.fuels.some(fuel => fuel.name === selectedFuelType);

            let markerColor = '#10b981'; // Green for open with fuel
            if (!isOpen) markerColor = '#6b7280'; // Gray for closed
            else if (!hasSelectedFuel) markerColor = '#f59e0b'; // Orange for no selected fuel

            const customIcon = L.divIcon({
              html: `<div style="
                width: 16px; 
                height: 16px; 
                background: ${markerColor}; 
                border: 2px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>`,
              className: 'custom-station-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });

            // Create popup content
            const popupContent = createPopupContent(station, selectedFuelType);

            const marker = L.marker([station.latitude, station.longitude], { icon: customIcon })
              .bindPopup(popupContent, { 
                maxWidth: 300,
                className: 'station-popup'
              });

            // Add click handler
            if (onStationClick) {
              marker.on('click', () => onStationClick(station));
            }

            markersRef.current.addLayer(marker);
          });

          // Fit map to show all markers if we have stations
          if (stations.length > 0 && mapInstanceRef.current && isMountedRef.current) {
            const bounds = L.latLngBounds([]);
            
            // Add user location to bounds if available
            if (userLocation) {
              bounds.extend([userLocation.latitude, userLocation.longitude]);
            }
            
            // Add all station locations to bounds
            stations.forEach(station => {
              if (station.latitude && station.longitude) {
                bounds.extend([station.latitude, station.longitude]);
              }
            });

            if (bounds.isValid()) {
              mapInstanceRef.current.fitBounds(bounds, { 
                padding: [20, 20],
                maxZoom: 15
              });
            }
          }
        } catch (error) {
          console.error('Error updating map markers:', error);
          if (isMountedRef.current) {
            setMapError('Erreur lors de la mise à jour de la carte.');
          }
        }
      }, 50);
    } catch (error) {
      console.error('Error setting up marker update:', error);
      if (isMountedRef.current) {
        setMapError('Erreur lors de la mise à jour de la carte.');
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [stations, userLocation, selectedFuelType, onStationClick, isMapLoaded]);

  if (mapError) {
    return (
      <div className="w-full h-96 rounded-lg border border-border">
        <Alert variant="destructive" className="h-full flex items-center justify-center">
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg">
        <h4 className="font-medium text-sm mb-2">Légende</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
            <span>Votre position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
            <span>Station ouverte</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full border border-white"></div>
            <span>Station fermée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full border border-white"></div>
            <span>Carburant non disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function createPopupContent(station: GasStation & { distance?: number }, selectedFuelType?: string): string {
  const isOpen = isStationOpen(station);
  
  // Build address
  const addressParts: string[] = [];
  if (station.address) addressParts.push(station.address);
  if (station.postalCode && station.city) {
    addressParts.push(`${station.postalCode} ${station.city}`);
  } else if (station.postalCode) {
    addressParts.push(station.postalCode);
  } else if (station.city) {
    addressParts.push(station.city);
  }
  const fullAddress = addressParts.join(', ');

  // Build fuel prices section
  let fuelPricesHtml = '';
  if (station.fuels.length > 0) {
    const relevantFuels = selectedFuelType && selectedFuelType !== 'all' 
      ? station.fuels.filter(fuel => fuel.name === selectedFuelType)
      : station.fuels;
    
    fuelPricesHtml = relevantFuels
      .filter(fuel => fuel.price)
      .map(fuel => {
        const fuelName = translations.fuelTypes[fuel.name as keyof typeof translations.fuelTypes] || fuel.name;
        return `<div><strong>${fuelName}:</strong> ${fuel.price!.toFixed(3)}€/L</div>`;
      })
      .join('');
  }

  // Build features section
  const features: string[] = [];
  if (station.automate24h) features.push(translations.table.features.auto24h);
  if (station.highway) features.push(translations.table.features.highway);
  if (station.freeAccess) features.push(translations.table.features.freeAccess);

  return `
    <div class="station-popup-content">
      <div class="font-semibold text-base mb-2">${station.brand || 'Station-Service'}</div>
      
      ${fullAddress ? `<div class="text-sm text-gray-600 mb-2">${fullAddress}</div>` : ''}
      
      ${station.distance !== undefined ? `
        <div class="text-sm text-blue-600 mb-2">
          ${translations.map.station.distanceAway.replace('{distance}', station.distance.toFixed(1))}
        </div>
      ` : ''}
      
      <div class="text-sm mb-2">
        <span class="${isOpen ? 'text-green-600' : 'text-red-600'}">
          ${isOpen ? translations.map.station.openNow : translations.map.station.closedNow}
        </span>
      </div>
      
      ${fuelPricesHtml ? `
        <div class="border-t pt-2 mt-2">
          <div class="font-medium text-sm mb-1">Prix des carburants:</div>
          ${fuelPricesHtml}
        </div>
      ` : ''}
      
      ${features.length > 0 ? `
        <div class="border-t pt-2 mt-2">
          <div class="font-medium text-sm mb-1">Caractéristiques:</div>
          <div class="text-sm">${features.join(', ')}</div>
        </div>
      ` : ''}
    </div>
  `;
}