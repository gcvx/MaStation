import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, CaretDown, CaretUp, Funnel, FunnelSimple } from '@phosphor-icons/react';
import { GasStation } from '@/types/station';
import { translations } from '@/lib/translations';
import { parseServices } from '@/lib/utils';

export interface FilterState {
  location: string;
  fuels: string[];
  services: string[];
  features: string[];
}

interface StationFiltersProps {
  stations: GasStation[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function StationFilters({ stations, filters, onFiltersChange }: StationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique values for filter options with optimized performance
  const filterOptions = useMemo(() => {
    console.time('Filter options calculation');
    
    const fuels = new Set<string>();
    const services = new Set<string>();
    const features = new Set<string>();

    stations.forEach(station => {
      // Collect fuels
      station.fuels.forEach(fuel => {
        fuels.add(fuel.name);
      });

      // Collect individual services by splitting combined service strings
      station.services?.forEach(serviceString => {
        const individualServices = parseServices(serviceString);
        individualServices.forEach(service => {
          services.add(service);
        });
      });

      // Collect features
      if (station.highway) features.add('highway');
      if (station.automate24h) features.add('auto24h');
      if (station.freeAccess) features.add('freeAccess');
    });

    const result = {
      fuels: Array.from(fuels).sort(),
      services: Array.from(services).sort(),
      features: Array.from(features).sort()
    };
    
    console.timeEnd('Filter options calculation');
    console.log(`Filter options: ${result.fuels.length} fuels, ${result.services.length} services, ${result.features.length} features`);
    
    return result;
  }, [stations]);

  // Optimized filter update functions with useCallback
  const updateFilter = useCallback((key: keyof FilterState, value: string | string[]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const toggleArrayFilter = useCallback((key: 'fuels' | 'services' | 'features', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray);
  }, [filters, updateFilter]);

  const removeArrayFilterItem = useCallback((key: 'fuels' | 'services' | 'features', value: string) => {
    const newArray = filters[key].filter(item => item !== value);
    updateFilter(key, newArray);
  }, [filters, updateFilter]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      location: '',
      fuels: [],
      services: [],
      features: []
    });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.location || 
    filters.fuels.length > 0 || 
    filters.services.length > 0 || 
    filters.features.length > 0;

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case 'highway': return translations.table.features.highway;
      case 'auto24h': return translations.table.features.auto24h;
      case 'freeAccess': return translations.table.features.freeAccess;
      default: return feature;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto text-foreground hover:text-foreground">
                <Funnel size={16} />
                <span className="font-medium">Filtres</span>
                {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
              </Button>
            </CollapsibleTrigger>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <FunnelSimple size={14} />
                {translations.buttons.clearFilters}
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {translations.filters.location}: {filters.location}
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('location', '')}
                  />
                </Badge>
              )}
              {filters.fuels.map(fuel => (
                <Badge key={fuel} variant="secondary" className="flex items-center gap-1">
                  {translations.fuelTypes[fuel as keyof typeof translations.fuelTypes] || fuel}
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-destructive" 
                    onClick={() => removeArrayFilterItem('fuels', fuel)}
                  />
                </Badge>
              ))}
              {filters.services.map(service => (
                <Badge key={service} variant="secondary" className="flex items-center gap-1">
                  {service}
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-destructive" 
                    onClick={() => removeArrayFilterItem('services', service)}
                  />
                </Badge>
              ))}
              {filters.features.map(feature => (
                <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                  {getFeatureLabel(feature)}
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-destructive" 
                    onClick={() => removeArrayFilterItem('features', feature)}
                  />
                </Badge>
              ))}
            </div>
          )}

          <CollapsibleContent className="space-y-6">
            {/* Location filter */}
            <div className="space-y-2">
              <Label htmlFor="location-filter" className="text-foreground">{translations.filters.location}</Label>
              <Input
                id="location-filter"
                placeholder={translations.filters.locationPlaceholder}
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            {/* Fuels filter */}
            <div className="space-y-2">
              <Label className="text-foreground">{translations.filters.fuels}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filterOptions.fuels.map(fuel => (
                  <div key={fuel} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fuel-${fuel}`}
                      checked={filters.fuels.includes(fuel)}
                      onCheckedChange={() => toggleArrayFilter('fuels', fuel)}
                    />
                    <Label
                      htmlFor={`fuel-${fuel}`}
                      className="text-sm font-normal cursor-pointer text-foreground"
                    >
                      {translations.fuelTypes[fuel as keyof typeof translations.fuelTypes] || fuel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Services filter */}
            {filterOptions.services.length > 0 && (
              <div className="space-y-2">
                <Label className="text-foreground">{translations.filters.services}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {filterOptions.services.map(service => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={filters.services.includes(service)}
                        onCheckedChange={() => toggleArrayFilter('services', service)}
                      />
                      <Label
                        htmlFor={`service-${service}`}
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features filter */}
            {filterOptions.features.length > 0 && (
              <div className="space-y-2">
                <Label className="text-foreground">{translations.filters.features}</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {filterOptions.features.map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={`feature-${feature}`}
                        checked={filters.features.includes(feature)}
                        onCheckedChange={() => toggleArrayFilter('features', feature)}
                      />
                      <Label
                        htmlFor={`feature-${feature}`}
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        {getFeatureLabel(feature)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}