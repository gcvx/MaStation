import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { TrendUp, TrendDown, Equals, Calculator, Funnel } from '@phosphor-icons/react';
import { GasStation, Fuel } from '@/types/station';
import { translations } from '@/lib/translations';

interface StatisticsViewProps {
  stations: GasStation[];
  filters: { postalCode: string };
  onFiltersChange: (filters: { postalCode: string }) => void;
  isLoading: boolean;
  lastUpdate?: string;
}

interface FuelStats {
  name: string;
  min: { price: number; station: GasStation };
  max: { price: number; station: GasStation };
  median: number;
  average: number;
  count: number;
}

// Export for other components
export interface FuelStatistics {
  fuelName: string;
  totalStations: number;
  cheapest: { price: number; station: GasStation } | null;
  mostExpensive: { price: number; station: GasStation } | null;
  median: number | null;
  average: number | null;
  priceDistribution: Array<{
    price: number;
    count: number;
    stations: GasStation[];
  }>;
}

interface PriceDistribution {
  price: string;
  count: number;
  percentage: number;
}

export function StatisticsView({ 
  stations, 
  filters, 
  onFiltersChange, 
  isLoading,
  lastUpdate 
}: StatisticsViewProps) {
  const [selectedFuel, setSelectedFuel] = useState<string>('Gazole');

  // Calculate fuel statistics
  const fuelStats = useMemo((): FuelStats[] => {
    if (!stations.length) return [];

    const fuelMap = new Map<string, { prices: { price: number; station: GasStation }[] }>();

    // Collect all fuel prices
    stations.forEach(station => {
      station.fuels.forEach(fuel => {
        if (fuel.price !== undefined) { // Only include fuels with valid prices
          if (!fuelMap.has(fuel.name)) {
            fuelMap.set(fuel.name, { prices: [] });
          }
          fuelMap.get(fuel.name)!.prices.push({ price: fuel.price, station });
        }
      });
    });

    // Calculate statistics for each fuel type
    const stats: FuelStats[] = [];
    
    fuelMap.forEach((data, fuelName) => {
      if (data.prices.length === 0) return;

      const sortedPrices = data.prices.sort((a, b) => a.price - b.price);
      const prices = sortedPrices.map(p => p.price);
      
      const min = sortedPrices[0];
      const max = sortedPrices[sortedPrices.length - 1];
      const medianIndex = Math.floor(sortedPrices.length / 2);
      const median = sortedPrices.length % 2 === 0 
        ? (sortedPrices[medianIndex - 1].price + sortedPrices[medianIndex].price) / 2
        : sortedPrices[medianIndex].price;
      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      stats.push({
        name: fuelName,
        min,
        max,
        median,
        average,
        count: data.prices.length
      });
    });

    // Sort by priority: Gazole first, then GPL last, others alphabetically
    return stats.sort((a, b) => {
      if (a.name === 'Gazole') return -1;
      if (b.name === 'Gazole') return 1;
      if (a.name === 'GPL') return 1;
      if (b.name === 'GPL') return -1;
      return a.name.localeCompare(b.name);
    });
  }, [stations]);

  // Calculate price distribution for selected fuel
  const priceDistribution = useMemo((): PriceDistribution[] => {
    if (!stations.length || !selectedFuel) return [];

    const prices: number[] = [];
    stations.forEach(station => {
      station.fuels.forEach(fuel => {
        if (fuel.name === selectedFuel && fuel.price !== undefined) {
          prices.push(fuel.price);
        }
      });
    });

    if (prices.length === 0) return [];

    // Create price buckets with 0.01 increment
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const bucketSize = 0.01;
    
    const buckets = new Map<string, number>();
    
    // Initialize buckets
    for (let price = Math.floor(minPrice * 100) / 100; price <= Math.ceil(maxPrice * 100) / 100; price += bucketSize) {
      const key = price.toFixed(2);
      buckets.set(key, 0);
    }

    // Count prices in buckets
    prices.forEach(price => {
      const bucketPrice = Math.round(price * 100) / 100;
      const key = bucketPrice.toFixed(2);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    // Convert to array and calculate percentages
    const distribution = Array.from(buckets.entries())
      .map(([price, count]) => ({
        price,
        count,
        percentage: (count / prices.length) * 100
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return distribution;
  }, [stations, selectedFuel]);

  // Get median and average for the selected fuel
  const selectedFuelStats = fuelStats.find(stat => stat.name === selectedFuel);

  const formatPrice = (price: number) => `${price.toFixed(3)}€`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('fr-FR');

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Funnel size={20} />
            Filtres
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Filtrez les données par code postal (utilisez * pour les préfixes, ex: 75*)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="postal-code" className="text-foreground">Code postal</Label>
              <Input
                id="postal-code"
                placeholder="Ex: 75*, 13013, 69000"
                value={filters.postalCode}
                onChange={(e) => onFiltersChange({ postalCode: e.target.value })}
              />
            </div>
            {filters.postalCode && (
              <div className="text-sm text-muted-foreground">
                {stations.length} station(s) trouvée(s)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fuelStats.map((stat) => (
              <Card key={stat.name} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground">{stat.name}</CardTitle>
                    <Badge variant="secondary">{stat.count} stations</Badge>
                  </div>
                  {lastUpdate && (
                    <CardDescription className="text-xs text-muted-foreground">
                      Mis à jour: {formatDate(lastUpdate)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div 
                      className="p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100 transition-colors"
                      title={`Station: ${stat.min.station.name || 'N/A'} - ${stat.min.station.address || ''} ${stat.min.station.postalCode || ''} ${stat.min.station.city || ''}`}
                    >
                      <div className="font-medium text-green-700 flex items-center gap-1">
                        <TrendDown size={12} />
                        Min
                      </div>
                      <div className="text-green-900">{formatPrice(stat.min.price)}</div>
                    </div>
                    <div 
                      className="p-2 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors"
                      title={`Station: ${stat.max.station.name || 'N/A'} - ${stat.max.station.address || ''} ${stat.max.station.postalCode || ''} ${stat.max.station.city || ''}`}
                    >
                      <div className="font-medium text-red-700 flex items-center gap-1">
                        <TrendUp size={12} />
                        Max
                      </div>
                      <div className="text-red-900">{formatPrice(stat.max.price)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-medium text-blue-700 flex items-center gap-1">
                        <Equals size={12} />
                        Médiane
                      </div>
                      <div className="text-blue-900">{formatPrice(stat.median)}</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="font-medium text-purple-700 flex items-center gap-1">
                        <Calculator size={12} />
                        Moyenne
                      </div>
                      <div className="text-purple-900">{formatPrice(stat.average)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fuel Type Selection */}
          {fuelStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Distribution des prix</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sélectionnez un type de carburant pour voir sa distribution de prix
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {fuelStats.map((stat) => (
                    <Badge
                      key={stat.name}
                      variant={selectedFuel === stat.name ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setSelectedFuel(stat.name)}
                    >
                      {stat.name} ({stat.count})
                    </Badge>
                  ))}
                </div>

                {/* Price Distribution Chart */}
                {priceDistribution.length > 0 && selectedFuelStats && (
                  <div className="space-y-4">
                    {/* Custom Legend at the top */}
                    <div className="flex justify-center gap-6 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#2563eb] rounded"></div>
                        <span className="text-sm font-medium">Nombre de stations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[#dc2626] rounded"></div>
                        <span className="text-sm font-medium">Médiane ({selectedFuelStats.median.toFixed(3)}€)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[#ea580c] rounded border-dashed border border-[#ea580c]"></div>
                        <span className="text-sm font-medium">Moyenne ({selectedFuelStats.average.toFixed(3)}€)</span>
                      </div>
                    </div>
                    
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="price" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={Math.max(1, Math.floor(priceDistribution.length / 20))}
                            fontSize={12}
                          />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              name === 'count' ? `${value} stations` : `${value.toFixed(1)}%`,
                              name === 'count' ? 'Nombre de stations' : 'Pourcentage'
                            ]}
                            labelFormatter={(label: string) => `Prix: ${label}€`}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar dataKey="count" fill="#2563eb" radius={[2, 2, 0, 0]} />
                          
                          {/* Median line - solid red */}
                          <ReferenceLine 
                            x={selectedFuelStats.median.toFixed(2)} 
                            stroke="#dc2626" 
                            strokeWidth={3}
                            label={{ 
                              value: `Médiane: ${selectedFuelStats.median.toFixed(3)}€`, 
                              position: "top",
                              offset: 10,
                              style: { 
                                fill: '#dc2626', 
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }
                            }}
                          />
                          
                          {/* Average line - dashed orange */}
                          <ReferenceLine 
                            x={selectedFuelStats.average.toFixed(2)} 
                            stroke="#ea580c" 
                            strokeWidth={3}
                            strokeDasharray="8 4"
                            label={{ 
                              value: `Moyenne: ${selectedFuelStats.average.toFixed(3)}€`, 
                              position: "top",
                              offset: -10,
                              style: { 
                                fill: '#ea580c', 
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {priceDistribution.length === 0 && selectedFuel && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune donnée disponible pour {selectedFuel}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {fuelStats.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucune donnée de carburant disponible. Essayez de modifier vos filtres ou d'actualiser les données.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}