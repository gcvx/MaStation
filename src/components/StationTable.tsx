import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis 
} from '@/components/ui/pagination';
import { Clock, MapPin, Drop, Shield, Car, Timer, Buildings, Hash, ArrowUp, ArrowDown, ArrowSquareOut } from '@phosphor-icons/react';
import { GasStation } from '@/types/station';
import { translations } from '@/lib/translations';
import { useKV } from '@github/spark/hooks';

type SortField = 'id' | 'location' | 'brand' | 'city' | 'postalCode';
type SortDirection = 'asc' | 'desc';

interface StationTableProps {
  stations: GasStation[];
  isLoading: boolean;
}

export function StationTable({ stations, isLoading }: StationTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useKV<number>('stations-current-page', 1);
  const [pageSize, setPageSize] = useKV<number>('stations-page-size', 100);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

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

  const pageSizeOptions = [25, 50, 100, 200, 500];

  // Handle header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort stations based on current sort settings
  const sortedStations = useMemo(() => {
    if (!sortField) return stations;

    return [...stations].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'location':
          // Sort by full address
          const aAddress = [a.address, a.postalCode, a.city].filter(Boolean).join(', ');
          const bAddress = [b.address, b.postalCode, b.city].filter(Boolean).join(', ');
          aValue = aAddress.toLowerCase();
          bValue = bAddress.toLowerCase();
          break;
        case 'brand':
          aValue = (a.brand || '').toLowerCase();
          bValue = (b.brand || '').toLowerCase();
          break;
        case 'city':
          aValue = (a.city || '').toLowerCase();
          bValue = (b.city || '').toLowerCase();
          break;
        case 'postalCode':
          aValue = a.postalCode || '';
          bValue = b.postalCode || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'fr', { numeric: true })
          : bValue.localeCompare(aValue, 'fr', { numeric: true });
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [stations, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedStations.length / (pageSize || 100));
  const startIndex = ((currentPage || 1) - 1) * (pageSize || 100);
  const endIndex = startIndex + (pageSize || 100);
  const paginatedStations = sortedStations.slice(startIndex, endIndex);

  // Reset to first page when pageSize changes or when stations change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  // Reset page when filter results change
  useMemo(() => {
    if ((currentPage || 1) > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

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

  // Render services with expandable functionality
  const renderServices = (station: GasStation) => {
    if (!station.services || station.services.length === 0) {
      return <span className="text-muted-foreground">-</span>;
    }

    const isExpanded = expandedServices.has(Number(station.id));
    const servicesToShow = isExpanded ? station.services : station.services.slice(0, 4);
    const hasMoreServices = station.services.length > 4;

    return (
      <div className="text-sm space-y-1">
        <div className="flex flex-wrap gap-1">
          {servicesToShow.map((service, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {service}
            </Badge>
          ))}
        </div>
        {hasMoreServices && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
            onClick={() => toggleExpandedServices(Number(station.id))}
          >
            {isExpanded 
              ? `Voir moins` 
              : `+${station.services.length - 4} ${translations.table.more}`
            }
          </Button>
        )}
      </div>
    );
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">{translations.table.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatOpeningHours = (station: GasStation) => {
    if (!station.openingHours) return null;
    
    // Get current day in French and map to English keys used in the data structure
    const frenchToEnglishDays: Record<string, string> = {
      'lundi': 'monday',
      'mardi': 'tuesday', 
      'mercredi': 'wednesday',
      'jeudi': 'thursday',
      'vendredi': 'friday',
      'samedi': 'saturday',
      'dimanche': 'sunday'
    };
    
    const todayFrench = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const todayEnglish = frenchToEnglishDays[todayFrench] || todayFrench;
    const todaySchedule = station.openingHours[todayEnglish as keyof typeof station.openingHours];
    
    if (!todaySchedule) return null;
    if (todaySchedule.closed) return translations.table.closedToday;
    if (!todaySchedule.hours || todaySchedule.hours.length === 0) return null;
    
    return todaySchedule.hours.map(h => `${h.open}-${h.close}`).join(', ');
  };

  if (stations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">{translations.table.title} (0)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="text-lg mb-2">{translations.table.empty.title}</div>
            <div className="text-sm">{translations.table.empty.subtitle}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-foreground">
          {translations.table.title} ({sortedStations.length.toLocaleString('fr-FR')})
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{translations.table.pagination.resultsPerPage}:</span>
          <Select value={(pageSize || 100).toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="font-semibold p-0 h-auto flex items-center gap-1 hover:bg-transparent"
                    onClick={() => handleSort('id')}
                  >
                    {translations.table.headers.stationInfo}
                    {renderSortIcon('id')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="font-semibold p-0 h-auto flex items-center gap-1 hover:bg-transparent"
                    onClick={() => handleSort('location')}
                  >
                    {translations.table.headers.location}
                    {renderSortIcon('location')}
                  </Button>
                </TableHead>
                <TableHead className="w-12">Maps</TableHead>
                <TableHead>{translations.table.headers.coordinates}</TableHead>
                <TableHead>{translations.table.headers.fuelsAndPrices}</TableHead>
                <TableHead>{translations.table.headers.services}</TableHead>
                <TableHead>{translations.table.headers.hoursAndFeatures}</TableHead>
                <TableHead>{translations.table.headers.lastUpdate}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStations.map((station) => (
                <TableRow key={station.id} className="hover:bg-muted/50">
                  <TableCell>
                    {/* Info Station column displays:
                        1. Station ID (the number you see like 3, 4, 5)
                        2. Brand name if available
                        3. Feature badges (Highway, 24h Auto, Free Access)
                    */}
                    <div className="space-y-1">
                      <div className="font-mono text-sm text-muted-foreground flex items-center gap-1">
                        <Hash size={12} />
                        {station.id}
                      </div>
                      {station.brand && (
                        <div className="font-medium flex items-center gap-1 text-foreground">
                          <Buildings size={12} />
                          {station.brand}
                        </div>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {station.highway && (
                          <Badge variant="secondary" className="text-xs">
                            <Car size={12} className="mr-1" />
                            {translations.table.features.highway}
                          </Badge>
                        )}
                        {station.automate24h && (
                          <Badge variant="secondary" className="text-xs">
                            <Timer size={12} className="mr-1" />
                            {translations.table.features.auto24h}
                          </Badge>
                        )}
                        {station.freeAccess && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield size={12} className="mr-1" />
                            {translations.table.features.freeAccess}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <div className="flex items-center gap-1 flex-1">
                          <MapPin size={14} className="text-muted-foreground" />
                          <div className="max-w-xs">
                            <div className="whitespace-normal break-words text-foreground">
                              {/* Complete address reconstruction */}
{(() => {
                                // Build the most complete address possible
                                const addressParts: string[] = [];
                                
                                // Add street address if available
                                if (station.address) {
                                  addressParts.push(station.address);
                                }
                                
                                // Add postal code and city together if both exist
                                if (station.postalCode && station.city) {
                                  addressParts.push(`${station.postalCode} ${station.city}`);
                                } else if (station.postalCode) {
                                  addressParts.push(station.postalCode);
                                } else if (station.city) {
                                  addressParts.push(station.city);
                                }
                                
                                return addressParts.length > 0 ? addressParts.join(', ') : 'Adresse non disponible';
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => window.open(getGoogleMapsLink(station), '_blank')}
                      title="Ouvrir dans Google Maps"
                    >
                      <ArrowSquareOut size={14} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    {station.latitude && station.longitude ? (
                      <div className="text-xs text-muted-foreground font-mono space-y-1">
                        <div>Lat: {station.latitude.toFixed(6)}</div>
                        <div>Lng: {station.longitude.toFixed(6)}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2 max-w-xs">
                      {station.fuels.map((fuel) => (
                        <div key={fuel.id} className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className="text-xs">
                            <Drop size={12} className="mr-1" />
                            {translations.fuelTypes[fuel.name as keyof typeof translations.fuelTypes] || fuel.name}
                          </Badge>
                          {fuel.price && (
                            <span className="font-mono font-medium">
                              {fuel.price.toFixed(3)}€
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {renderServices(station)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {formatOpeningHours(station) && (
                        <div className="text-sm flex items-center gap-1">
                          <Clock size={12} className="text-muted-foreground" />
                          <span className="font-mono">
                            {formatOpeningHours(station)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {station.lastUpdate ? (
                      <div className="space-y-1">
                        <div>{new Date(station.lastUpdate).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs">
                          {new Date(station.lastUpdate).toLocaleTimeString('fr-FR')}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {translations.table.pagination.showing} {startIndex + 1} {translations.table.pagination.to} {Math.min(endIndex, sortedStations.length)} {translations.table.pagination.of} {sortedStations.length.toLocaleString('fr-FR')} {translations.table.pagination.results}
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, (currentPage || 1) - 1))}
                    className={(currentPage || 1) === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Show first page */}
                {(currentPage || 1) > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setCurrentPage(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {(currentPage || 1) > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}
                
                {/* Show pages around current page */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, (currentPage || 1) - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={pageNum === (currentPage || 1)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {/* Show last page */}
                {(currentPage || 1) < totalPages - 2 && (
                  <>
                    {(currentPage || 1) < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setCurrentPage(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, (currentPage || 1) + 1))}
                    className={(currentPage || 1) === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}