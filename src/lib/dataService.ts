import JSZip from 'jszip';
import { GasStation, Fuel, OpeningHours, DaySchedule } from '../types/station';

const FUEL_NAMES: Record<string, string> = {
  '1': 'Gazole',
  '2': 'SP95',
  '3': 'E85',
  '4': 'GPLc',
  '5': 'E10',
  '6': 'SP98',
};

export async function fetchGasStationData(): Promise<GasStation[]> {
  console.log('Attempting to fetch gas station data...');
  
  // Try different endpoints with various proxy approaches
  const endpoints = [
    'https://donnees.roulez-eco.fr/opendata/jour', // Daily data (recommended)
    'https://donnees.roulez-eco.fr/opendata/instantane', // Real-time data
  ];
  
  let lastError: Error | null = null;
  
  for (const baseUrl of endpoints) {
    console.log(`\n=== Trying endpoint: ${baseUrl} ===`);
    
    // Try different proxy services and approaches
    const attempts = [
      // Try more reliable CORS proxies first
      { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(baseUrl)}`, proxyName: 'codetabs', headers: {} },
      { url: `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(baseUrl)}`, proxyName: 'htmldriven', headers: {} },
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`, proxyName: 'allorigins', headers: {} },
      // Try a different proxy format
      { url: `https://cors-anywhere.herokuapp.com/${baseUrl}`, proxyName: 'cors-anywhere', headers: { 'X-Requested-With': 'XMLHttpRequest' } },
      // Try direct fetch (may work in some environments)
      { url: baseUrl, proxyName: 'direct', headers: {} },
      // Try with different proxy
      { url: `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`, proxyName: 'corsproxy.io', headers: {} },
    ];
    
    for (const attempt of attempts) {
      try {
        console.log(`\n--- Trying ${attempt.proxyName} proxy ---`);
        console.log(`URL: ${attempt.url}`);
        
        const requestHeaders: Record<string, string> = {
          'Accept': 'application/zip, application/octet-stream, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        };
        
        // Add additional headers if specified
        Object.entries(attempt.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            requestHeaders[key] = value;
          }
        });
        
        console.log('Request headers:', requestHeaders);
        
        const response = await fetch(attempt.url, {
          method: 'GET',
          headers: requestHeaders,
          mode: 'cors',
          cache: 'no-cache',
          redirect: 'follow',
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log(`Response URL: ${response.url}`);
        
        const responseHeaders = Object.fromEntries(response.headers.entries());
        console.log(`Response headers:`, responseHeaders);
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type') || '';
        console.log(`Content-Type: ${contentType}`);
        
        console.log('Fetch successful, processing response...');
        const zipBuffer = await response.arrayBuffer();
        
        if (zipBuffer.byteLength === 0) {
          throw new Error('Empty response received from server');
        }
        
        console.log(`Received data of size: ${zipBuffer.byteLength} bytes`);
        
        // Check if the response is actually a zip file by checking magic bytes
        const uint8Array = new Uint8Array(zipBuffer);
        const isPKZip = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // Check for PK header
        const isZipFileSignature = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B && uint8Array[2] === 0x03 && uint8Array[3] === 0x04;
        
        console.log(`First 4 bytes: ${Array.from(uint8Array.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
        console.log(`Is PK header: ${isPKZip}`);
        console.log(`Is ZIP file signature: ${isZipFileSignature}`);
        
        if (!isPKZip) {
          // Maybe it's HTML error page or text response, let's check
          const textResponse = new TextDecoder().decode(uint8Array.slice(0, 500));
          console.log('Response appears to be text, first 500 chars:', textResponse);
          throw new Error('Response is not a valid zip file. Got text response instead.');
        }
        
        console.log('Processing ZIP file...');
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(zipBuffer);
        
        // Log all files in the zip
        const fileNames = Object.keys(zipContents.files);
        console.log('Files in ZIP archive:', fileNames);
        
        // Find the XML file in the zip
        const xmlFileName = fileNames.find(name => 
          name.toLowerCase().endsWith('.xml') && !zipContents.files[name].dir
        );
        
        if (!xmlFileName) {
          throw new Error(`No XML file found in the zip archive. Available files: ${fileNames.join(', ')}`);
        }
        
        console.log(`Found XML file: ${xmlFileName}`);
        
        // Read the XML file with explicit encoding handling
        // Try to read as binary first to detect encoding issues
        const xmlBuffer = await zipContents.files[xmlFileName].async('uint8array');
        
        // Check for BOM and encoding clues
        let xmlContent: string;
        const bomUTF8 = [0xEF, 0xBB, 0xBF];
        const hasUTF8BOM = xmlBuffer.length >= 3 && 
          xmlBuffer[0] === bomUTF8[0] && 
          xmlBuffer[1] === bomUTF8[1] && 
          xmlBuffer[2] === bomUTF8[2];
        
        if (hasUTF8BOM) {
          console.log('UTF-8 BOM detected, reading as UTF-8');
          xmlContent = new TextDecoder('utf-8').decode(xmlBuffer.slice(3));
        } else {
          // Try to detect encoding from XML declaration
          const firstBytes = xmlBuffer.slice(0, 200);
          const probe = new TextDecoder('utf-8', { fatal: false }).decode(firstBytes);
          
          if (probe.includes('encoding="ISO-8859-1"') || probe.includes('encoding="windows-1252"')) {
            console.log('ISO-8859-1/Windows-1252 encoding detected');
            xmlContent = new TextDecoder('windows-1252').decode(xmlBuffer);
          } else if (probe.includes('encoding="UTF-8"') || probe.includes('utf-8')) {
            console.log('UTF-8 encoding declared');
            xmlContent = new TextDecoder('utf-8').decode(xmlBuffer);
          } else {
            console.log('No explicit encoding found, trying UTF-8 with fallback');
            // Try UTF-8 first, fallback to windows-1252 if that fails
            try {
              xmlContent = new TextDecoder('utf-8', { fatal: true }).decode(xmlBuffer);
            } catch {
              console.log('UTF-8 failed, trying Windows-1252');
              xmlContent = new TextDecoder('windows-1252').decode(xmlBuffer);
            }
          }
        }
        
        if (!xmlContent || xmlContent.trim().length === 0) {
          throw new Error('XML file appears to be empty');
        }
        
        console.log(`XML content length: ${xmlContent.length} characters`);
        console.log(`Successfully fetched data from ${baseUrl} via ${attempt.proxyName}`);
        
        return parseXMLData(xmlContent);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`❌ Failed with ${attempt.proxyName}:`, errorMessage);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue; // Try next attempt
      }
    }
  }
  
  // If all attempts failed, throw a descriptive error
  const finalError = `Failed to fetch data from all endpoints. Last error: ${lastError?.message || 'Unknown error'}. 

Possible solutions:
1. The API might be temporarily down
2. CORS restrictions are blocking all proxy attempts
3. Network connectivity issues
4. The data format might have changed

Please try again in a few minutes or check the browser's developer console for more details.`;
  
  console.error('All fetch attempts failed:', finalError);
  throw new Error(finalError);
}



function parseXMLData(xmlContent: string): GasStation[] {
  console.log('Starting XML parsing...');
  
  // Handle encoding issues that might cause French accents to display as Chinese characters
  // This is often due to Windows-1252 encoding being interpreted as UTF-8
  let fixedXmlContent = xmlContent;
  
  // Fix common encoding issues for French characters
  // Map common UTF-8 mis-interpretation of Windows-1252 encoded French characters
  const encodingFixes: [RegExp, string][] = [
    // Fix double-encoded UTF-8 sequences that appear as Chinese characters
    [/â€™/g, "'"], // Right single quotation mark
    [/â€œ/g, '"'], // Left double quotation mark  
    [/â€/g, '"'], // Right double quotation mark
    [/â€"/g, '–'], // En dash
    [/â€"/g, '—'], // Em dash
    [/Ã©/g, 'é'], // é
    [/Ã¨/g, 'è'], // è
    [/Ãª/g, 'ê'], // ê
    [/Ã¯/g, 'ï'], // ï
    [/Ã®/g, 'î'], // î
    [/Ã´/g, 'ô'], // ô
    [/Ã¹/g, 'ù'], // ù
    [/Ã»/g, 'û'], // û
    [/Ã¼/g, 'ü'], // ü
    [/Ã /g, 'à'], // à
    [/Ã¢/g, 'â'], // â
    [/Ã§/g, 'ç'], // ç
    [/Ã‰/g, 'É'], // É
    [/Ã€/g, 'À'], // À
    [/Ã‡/g, 'Ç'], // Ç
    // Fix specific Chinese character corruptions we've seen
    [/飨/g, 'é'], // 飨 → é (Maréchal)
    [/锚/g, 'à'], // 锚 → à 
    [/豥/g, 'è'], // 豥 → è
    [/蠢/g, 'ç'], // 蠢 → ç
    [/铆/g, 'î'], // 铆 → î
    [/么/g, 'ô'], // 么 → ô
    [/霉/g, 'ù'], // 霉 → ù
    [/赂/g, 'û'], // 赂 → û
    [/露/g, 'ï'], // 露 → ï
    [/脺/g, 'ü'], // 脺 → ü
    [/茅/g, 'é'], // Alternative corruption
    [/脿/g, 'à'], // Alternative corruption
    [/猫/g, 'è'], // Alternative corruption
    [/漏/g, 'ù'], // Alternative corruption
    [/锄/g, 'ç'], // Alternative corruption
  ];
  
  console.log('Applying French character encoding fixes...');
  encodingFixes.forEach(([pattern, replacement]) => {
    const beforeCount = (fixedXmlContent.match(pattern) || []).length;
    fixedXmlContent = fixedXmlContent.replace(pattern, replacement);
    if (beforeCount > 0) {
      console.log(`Fixed ${beforeCount} instances of ${pattern.source} → ${replacement}`);
    }
  });
  
  // Try to fix common XML issues before parsing
  // Fix the specific service/services tag mismatch (multiple patterns)
  fixedXmlContent = fixedXmlContent.replace(/<service([^>]*)>\s*([^<]*)\s*<\/services>/g, '<service$1>$2</service>');
  fixedXmlContent = fixedXmlContent.replace(/<service([^>]*)([^\/])><\/services>/g, '<service$1$2 />'); // Self-closing for empty services
  
  // Fix other common tag mismatches that might occur
  fixedXmlContent = fixedXmlContent.replace(/<(\w+)([^>]*)>\s*([^<]*)\s*<\/(\w+)s>/g, (match, openTag, attrs, content, closeTag) => {
    if (openTag === closeTag) {
      return `<${openTag}${attrs}>${content}</${openTag}>`;
    }
    return match; // Don't change if tags don't match the pattern
  });
  
  // Fix other common XML issues
  fixedXmlContent = fixedXmlContent.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, '&amp;'); // Fix unescaped ampersands
  fixedXmlContent = fixedXmlContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove invalid control characters
  
  console.log('Applied XML fixes for common structural issues and French character encoding');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fixedXmlContent, 'text/xml');
  
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    console.error('XML Parse Error:', parseError.textContent);
    console.error('XML sample around error:', fixedXmlContent.substring(0, 1000));
    
    // Try alternative parsing approach - extract stations manually using regex
    console.log('Attempting fallback parsing using regex...');
    return parseXMLWithFallback(fixedXmlContent);
  }
  
  console.log('XML parsed successfully, analyzing structure...');
  console.log('Root element:', xmlDoc.documentElement?.tagName);
  console.log('Root attributes:', Array.from(xmlDoc.documentElement?.attributes || []).map(attr => `${attr.name}="${attr.value}"`));
  
  const stations: GasStation[] = [];
  
  // Try multiple possible selectors for gas stations in French fuel price data
  const possibleSelectors = [
    'pdv',           // Most common in French fuel data
    'station', 
    'point-de-vente',
    'pdv_id',
    'gasStation',
    'fuel-station'
  ];
  
  let pdvElements: NodeListOf<Element> | null = null;
  let usedSelector = '';
  
  for (const selector of possibleSelectors) {
    pdvElements = xmlDoc.querySelectorAll(selector);
    if (pdvElements.length > 0) {
      usedSelector = selector;
      console.log(`✅ Found ${pdvElements.length} gas stations using selector: "${selector}"`);
      break;
    }
  }
  
  if (!pdvElements || pdvElements.length === 0) {
    // Log the XML structure to help debug
    console.log('No gas station elements found. Analyzing XML structure...');
    console.log('Root element children:', Array.from(xmlDoc.documentElement?.children || []).map(el => el.tagName));
    
    // Try to find any elements that might contain station data
    const allElements = xmlDoc.querySelectorAll('*');
    const elementNames = new Set(Array.from(allElements).map(el => el.tagName));
    console.log('All XML element types found:', Array.from(elementNames).sort());
    
    // Try to find elements with typical fuel station attributes
    const elementsWithIds = xmlDoc.querySelectorAll('[id]');
    const elementsWithLatitude = xmlDoc.querySelectorAll('[latitude], [lat]');
    console.log('Elements with ID attributes:', elementsWithIds.length);
    console.log('Elements with latitude attributes:', elementsWithLatitude.length);
    
    if (elementsWithIds.length > 0) {
      const firstElementWithId = elementsWithIds[0];
      console.log('First element with ID:', firstElementWithId.tagName, 'id=', firstElementWithId.getAttribute('id'));
    }
    
    throw new Error(`No gas station elements found in XML. Available elements: ${Array.from(elementNames).sort().join(', ')}. Root: ${xmlDoc.documentElement?.tagName}`);
  }
  
  console.log(`Processing ${pdvElements.length} stations...`);
  
  // Track IDs to ensure uniqueness
  const usedIds = new Set<string>();
  
  // Log structure of the first few stations for debugging
  if (pdvElements.length > 0) {
    const firstStation = pdvElements[0];
    console.log('First station element:', firstStation.tagName);
    console.log('First station attributes:', Array.from(firstStation.attributes).map(attr => `${attr.name}="${attr.value}"`));
    console.log('First station child elements:', Array.from(firstStation.children).map(el => el.tagName));
  }
  
  pdvElements.forEach((pdv, index) => {
    try {
      // Parse additional attributes that might contain address information
      const roadType = pdv.getAttribute('route') || pdv.getAttribute('road');
      const roadName = pdv.getAttribute('nom_rue') || pdv.getAttribute('nom_voie');
      const streetNumber = pdv.getAttribute('num') || pdv.getAttribute('numero');
      
      // Get address directly from XML element
      const addressElement = pdv.querySelector('adresse');
      const xmlAddress = addressElement ? addressElement.textContent?.trim() : null;
      
      // Build a more complete address, prioritizing XML element content over attributes
      let fullAddress = xmlAddress || 
                       pdv.getAttribute('adresse') || 
                       pdv.getAttribute('address') || 
                       pdv.getAttribute('rue') || 
                       pdv.getAttribute('voie') || 
                       pdv.getAttribute('addr') || 
                       pdv.getAttribute('street');
      
      // If no direct address, try to build from components
      if (!fullAddress && (streetNumber || roadName || roadType)) {
        const addressParts = [streetNumber, roadName, roadType].filter(Boolean);
        if (addressParts.length > 0) {
          fullAddress = addressParts.join(' ');
        }
      }
      
      // Get city from XML element content as well
      const cityElement = pdv.querySelector('ville');
      const xmlCity = cityElement ? cityElement.textContent?.trim() : null;
      
      // Extract basic station information with multiple fallback attribute names
      // Generate a unique station ID to handle duplicates
      let stationId = pdv.getAttribute('id') || 
                      pdv.getAttribute('station_id') || 
                      pdv.getAttribute('code') ||
                      `station-${index}`;
      
      // Ensure ID uniqueness by appending a suffix if needed
      let uniqueId = stationId;
      let suffix = 1;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${stationId}-${suffix}`;
        suffix++;
      }
      usedIds.add(uniqueId);
      
      // Log ID conflicts for debugging
      if (uniqueId !== stationId) {
        console.log(`ID conflict resolved: ${stationId} → ${uniqueId}`);
      }
      
      if (index < 5) { // Log first 5 stations for debugging
        console.log(`Station ${index + 1} extracted address fields:`, {
          xmlAddress: xmlAddress,
          xmlCity: xmlCity,
          addressAttribute: pdv.getAttribute('adresse'),
          postalCode: pdv.getAttribute('cp'), 
          cityAttribute: pdv.getAttribute('ville'),
          finalAddress: fullAddress,
          originalId: pdv.getAttribute('id'),
          finalId: uniqueId
        });
      }
      
      // Parse coordinates and convert from PTV_GEODECIMAL to standard WGS84
      // According to the data documentation, coordinates need to be divided by 100000
      const rawLatitude = parseFloat(pdv.getAttribute('latitude') || 
                                   pdv.getAttribute('lat') || 
                                   pdv.getAttribute('y') || '0');
      const rawLongitude = parseFloat(pdv.getAttribute('longitude') || 
                                    pdv.getAttribute('lng') || 
                                    pdv.getAttribute('lon') || 
                                    pdv.getAttribute('x') || '0');
      
      // Convert coordinates from PTV_GEODECIMAL to standard WGS84 format
      const convertedLatitude = rawLatitude ? rawLatitude / 100000 : undefined;
      const convertedLongitude = rawLongitude ? rawLongitude / 100000 : undefined;
      
      // Log coordinate conversion for first few stations
      if (index < 3 && rawLatitude && rawLongitude) {
        console.log(`Station ${index + 1} coordinate conversion:`, {
          raw: { lat: rawLatitude, lng: rawLongitude },
          converted: { lat: convertedLatitude, lng: convertedLongitude }
        });
      }
      
      const station: GasStation = {
        id: uniqueId,
        latitude: convertedLatitude,
        longitude: convertedLongitude,
        city: xmlCity || 
              pdv.getAttribute('ville') || 
              pdv.getAttribute('city') || 
              pdv.getAttribute('commune') || 
              pdv.getAttribute('localite') || '',
        postalCode: pdv.getAttribute('cp') || 
                   pdv.getAttribute('postal_code') || 
                   pdv.getAttribute('code_postal') || 
                   pdv.getAttribute('codepostal') || undefined,
        address: fullAddress || undefined,
        fuels: [],
        services: [],
        lastUpdate: pdv.getAttribute('maj') || 
                   pdv.getAttribute('last_update') || 
                   pdv.getAttribute('date_maj') || 
                   pdv.getAttribute('update') || undefined,
        // Parse additional boolean attributes
        automate24h: pdv.getAttribute('automate-24-24') === '1' || 
                    pdv.getAttribute('automate_24h') === '1' ||
                    pdv.getAttribute('automate24h') === '1',
        highway: pdv.getAttribute('autoroute') === '1' || 
                pdv.getAttribute('highway') === '1' ||
                pdv.getAttribute('autorute') === '1', 
        freeAccess: pdv.getAttribute('libre-service') === '1' || 
                   pdv.getAttribute('free_access') === '1' ||
                   pdv.getAttribute('libre_service') === '1',
      };
      
      // Parse brand/name information
      const brand = pdv.getAttribute('marque') || 
                   pdv.getAttribute('brand') || 
                   pdv.getAttribute('enseigne') ||
                   pdv.getAttribute('nom');
      if (brand) {
        station.brand = brand;
        station.name = brand;
      }
      
      // Parse fuels with multiple possible structures
      const fuelSelectors = ['prix', 'fuel', 'carburant', 'price', 'essence'];
      let fuelElements: NodeListOf<Element> | null = null;
      
      for (const selector of fuelSelectors) {
        fuelElements = pdv.querySelectorAll(selector);
        if (fuelElements.length > 0) {
          if (index === 0) console.log(`Found fuels using selector: "${selector}"`);
          break;
        }
      }
      
      if (fuelElements) {
        fuelElements.forEach(prix => {
          const fuelId = prix.getAttribute('nom') || 
                        prix.getAttribute('id') || 
                        prix.getAttribute('type') ||
                        prix.getAttribute('name') ||
                        prix.getAttribute('code');
          const fuelPriceStr = prix.getAttribute('valeur') || 
                              prix.getAttribute('price') || 
                              prix.getAttribute('prix') || 
                              prix.getAttribute('value') ||
                              prix.textContent?.trim();
          const fuelPrice = fuelPriceStr ? parseFloat(fuelPriceStr.replace(',', '.')) : 0;
          const fuelUpdate = prix.getAttribute('maj') || 
                           prix.getAttribute('last_update') || 
                           prix.getAttribute('date') ||
                           prix.getAttribute('update');
          
          if (fuelId && fuelPrice > 0) {
            const fuel: Fuel = {
              id: fuelId,
              name: FUEL_NAMES[fuelId] || fuelId,
              price: fuelPrice > 10 ? fuelPrice / 1000 : fuelPrice, // Handle both cents and euros
              lastUpdate: fuelUpdate || undefined,
            };
            station.fuels.push(fuel);
            
            if (index === 0) {
              console.log(`Fuel found: ${fuel.name} = €${fuel.price}`);
            }
          }
        });
      }
      
      // Parse services with multiple possible structures and handle malformed tags
      const serviceSelectors = ['service', 'services', 'equipement', 'equipment'];
      for (const selector of serviceSelectors) {
        const serviceElements = pdv.querySelectorAll(selector);
        serviceElements.forEach(service => {
          const serviceName = service.textContent?.trim() || 
                             service.getAttribute('nom') || 
                             service.getAttribute('name') ||
                             service.getAttribute('type');
          if (serviceName && serviceName.length > 0) {
            station.services?.push(serviceName);
          }
        });
      }
      
      // Also try to extract services using direct child elements that might be named differently
      Array.from(pdv.children).forEach(child => {
        if (child.tagName && child.tagName.toLowerCase().includes('service')) {
          const serviceName = child.textContent?.trim() || 
                             child.getAttribute('nom') ||
                             child.getAttribute('name');
          if (serviceName && serviceName.length > 0 && !station.services?.includes(serviceName)) {
            station.services?.push(serviceName);
          }
        }
      });
      
      // Parse opening hours
      const hourSelectors = ['horaires', 'opening_hours', 'hours', 'horaire'];
      for (const selector of hourSelectors) {
        const horairesElement = pdv.querySelector(selector);
        if (horairesElement) {
          station.openingHours = parseOpeningHours(horairesElement);
          break;
        }
      }
      
      // Only add station if it has meaningful data
      if (station.id && (station.city || station.latitude || station.fuels.length > 0 || station.brand)) {
        stations.push(station);
        
        // Log address information for first few stations to debug
        if (index < 5) {
          console.log(`Station ${index + 1} final address info:`, {
            id: station.id,
            address: station.address,
            postalCode: station.postalCode,
            city: station.city,
            fullAddress: [station.address, station.postalCode, station.city].filter(Boolean).join(', ')
          });
        }
      } else if (index < 5) {
        console.log(`Skipping station ${index + 1} - insufficient data:`, {
          id: station.id,
          city: station.city,
          latitude: station.latitude,
          fuelsCount: station.fuels.length,
          brand: station.brand
        });
      }
    } catch (error) {
      console.warn(`Error parsing station at index ${index}:`, error);
    }
  });
  
  console.log(`✅ Successfully parsed ${stations.length} stations from ${pdvElements.length} XML elements`);
  
  if (stations.length > 0) {
    const sampleStation = stations[0];
    console.log('Sample station data:', {
      id: sampleStation.id,
      address: sampleStation.address,
      postalCode: sampleStation.postalCode,
      city: sampleStation.city,
      fullAddressDisplay: [sampleStation.address, sampleStation.postalCode, sampleStation.city].filter(Boolean).join(', '),
      fuels: sampleStation.fuels.length,
      coordinates: sampleStation.latitude && sampleStation.longitude ? 
        `Yes (${sampleStation.latitude.toFixed(6)}, ${sampleStation.longitude.toFixed(6)})` : 'No',
      services: sampleStation.services?.length || 0
    });
    
    // Check for ID duplicates in final result
    const idCounts = new Map<string, number>();
    stations.forEach(station => {
      const count = idCounts.get(station.id) || 0;
      idCounts.set(station.id, count + 1);
    });
    
    const duplicateIds = Array.from(idCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicateIds.length > 0) {
      console.warn('⚠️  Found duplicate IDs in final station list:', duplicateIds);
    } else {
      console.log('✅ All station IDs are unique');
    }
    
    // Sample of first few station addresses to verify proper parsing
    console.log('First 3 station addresses:');
    stations.slice(0, 3).forEach((station, i) => {
      console.log(`  ${i + 1}. ID: ${station.id} | Address: ${[station.address, station.postalCode, station.city].filter(Boolean).join(', ')}`);
    });
  }
  
  return stations;
}

function parseOpeningHours(horairesElement: Element): OpeningHours {
  const openingHours: OpeningHours = {};
  const dayMapping = {
    'lundi': 'monday',
    'mardi': 'tuesday', 
    'mercredi': 'wednesday',
    'jeudi': 'thursday',
    'vendredi': 'friday',
    'samedi': 'saturday',
    'dimanche': 'sunday',
    // English variants
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday',
    // Abbreviated forms
    'lun': 'monday',
    'mar': 'tuesday',
    'mer': 'wednesday',
    'jeu': 'thursday',
    'ven': 'friday',
    'sam': 'saturday',
    'dim': 'sunday'
  } as const;
  
  // Try multiple possible selectors for day elements
  const daySelectors = ['jour', 'day', 'horaire', 'schedule'];
  let dayElements: NodeListOf<Element> | null = null;
  
  for (const selector of daySelectors) {
    dayElements = horairesElement.querySelectorAll(selector);
    if (dayElements.length > 0) break;
  }
  
  if (!dayElements || dayElements.length === 0) {
    // Try to parse text content directly if no structured elements found
    const textContent = horairesElement.textContent?.trim();
    if (textContent) {
      console.log('Found unstructured opening hours text:', textContent);
    }
    return openingHours;
  }
  
  dayElements.forEach(dayElement => {
    const dayName = dayElement.getAttribute('nom') || 
                   dayElement.getAttribute('name') || 
                   dayElement.getAttribute('day') ||
                   dayElement.tagName.toLowerCase();
    const isClosed = dayElement.getAttribute('ferme') === '1' || 
                    dayElement.getAttribute('closed') === '1' ||
                    dayElement.textContent?.toLowerCase().includes('fermé') ||
                    dayElement.textContent?.toLowerCase().includes('closed');
    
    if (dayName && dayName.toLowerCase() in dayMapping) {
      const dayKey = dayMapping[dayName.toLowerCase() as keyof typeof dayMapping];
      const daySchedule: DaySchedule = {
        closed: isClosed
      };
      
      if (!isClosed) {
        // Try multiple selectors for time ranges
        const timeSelectors = ['horaire', 'hours', 'time', 'schedule'];
        let horaireElements: NodeListOf<Element> | null = null;
        
        for (const selector of timeSelectors) {
          horaireElements = dayElement.querySelectorAll(selector);
          if (horaireElements.length > 0) break;
        }
        
        if (horaireElements && horaireElements.length > 0) {
          const timeRanges = Array.from(horaireElements).map(horaire => ({
            open: horaire.getAttribute('ouverture') || 
                  horaire.getAttribute('open') ||
                  horaire.getAttribute('start') || '',
            close: horaire.getAttribute('fermeture') || 
                   horaire.getAttribute('close') ||
                   horaire.getAttribute('end') || ''
          })).filter(range => range.open && range.close);
          
          if (timeRanges.length > 0) {
            daySchedule.hours = timeRanges;
          }
        }
      }
      
      openingHours[dayKey] = daySchedule;
    }
  });
  
  return openingHours;
}

function parseXMLWithFallback(xmlContent: string): GasStation[] {
  console.log('Using fallback regex-based XML parsing...');
  
  // Apply the same improved encoding fixes as in the main parsing function
  let fixedXmlContent = xmlContent;
  
  const encodingFixes: [RegExp, string][] = [
    // Fix double-encoded UTF-8 sequences that appear as Chinese characters
    [/â€™/g, "'"], // Right single quotation mark
    [/â€œ/g, '"'], // Left double quotation mark  
    [/â€/g, '"'], // Right double quotation mark
    [/â€"/g, '–'], // En dash
    [/â€"/g, '—'], // Em dash
    [/Ã©/g, 'é'], // é
    [/Ã¨/g, 'è'], // è
    [/Ãª/g, 'ê'], // ê
    [/Ã¯/g, 'ï'], // ï
    [/Ã®/g, 'î'], // î
    [/Ã´/g, 'ô'], // ô
    [/Ã¹/g, 'ù'], // ù
    [/Ã»/g, 'û'], // û
    [/Ã¼/g, 'ü'], // ü
    [/Ã /g, 'à'], // à
    [/Ã¢/g, 'â'], // â
    [/Ã§/g, 'ç'], // ç
    [/Ã‰/g, 'É'], // É
    [/Ã€/g, 'À'], // À
    [/Ã‡/g, 'Ç'], // Ç
    // Fix specific Chinese character corruptions we've seen
    [/飨/g, 'é'], // 飨 → é (Maréchal)
    [/锚/g, 'à'], // 锚 → à 
    [/豥/g, 'è'], // 豥 → è
    [/蠢/g, 'ç'], // 蠢 → ç
    [/铆/g, 'î'], // 铆 → î
    [/么/g, 'ô'], // 么 → ô
    [/霉/g, 'ù'], // 霉 → ù
    [/赂/g, 'û'], // 赂 → û
    [/露/g, 'ï'], // 露 → ï
    [/脺/g, 'ü'], // 脺 → ü
    [/茅/g, 'é'], // Alternative corruption
    [/脿/g, 'à'], // Alternative corruption
    [/猫/g, 'è'], // Alternative corruption
    [/漏/g, 'ù'], // Alternative corruption
    [/锄/g, 'ç'], // Alternative corruption
  ];
  
  console.log('Applying French character encoding fixes in fallback parsing...');
  encodingFixes.forEach(([pattern, replacement]) => {
    const beforeCount = (fixedXmlContent.match(pattern) || []).length;
    fixedXmlContent = fixedXmlContent.replace(pattern, replacement);
    if (beforeCount > 0) {
      console.log(`Fixed ${beforeCount} instances of ${pattern.source} → ${replacement}`);
    }
  });
  
  const stations: GasStation[] = [];
  const usedIds = new Set<string>(); // Track IDs for uniqueness
  
  // Use regex to extract station elements even if XML is malformed
  const stationRegex = /<pdv[^>]*>(.*?)<\/pdv>/gs;
  let match;
  let index = 0;
  
  while ((match = stationRegex.exec(fixedXmlContent)) !== null && index < 10000) { // Limit to prevent infinite loop
    try {
      const stationXml = match[0];
      const stationContent = match[1];
      
      // Extract attributes from the opening tag
      const attributeRegex = /(\w+(?:-\w+)*)="([^"]*)"/g;
      const attributes: Record<string, string> = {};
      let attrMatch;
      
      while ((attrMatch = attributeRegex.exec(stationXml)) !== null) {
        attributes[attrMatch[1]] = attrMatch[2];
      }
      
      if (index < 3) {
        console.log(`Station ${index + 1} attributes:`, attributes);
      }
      
      // Extract address from XML content - try both element content and attributes
      const addressMatch = stationContent.match(/<adresse>([^<]+)<\/adresse>/);
      const cityMatch = stationContent.match(/<ville>([^<]+)<\/ville>/);
      const xmlAddress = addressMatch ? addressMatch[1].trim() : null;
      const xmlCity = cityMatch ? cityMatch[1].trim() : null;

      // Parse additional address components
      const roadType = attributes['route'] || attributes['road'];
      const roadName = attributes['nom_rue'] || attributes['nom_voie'];
      const streetNumber = attributes['num'] || attributes['numero'];
      
      // Build address from available components, prioritizing XML content
      let fullAddress = xmlAddress || 
                       attributes['adresse'] || attributes['address'] || attributes['rue'] || 
                       attributes['voie'] || attributes['addr'] || attributes['street'];
      
      if (!fullAddress && (streetNumber || roadName || roadType)) {
        const addressParts = [streetNumber, roadName, roadType].filter(Boolean);
        if (addressParts.length > 0) {
          fullAddress = addressParts.join(' ');
        }
      }

      // Extract basic station information
      // Generate unique ID to handle duplicates
      let stationId = attributes['id'] || `station-${index}`;
      let uniqueId = stationId;
      let suffix = 1;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${stationId}-${suffix}`;
        suffix++;
      }
      usedIds.add(uniqueId);
      
      // Parse coordinates and convert from PTV_GEODECIMAL to standard WGS84
      // According to the data documentation, coordinates need to be divided by 100000
      const rawLatitude = parseFloat(attributes['latitude'] || '0');
      const rawLongitude = parseFloat(attributes['longitude'] || '0');
      
      // Convert coordinates from PTV_GEODECIMAL to standard WGS84 format
      const convertedLatitude = rawLatitude ? rawLatitude / 100000 : undefined;
      const convertedLongitude = rawLongitude ? rawLongitude / 100000 : undefined;
      
      // Log coordinate conversion for first few stations
      if (index < 3 && rawLatitude && rawLongitude) {
        console.log(`Fallback Station ${index + 1} coordinate conversion:`, {
          raw: { lat: rawLatitude, lng: rawLongitude },
          converted: { lat: convertedLatitude, lng: convertedLongitude }
        });
      }
      
      const station: GasStation = {
        id: uniqueId,
        latitude: convertedLatitude,
        longitude: convertedLongitude,
        city: xmlCity || attributes['ville'] || attributes['city'] || '',
        postalCode: attributes['cp'] || attributes['postal_code'] || attributes['code_postal'] || undefined,
        address: fullAddress || undefined,
        fuels: [],
        services: [],
        lastUpdate: attributes['maj'] || undefined,
        automate24h: attributes['automate-24-24'] === '1',
        highway: attributes['autoroute'] === '1',
        freeAccess: attributes['libre-service'] === '1',
      };
      
      // Parse brand/name
      const brand = attributes['marque'];
      if (brand) {
        station.brand = brand;
        station.name = brand;
      }
      
      // Extract fuels using regex
      const fuelRegex = /<prix[^>]*nom="([^"]*)"[^>]*valeur="([^"]*)"[^>]*(?:maj="([^"]*)")?[^>]*\/?>/g;
      let fuelMatch;
      
      while ((fuelMatch = fuelRegex.exec(stationContent)) !== null) {
        const fuelId = fuelMatch[1];
        const fuelPriceStr = fuelMatch[2];
        const fuelUpdate = fuelMatch[3];
        const fuelPrice = parseFloat(fuelPriceStr.replace(',', '.'));
        
        if (fuelId && fuelPrice > 0) {
          const fuel: Fuel = {
            id: fuelId,
            name: FUEL_NAMES[fuelId] || fuelId,
            price: fuelPrice > 10 ? fuelPrice / 1000 : fuelPrice,
            lastUpdate: fuelUpdate || undefined,
          };
          station.fuels.push(fuel);
          
          if (index === 0) {
            console.log(`Fuel found: ${fuel.name} = €${fuel.price}`);
          }
        }
      }
      
      // Extract services using regex - handle both self-closing and regular tags, including malformed ones
      const serviceRegex = /<service[^>]*>([^<]*)<\/service>|<service[^>]*\/>|<service[^>]*>([^<]*)<\/services>/g;
      let serviceMatch;
      
      while ((serviceMatch = serviceRegex.exec(stationContent)) !== null) {
        const serviceName = (serviceMatch[1] || serviceMatch[2])?.trim();
        if (serviceName && serviceName.length > 0) {
          station.services?.push(serviceName);
        }
      }
      
      // Only add station if it has meaningful data
      if (station.id && (station.city || station.latitude || station.fuels.length > 0 || station.brand)) {
        stations.push(station);
      }
      
      index++;
    } catch (error) {
      console.warn(`Error parsing station at index ${index}:`, error);
      index++;
    }
  }
  
  console.log(`✅ Fallback parsing extracted ${stations.length} stations`);
  return stations;
}