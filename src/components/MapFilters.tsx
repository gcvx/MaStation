import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { MapPin, GpsFix, X, MagnifyingGlass, Sliders } from '@phosphor-icons/react';
import { MapFilters } from '@/types/station';
import { translations } from '@/lib/translations';
import { getCurrentLocation } from '@/lib/mapUtils';
import { geocodeAddress } from '@/lib/geocoding';

interface MapFiltersProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  availableFuels: string[];
  isLoadingLocation?: boolean;
}

export function MapFiltersComponent({ 
  filters, 
  onFiltersChange, 
  availableFuels,
  isLoadingLocation = false
}: MapFiltersProps) {
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [isGeocodingLocation, setIsGeocodingLocation] = React.useState(false);
  const [locationInputValue, setLocationInputValue] = React.useState(filters.location || '');

  // Sync locationInputValue with filters.location changes
  React.useEffect(() => {
    setLocationInputValue(filters.location || '');
  }, [filters.location]);

  const handleLocationRequest = async () => {
    setLocationError(null);
    try {
      const location = await getCurrentLocation();
      onFiltersChange({
        ...filters,
        userLatitude: location.latitude,
        userLongitude: location.longitude,
        location: '' // Clear the location text when using current position
      });
      setLocationInputValue('');
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(translations.map.errors.geolocationDenied);
            break;
          case error.POSITION_UNAVAILABLE:
          case error.TIMEOUT:
            setLocationError(translations.map.errors.geolocationError);
            break;
          default:
            setLocationError(translations.map.errors.geolocationError);
        }
      } else {
        setLocationError(translations.map.errors.geolocationNotSupported);
      }
    }
  };

  const handleAddressGeocode = async () => {
    if (!locationInputValue.trim()) return;
    
    setIsGeocodingLocation(true);
    setLocationError(null);
    
    try {
      const result = await geocodeAddress(locationInputValue);
      if (result) {
        onFiltersChange({
          ...filters,
          userLatitude: result.latitude,
          userLongitude: result.longitude,
          location: result.displayName
        });
        setLocationInputValue(result.displayName);
      } else {
        setLocationError('Aucun résultat trouvé pour cette adresse');
      }
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Erreur lors de la géolocalisation');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressGeocode();
    }
  };

  const clearLocation = () => {
    onFiltersChange({
      ...filters,
      userLatitude: null,
      userLongitude: null,
      location: ''
    });
    setLocationInputValue('');
    setLocationError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sliders size={20} />
          {translations.map.filters.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-foreground">
        {/* Fuel Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="fuel-type" className="text-foreground">{translations.map.filters.fuelType}</Label>
          <Select
            value={filters.fuelType}
            onValueChange={(value) => onFiltersChange({ ...filters, fuelType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={translations.map.filters.fuelTypePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les carburants</SelectItem>
              {availableFuels.map(fuel => (
                <SelectItem key={fuel} value={fuel}>
                  {translations.fuelTypes[fuel as keyof typeof translations.fuelTypes] || fuel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground">{translations.map.filters.location}</Label>
          
          {/* Show current location status */}
          {filters.userLatitude !== null && filters.userLongitude !== null && (
            <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1">
              📍 Position utilisée ({filters.userLatitude.toFixed(4)}, {filters.userLongitude.toFixed(4)})
              {filters.location && (
                <div className="mt-1 font-medium">{filters.location}</div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              id="location"
              placeholder={translations.map.filters.locationPlaceholder}
              value={locationInputValue}
              onChange={(e) => setLocationInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddressGeocode}
              disabled={isGeocodingLocation || !locationInputValue.trim()}
              className="px-2"
            >
              <MagnifyingGlass size={16} className={isGeocodingLocation ? 'animate-spin' : ''} />
            </Button>
            {(filters.location || locationInputValue) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearLocation}
                className="px-2"
              >
                <X size={16} />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLocationRequest}
              disabled={isLoadingLocation}
              className="flex-1 flex items-center gap-2"
            >
              <GpsFix size={16} className={isLoadingLocation ? 'animate-spin' : ''} />
              {isLoadingLocation 
                ? translations.map.errors.loadingLocation
                : translations.map.filters.useCurrentLocation
              }
            </Button>
          </div>
          {locationError && (
            <p className="text-sm text-destructive">{locationError}</p>
          )}
        </div>

        <Separator />

        {/* Distance Filter (Slider) */}
        {(filters.userLatitude !== null && filters.userLongitude !== null) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Distance maximale</Label>
                <div className="flex items-center gap-2">
                  {filters.maxDistance !== null ? (
                    <span className="text-sm text-muted-foreground">{filters.maxDistance} km</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Désactivé</span>
                  )}
                  {filters.maxDistance !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFiltersChange({ ...filters, maxDistance: null })}
                      className="px-2 h-6"
                    >
                      <X size={12} />
                    </Button>
                  )}
                </div>
              </div>
              <div className="px-1">
                <Slider
                  value={[filters.maxDistance || 1]}
                  onValueChange={([value]) => onFiltersChange({ ...filters, maxDistance: value })}
                  max={1000}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 km</span>
                  <span>1000 km</span>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Max Stations Filter */}
        <div className="space-y-2">
          <Label htmlFor="max-stations" className="text-foreground">{translations.map.filters.maxStations}</Label>
          <Select
            value={filters.maxStations?.toString() || "all"}
            onValueChange={(value) => onFiltersChange({ 
              ...filters, 
              maxStations: value === "all" ? null : parseInt(value) 
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les stations</SelectItem>
              <SelectItem value="25">25 stations</SelectItem>
              <SelectItem value="50">50 stations</SelectItem>
              <SelectItem value="100">100 stations</SelectItem>
              <SelectItem value="200">200 stations</SelectItem>
              <SelectItem value="500">500 stations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Price Filter */}
        <div className="space-y-2">
          <Label htmlFor="max-price" className="text-foreground">{translations.map.filters.maxPrice}</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="max-price"
              type="number"
              step="0.01"
              min="0"
              max="5"
              placeholder="Ex: 1.60"
              value={filters.maxPrice || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                maxPrice: e.target.value ? parseFloat(e.target.value) : null 
              })}
              className="flex-1"
            />
            {filters.maxPrice !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, maxPrice: null })}
                className="px-2"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Top N Stations Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Top stations</Label>
            <div className="flex items-center gap-2">
              {filters.topN !== null ? (
                <span className="text-sm text-muted-foreground">Top {filters.topN}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Désactivé</span>
              )}
              {filters.topN !== null && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, topN: null })}
                  className="px-2 h-6"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
          </div>
          
          {/* Top N Slider */}
          <div className="px-1">
            <Slider
              value={[filters.topN || 1]}
              onValueChange={([value]) => onFiltersChange({ ...filters, topN: value })}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>100</span>
            </div>
          </div>

          {/* Order By Select */}
          {filters.topN !== null && (
            <div className="space-y-2">
              <Label className="text-foreground">Trier par</Label>
              <Select
                value={filters.topNOrderBy}
                onValueChange={(value: 'distance' | 'price') => 
                  onFiltersChange({ ...filters, topNOrderBy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}