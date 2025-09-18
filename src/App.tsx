import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowClockwise, GasPump, Trash, ChartBar, Rows, MapPin, Database, Broom } from '@phosphor-icons/react';
import { fetchGasStationData } from '@/lib/dataService';
import { StatsCard } from '@/components/StatsCard';
import { StationTable } from '@/components/StationTable';
import { StationFilters, FilterState } from '@/components/StationFilters';
import { StatisticsView } from '@/components/StatisticsView';
import { MapView } from '@/components/MapView';
import { Footer } from '@/components/Footer';
import { GasStation, StationStats, MapFilters } from '@/types/station';
import { translations } from '@/lib/translations';
import { parseServices } from '@/lib/utils';
import { useKV } from '@github/spark/hooks';

function App() {
  const [stations, setStations] = useKV<GasStation[]>('gas-stations', []);
  const [stats, setStats] = useState<StationStats>({ totalStations: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useKV<string>('last-fetch', '');
  const [activeTab, setActiveTab] = useKV<string>('active-tab', 'statistics');
  const [filters, setFilters] = useKV<FilterState>('station-filters', {
    location: '',
    fuels: [] as string[],
    services: [] as string[],
    features: [] as string[]
  });
  const [statsFilters, setStatsFilters] = useKV<{ postalCode: string }>('stats-filters', {
    postalCode: ''
  });
  const [mapFilters, setMapFilters] = useKV<MapFilters>('map-filters', {
    fuelType: 'all',
    maxStations: 50,
    maxPrice: null,
    maxDistance: null,
    location: '',
    userLatitude: null,
    userLongitude: null,
    topN: null,
    topNOrderBy: 'distance'
  });

  // Filtered stations for table view
  const filteredStations = useMemo(() => {
    if (!stations || !filters) return [];
    
    console.time('Station filtering'); // Performance measurement
    
    const result = stations.filter(station => {
      // Location filter (search in complete address: address + postal code + city)
      if (filters.location?.trim()) {
        const searchTerm = filters.location.toLowerCase().trim();
        
        // Build the same address format as displayed in the table
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
        
        const fullAddress = addressParts.join(', ').toLowerCase();
        
        if (!fullAddress.includes(searchTerm)) return false;
      }

      // Fuels filter - optimized with early exit
      if (filters.fuels?.length > 0) {
        const hasMatchingFuel = station.fuels.some(fuel => 
          filters.fuels?.includes(fuel.name)
        );
        if (!hasMatchingFuel) return false;
      }

      // Services filter - AND logic: station must have ALL selected services
      if (filters.services?.length > 0) {
        // Get all individual services for this station using same parsing logic as filters
        const stationServices = new Set<string>();
        station.services?.forEach(serviceString => {
          const individualServices = parseServices(serviceString);
          individualServices.forEach(service => {
            stationServices.add(service);
          });
        });

        // Check if station has ALL selected services (AND logic)
        const hasAllSelectedServices = filters.services.every(selectedService => 
          stationServices.has(selectedService)
        );
        
        if (!hasAllSelectedServices) return false;
      }

      // Features filter - optimized with early exit
      if (filters.features?.length > 0) {
        const hasMatchingFeature = filters.features.some(feature => {
          switch (feature) {
            case 'highway': return station.highway;
            case 'auto24h': return station.automate24h;
            case 'freeAccess': return station.freeAccess;
            default: return false;
          }
        });
        if (!hasMatchingFeature) return false;
      }

      return true;
    });
    
    console.timeEnd('Station filtering'); // Performance measurement
    return result;
  }, [stations, filters]);

  // Filtered stations for statistics view (based on postal code only)
  const statsFilteredStations = useMemo(() => {
    if (!stations || !statsFilters?.postalCode?.trim()) return stations || [];
    
    const postalCodeFilter = statsFilters.postalCode.toLowerCase().trim();
    
    // Support wildcard matching with '*'
    if (postalCodeFilter.includes('*')) {
      const pattern = postalCodeFilter.replace(/\*/g, '');
      return stations.filter(station => 
        station.postalCode?.toLowerCase().startsWith(pattern)
      );
    }
    
    // Exact or partial match
    return stations.filter(station => 
      station.postalCode?.toLowerCase().includes(postalCodeFilter)
    );
  }, [stations, statsFilters?.postalCode]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchGasStationData();
      setStations(data);
      setStats({ totalStations: data.length });
      setLastFetch(new Date().toLocaleString('fr-FR'));
      
      // Clear current service filters to force regeneration with new data
      setFilters(current => ({
        location: current?.location || '',
        fuels: current?.fuels || [],
        features: current?.features || [],
        services: []
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to load gas station data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setStations, setLastFetch, setFilters]);

  const clearData = useCallback(() => {
    setStations([]);
    setStats({ totalStations: 0 });
    setLastFetch('');
  }, [setStations, setLastFetch]);

  const clearFilters = useCallback(() => {
    setFilters({
      location: '',
      fuels: [] as string[],
      services: [] as string[],
      features: [] as string[]
    });
  }, [setFilters]);

  useEffect(() => {
    // Auto-load data if we don't have any stations cached
    if (!stations || stations.length === 0) {
      loadData();
    } else {
      // Update stats if we have cached data
      setStats({ totalStations: stations.length });
    }
  }, [stations?.length, loadData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
                <GasPump className="text-primary" />
                {translations.header.title}
              </h1>
              <p className="text-muted-foreground mt-1">
                {translations.header.description}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={loadData} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <ArrowClockwise className={isLoading ? 'animate-spin' : ''} />
                {translations.buttons.refreshData}
              </Button>
              
              <Button 
                onClick={clearData} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database />
                {translations.buttons.clearCache}
              </Button>

              <Button 
                onClick={clearFilters} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Broom />
                {translations.buttons.clearFilters}
              </Button>
            </div>
          </div>
          
          
          {/* Buy Me a Coffee Button - placed under the main buttons */}
          <div className="flex justify-end">
            <a 
              href="https://www.buymeacoffee.com/gcvx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img 
                src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=gcvx&button_colour=5F7FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" 
                alt="Buy me a coffee"
                className="h-10"
              />
            </a>
          </div>

          {/* Last Update Info */}
          {lastFetch && (
            <div className="text-sm text-muted-foreground">
              {translations.stats.lastUpdated} {lastFetch}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {translations.errors.failedToFetch} {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <ChartBar size={16} />
              {translations.tabs.statistics}
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin size={16} />
              {translations.tabs.map}
            </TabsTrigger>
            <TabsTrigger value="stations" className="flex items-center gap-2">
              <Rows size={16} />
              {translations.tabs.stations}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="space-y-6">
            <StatisticsView 
              stations={statsFilteredStations} 
              isLoading={isLoading}
              filters={statsFilters || { postalCode: '' }}
              onFiltersChange={setStatsFilters}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <MapView 
              stations={stations || []}
              filters={mapFilters || { 
                fuelType: 'all',
                maxStations: 50,
                maxPrice: null,
                maxDistance: null,
                location: '',
                userLatitude: null,
                userLongitude: null,
                topN: null,
                topNOrderBy: 'distance'
              }}
              onFiltersChange={setMapFilters}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="stations" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-1">
              <StatsCard
                stats={{ totalStations: filteredStations.length }}
                isLoading={isLoading}
              />
            </div>

            {/* Filters */}
            <StationFilters
              key={stations?.length || 0} // Force re-render when stations change
              filters={filters || { location: '', fuels: [], services: [], features: [] }}
              onFiltersChange={setFilters}
              stations={stations || []}
            />

            {/* Table */}
            <StationTable stations={filteredStations} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}

export default App;