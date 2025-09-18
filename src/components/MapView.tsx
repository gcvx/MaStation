import React, { useMemo } from 'react';
import { StationMap } from '@/components/StationMap';
import { MapFiltersComponent } from '@/components/MapFilters';
import { TopNStationsTable } from '@/components/TopNStationsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from '@phosphor-icons/react';
import { GasStation, MapFilters } from '@/types/station';
import { translations } from '@/lib/translations';
import { filterStationsForMap, getTopNStations } from '@/lib/mapUtils';

interface MapViewProps {
  stations: GasStation[];
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  isLoading?: boolean;
}

export function MapView({ 
  stations, 
  filters, 
  onFiltersChange,
  isLoading = false 
}: MapViewProps) {
  // Get unique fuel types from stations for filter dropdown
  const availableFuels = useMemo(() => {
    const fuels = new Set<string>();
    stations.forEach(station => {
      station.fuels.forEach(fuel => {
        if (fuel.price) { // Only include fuels with prices
          fuels.add(fuel.name);
        }
      });
    });
    return Array.from(fuels).sort();
  }, [stations]);

  // Filter stations based on map filters
  const filteredStations = useMemo(() => {
    return filterStationsForMap(stations, filters);
  }, [stations, filters]);

  // Get top N stations for table display, or filtered stations when topN is null
  const stationsForTable = useMemo(() => {
    if (filters.topN === null) {
      // When topN is null, show filtered stations but add the selectedFuelPrice property
      const enhancedStations = filteredStations.map(station => {
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
          selectedFuelPrice
        };
      });

      // Return all enhanced stations (no limit)
      return enhancedStations;
    }
    return getTopNStations(stations, filters);
  }, [stations, filters, filteredStations]);

  // User location for map display
  const userLocation = useMemo(() => {
    if (filters.userLatitude !== null && filters.userLongitude !== null) {
      return {
        latitude: filters.userLatitude,
        longitude: filters.userLongitude
      };
    }
    return null;
  }, [filters.userLatitude, filters.userLongitude]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={20} />
              {translations.map.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">{translations.buttons.loading}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <MapPin size={24} />
          {translations.map.title}
        </h2>
        <p className="text-muted-foreground mt-2">
          {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} affichée{filteredStations.length !== 1 ? 's' : ''} sur la carte
        </p>
      </div>

      {/* Filters and Map Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <MapFiltersComponent
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableFuels={availableFuels}
          />
        </div>

        {/* Map Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <StationMap
                stations={filteredStations}
                userLocation={userLocation}
                selectedFuelType={filters.fuelType}
                onStationClick={(station) => {
                  console.log('Station clicked:', station);
                  // Could open a detailed modal here in the future
                }}
              />
            </CardContent>
          </Card>

          {/* Results Summary */}
          {filteredStations.length > 0 && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {filteredStations.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Station{filteredStations.length !== 1 ? 's' : ''} trouvée{filteredStations.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {filters.fuelType && filters.fuelType !== 'all' && (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {filteredStations.filter(s => s.fuels.some(f => f.name === filters.fuelType && f.price)).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avec {translations.fuelTypes[filters.fuelType as keyof typeof translations.fuelTypes] || filters.fuelType}
                      </div>
                    </div>
                  )}
                  
                  {userLocation && filteredStations.some(s => s.distance !== undefined) && (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {Math.min(...filteredStations.filter(s => s.distance !== undefined).map(s => s.distance!)).toFixed(1)}km
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Station la plus proche
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results Message */}
          {filteredStations.length === 0 && stations.length > 0 && (
            <Card className="mt-4">
              <CardContent className="p-6 text-center">
                <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aucune station trouvée
                </h3>
                <p className="text-muted-foreground">
                  Essayez d'ajuster vos filtres pour afficher plus de résultats.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Stations Table */}
      <TopNStationsTable stations={stationsForTable} filters={filters} />
    </div>
  );
}