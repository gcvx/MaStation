import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, GasPump, Buildings, Car, Ranking, ArrowSquareOut, CaretUp, CaretDown } from '@phosphor-icons/react';
import { GasStation, MapFilters } from '@/types/station';
import { translations } from '@/lib/translations';

interface TopNStationsTableProps {
  stations: (GasStation & { distance?: number; selectedFuelPrice?: number })[];
  filters: MapFilters;
}

type SortField = 'location' | 'brand' | 'price' | 'distance' | 'services';
type SortDirection = 'asc' | 'desc' | null;

export function TopNStationsTable({ stations, filters }: TopNStationsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

  const formatAddress = (station: GasStation): string => {
    const addressParts: string[] = [];
    if (station.address) {
      addressParts.push(station.address);
    }
    if (station.postalCode && station.city) {
      addressParts.push(`${station.postalCode} ${station.city}`);
    } else if (station.postalCode) {
      addressParts.push(station.postalCode);
    } else if (station.city) {
      addressParts.push(station.city);
    }
    return addressParts.join(', ');
  };

  // Toggle expanded services for a station
  const toggleExpandedServices = (stationId: number) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stationId)) {
        newSet.delete(stationId);
      } else {
        newSet.add(stationId);
      }
      return newSet;
    });
  };

  // Render services with expandable functionality for TopN table
  const renderServicesTopN = (station: GasStation) => {
    if (!station.services || station.services.length === 0) {
      return null;
    }

    const isExpanded = expandedServices.has(Number(station.id));
    const servicesToShow = isExpanded ? station.services : station.services.slice(0, 2);
    const hasMoreServices = station.services.length > 2;

    return (
      <div className="flex flex-wrap gap-1">
        {servicesToShow.map(service => (
          <Badge key={service} variant="outline" className="text-xs">
            {service}
          </Badge>
        ))}
        {hasMoreServices && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
            onClick={() => toggleExpandedServices(Number(station.id))}
          >
            +{station.services.length - 2}
          </Button>
        )}
        {isExpanded && hasMoreServices && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
            onClick={() => toggleExpandedServices(Number(station.id))}
          >
            Voir moins
          </Button>
        )}
      </div>
    );
  };

  // Handle header double-click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Same field clicked - cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // New field clicked - start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort stations based on current sort state
  const sortedStations = useMemo(() => {
    if (!sortField || !sortDirection) {
      return stations;
    }

    return [...stations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'location':
          aValue = formatAddress(a).toLowerCase();
          bValue = formatAddress(b).toLowerCase();
          break;
        case 'brand':
          aValue = a.brand?.toLowerCase() || '';
          bValue = b.brand?.toLowerCase() || '';
          break;
        case 'price':
          aValue = a.selectedFuelPrice ?? Number.MAX_VALUE;
          bValue = b.selectedFuelPrice ?? Number.MAX_VALUE;
          break;
        case 'distance':
          aValue = a.distance ?? Number.MAX_VALUE;
          bValue = b.distance ?? Number.MAX_VALUE;
          break;
        case 'services':
          aValue = a.services?.length || 0;
          bValue = b.services?.length || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  }, [stations, sortField, sortDirection, formatAddress]);

  if (stations.length === 0) {
    return null;
  }

  // Display stations are now the sorted stations
  const displayStations = sortedStations;

  // Component for sortable header
  const SortableHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = "" }) => {
    const isActive = sortField === field;
    const getSortIcon = () => {
      if (!isActive) return null;
      return sortDirection === 'asc' ? 
        <CaretUp size={12} className="text-primary" /> : 
        <CaretDown size={12} className="text-primary" />;
    };

    return (
      <TableHead 
        className={`cursor-pointer select-none hover:bg-muted/50 ${className}`}
        onDoubleClick={() => handleSort(field)}
        title="Double-cliquez pour trier"
      >
        <div className="flex items-center gap-1">
          {children}
          {getSortIcon()}
        </div>
      </TableHead>
    );
  };

  const getFuelTypeLabel = (fuelType: string): string => {
    return translations.fuelTypes[fuelType as keyof typeof translations.fuelTypes] || fuelType;
  };

  // Create Google Maps link for a station
  const getGoogleMapsLink = (station: GasStation) => {
    const addressParts: string[] = [];
    
    if (station.address) {
      addressParts.push(station.address);
    }
    if (station.postalCode && station.city) {
      addressParts.push(`${station.postalCode} ${station.city}`);
    } else if (station.postalCode) {
      addressParts.push(station.postalCode);
    } else if (station.city) {
      addressParts.push(station.city);
    }
    
    const address = addressParts.join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Ranking size={20} />
          {filters.topN === null 
            ? `Stations trouvées (${displayStations.length})`
            : `Top ${filters.topN} stations`
          }
          {filters.fuelType !== 'all' && (
            <Badge variant="secondary" className="ml-2">
              {getFuelTypeLabel(filters.fuelType)}
            </Badge>
          )}
          {filters.topN !== null && (
            <Badge variant="outline" className="ml-2">
              Trié par {filters.topNOrderBy === 'distance' ? 'distance' : 'prix'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <SortableHeader field="location" className="min-w-[200px]">
                  <MapPin size={16} />
                  Localisation
                </SortableHeader>
                <TableHead className="w-12">Maps</TableHead>
                {displayStations.length > 0 && displayStations[0].brand && (
                  <SortableHeader field="brand">Enseigne</SortableHeader>
                )}
                <SortableHeader field="price" className="text-right">
                  <GasPump size={16} />
                  Prix {filters.fuelType !== 'all' ? `(${getFuelTypeLabel(filters.fuelType)})` : ''}
                </SortableHeader>
                {filters.userLatitude !== null && filters.userLongitude !== null && (
                  <SortableHeader field="distance" className="text-right">Distance</SortableHeader>
                )}
                <SortableHeader field="services">Services</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayStations.map((station, index) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        {formatAddress(station)}
                      </div>
                      {station.name && (
                        <div className="text-sm text-muted-foreground">
                          {station.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => window.open(getGoogleMapsLink(station), '_blank')}
                      title="Ouvrir dans Google Maps"
                    >
                      <ArrowSquareOut size={16} />
                    </Button>
                  </TableCell>
                  {station.brand && (
                    <TableCell>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Buildings size={10} />
                        {station.brand}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {station.selectedFuelPrice !== undefined ? (
                      <div className="font-medium text-lg text-foreground">
                        {station.selectedFuelPrice.toFixed(3)}€
                        {filters.fuelType === 'all' && (
                          <div className="text-xs text-muted-foreground">
                            (le moins cher)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  {filters.userLatitude !== null && filters.userLongitude !== null && (
                    <TableCell className="text-right">
                      {station.distance !== undefined ? (
                        <div className="font-medium text-foreground">
                          {station.distance.toFixed(1)} km
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {station.automate24h && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock size={12} className="mr-1" />
                          24h
                        </Badge>
                      )}
                      {station.highway && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Car size={10} />
                          Autoroute
                        </Badge>
                      )}
                      {renderServicesTopN(station)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}