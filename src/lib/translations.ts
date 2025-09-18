export const translations = {
  header: {
    title: "Visualiseur de Données des Stations-Service",
    description: "Données de prix de carburant français en temps réel depuis le flux de données ouvertes officiel. Consultez les informations détaillées des stations incluant les coordonnées, heures d'ouverture, services et prix actuels des carburants."
  },
  tabs: {
    stations: "Stations",
    statistics: "Statistiques",
    map: "Carte"
  },
  buttons: {
    refreshData: "Actualiser les Données",
    loading: "Chargement...",
    clearCache: "Vider le Cache",
    clearFilters: "Effacer les Filtres"
  },
  stats: {
    gasStations: "Stations-Service",
    lastUpdated: "Dernière mise à jour :"
  },
  statistics: {
    title: "Statistiques des Prix des Carburants",
    filters: {
      postalCode: "Code Postal",
      postalCodePlaceholder: "Ex: 75* pour Paris, 69* pour Lyon..."
    },
    priceStats: {
      cheapest: "Moins cher",
      mostExpensive: "Plus cher", 
      median: "Médiane",
      average: "Moyenne",
      lastRefresh: "Dernière actualisation"
    },
    charts: {
      title: "Distribution des Prix par Carburant",
      xAxisLabel: "Prix (€/L)",
      yAxisLabel: "Nombre de Stations",
      medianLine: "Prix médian",
      averageLine: "Prix moyen",
      hoverDetails: "Détails de la station"
    },
    fuelOrder: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"]
  },
  map: {
    title: "Carte des Stations-Service",
    filters: {
      title: "Filtres de la Carte",
      fuelType: "Type de Carburant",
      fuelTypePlaceholder: "Sélectionner un carburant...",
      maxStations: "Nombre max de stations",
      maxPrice: "Prix maximum (€/L)",
      maxDistance: "Distance max (km)",
      location: "Adresse de référence",
      locationPlaceholder: "Saisir une adresse ou utiliser ma position...",
      useCurrentLocation: "Utiliser ma position actuelle",
      clearLocation: "Effacer l'adresse"
    },
    station: {
      distanceAway: "à {distance} km",
      openNow: "Ouvert maintenant",
      closedNow: "Fermé",
      priceLabel: "{fuel}: {price}€/L",
      noCoordinates: "Coordonnées non disponibles"
    },
    errors: {
      geolocationNotSupported: "La géolocalisation n'est pas supportée par ce navigateur",
      geolocationDenied: "Accès à la géolocalisation refusé",
      geolocationError: "Erreur lors de la récupération de la position",
      loadingLocation: "Récupération de votre position..."
    }
  },
  table: {
    title: "Stations-Service",
    headers: {
      stationInfo: "Info Station",
      location: "Localisation",
      coordinates: "Coordonnées",
      fuelsAndPrices: "Carburants et Prix",
      services: "Services",
      hoursAndFeatures: "Horaires et Caractéristiques",
      lastUpdate: "Dernière MAJ"
    },
    features: {
      highway: "Autoroute",
      auto24h: "24h Auto",
      freeAccess: "Accès Libre"
    },
    empty: {
      title: "Aucune donnée de station-service disponible",
      subtitle: "Cliquez sur \"Actualiser les Données\" pour charger les dernières informations"
    },
    pagination: {
      resultsPerPage: "Résultats par page",
      showing: "Affichage de",
      to: "à",
      of: "sur",
      results: "résultats",
      previous: "Précédent",
      next: "Suivant"
    },
    closedToday: "Fermé aujourd'hui",
    more: "de plus"
  },
  filters: {
    location: "Localisation",
    locationPlaceholder: "Rechercher par ville, code postal ou adresse...",
    fuels: "Carburants",
    fuelsPlaceholder: "Sélectionner les carburants...",
    services: "Services", 
    servicesPlaceholder: "Sélectionner les services...",
    features: "Caractéristiques",
    featuresPlaceholder: "Sélectionner les caractéristiques..."
  },
  fuelTypes: {
    "1": "Gazole",
    "2": "SP95",
    "3": "E85", 
    "4": "GPLc",
    "5": "E10",
    "6": "SP98",
    "Gazole": "Gazole",
    "SP95": "SP95",
    "E85": "E85",
    "GPLc": "GPLc", 
    "E10": "E10",
    "SP98": "SP98"
  },
  days: {
    monday: "lundi",
    tuesday: "mardi", 
    wednesday: "mercredi",
    thursday: "jeudi",
    friday: "vendredi",
    saturday: "samedi",
    sunday: "dimanche"
  },
  errors: {
    failedToFetch: "Échec de récupération des données :",
    dataLastFetched: "Données récupérées pour la dernière fois :"
  }
};

export type TranslationKey = keyof typeof translations;