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

      // Services filter - optimized with early exit
      if (filters.services?.length > 0) {
        const hasMatchingService = filters.services.some(service =>
          station.services?.includes(service)
        );
        if (!hasMatchingService) return false;
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
    
    console.timeEnd('Station filtering');
    console.log(`Filtered ${result.length} stations from ${stations.length} total`);
    
    return result;
  }, [stations, filters]);

  // Filtered stations for statistics view (using postal code filter)
  const statisticsFilteredStations = useMemo(() => {
    if (!stations || !statsFilters) return stations;
    
    if (!statsFilters.postalCode?.trim()) return stations;
    
    const postalCodePattern = statsFilters.postalCode.trim().replace('*', '');
    
    return stations.filter(station => {
      if (!station.postalCode) return false;
      return station.postalCode.startsWith(postalCodePattern);
    });
  }, [stations, statsFilters]);

  // Memoized data loading function to prevent unnecessary re-creates
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchGasStationData();
      setStations(data);
      setStats({
        totalStations: data.length,
        lastUpdate: new Date().toISOString(),
      });
      setLastFetch(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [setStations, setLastFetch]);

  const clearCache = useCallback(() => {
    setStations([]);
    setLastFetch('');
    setStats({ totalStations: 0 });
    setError(null);
    setFilters({
      location: '',
      fuels: [],
      services: [],
      features: []
    });
    setStatsFilters({
      postalCode: ''
    });
    setMapFilters({
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
  }, [setStations, setLastFetch, setFilters, setStatsFilters, setMapFilters]);

  useEffect(() => {
    // Calculate stats from appropriate filtered data based on active tab
    const dataToAnalyze = activeTab === 'statistics' ? statisticsFilteredStations : filteredStations;
    
    if (stations && stations.length > 0 && dataToAnalyze) {
      setStats({
        totalStations: dataToAnalyze.length,
        lastUpdate: lastFetch || undefined,
      });
    } else {
      // Reset stats when no data
      setStats({ totalStations: 0 });
    }
  }, [stations, filteredStations, statisticsFilteredStations, lastFetch, activeTab]);

  // Auto-load data on startup if none exists
  useEffect(() => {
    if (!stations || stations.length === 0) {
      console.log('No cached data found, loading fresh data...');
      loadData();
    }
  }, [stations, loadData]);

  // Check data freshness and suggest refresh if data is old
  const dataAge = useMemo(() => {
    if (!lastFetch) return null;
    const ageInHours = (Date.now() - new Date(lastFetch).getTime()) / (1000 * 60 * 60);
    return ageInHours;
  }, [lastFetch]);

  const isDataStale = dataAge !== null && dataAge > 6; // Consider data stale after 6 hours

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <GasPump size={32} className="text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {translations.header.title}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {translations.header.description}
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center gap-2">
          <Button 
            onClick={loadData} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <ArrowClockwise 
              size={16} 
              className={isLoading ? 'animate-spin' : ''} 
            />
            {isLoading ? translations.buttons.loading : translations.buttons.refreshData}
          </Button>
            <Button 
              onClick={clearCache} 
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Broom size={16} />
              {translations.buttons.clearCache}
            </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {translations.errors.failedToFetch} {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Section */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <StatsCard stats={stats} isLoading={isLoading} />
          </div>
        </div>

        {/* Data freshness indicator and suggestions */}
        {lastFetch && !isLoading && (
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              {translations.errors.dataLastFetched} {new Date(lastFetch).toLocaleString('fr-FR')}
            </div>
            {isDataStale && (
              <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-3 py-2 max-w-md mx-auto">
                💡 Vos données ont plus de {Math.floor(dataAge!)} heures. 
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={loadData}
                  className="ml-1 h-auto p-0 text-orange-700 underline"
                >
                  Actualiser maintenant
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="stations" className="flex items-center gap-2">
              <Rows size={16} />
              {translations.tabs.stations}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <ChartBar size={16} />
              {translations.tabs.statistics}
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin size={16} />
              {translations.tabs.map}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stations" className="space-y-6">
            {/* Station Filters Section */}
            {stations && stations.length > 0 && (
              <div className="w-full">
                <StationFilters
                  stations={stations}
                  filters={filters || { location: '', fuels: [], services: [], features: [] }}
                  onFiltersChange={setFilters}
                />
              </div>
            )}

            {/* Station Table Section */}
            <div className="w-full">
              <StationTable stations={filteredStations} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <StatisticsView 
              stations={statisticsFilteredStations || []}
              filters={statsFilters || { postalCode: '' }}
              onFiltersChange={setStatsFilters}
              isLoading={isLoading}
              lastUpdate={lastFetch}
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
        </Tabs>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;