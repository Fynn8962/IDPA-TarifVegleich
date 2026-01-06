// Haupt-Datenstruktur im localStorage
const appData = {
  tariffs: [
    {
      id: "tariff_1",
      provider: "Swisscom",
      name: "Inone Mobile S",
      monthlyBaseFee: 39.00,
      includedMinutes: 100,         // null = unlimited
      pricePerMinute: 0.20,         // nach Inklusivminuten
      includedSMS: 100,             // 0 = unlimited
      pricePerSMS: 0.10,            // nach Inklusivsms
      includedData: 2,              // in GB, 0 = unlimited
      pricePerGB: 10.00,            // nach Inklusivdaten
      notes: "Ideal für Wenignutzer",
      createdAt: "2024-11-24T10:00:00Z"
    },
    {
      id: "tariff_2",
      provider: "Salt",
      name: "Salt Swiss Unlimited",
      monthlyBaseFee: 49.90,
      includedMinutes: null,           // unlimited
      pricePerMinute: 0,
      includedSMS: 0,               // unlimited
      pricePerSMS: 0,
      includedData: 0,              // unlimited
      pricePerGB: 0,
      notes: "Unbegrenzt alles",
      createdAt: "2024-11-24T10:05:00Z"
    },
    {
      id: "tariff_3",
      provider: "Sunrise",
      name: "Sunrise Flex M",
      monthlyBaseFee: 35.00,
      includedMinutes: 300,
      pricePerMinute: 0.15,
      includedSMS: 0,               // unlimited
      pricePerSMS: 0,
      includedData: 5,
      pricePerGB: 8.00,
      notes: "Gutes Preis-Leistungs-Verhältnis",
      createdAt: "2024-11-24T10:10:00Z"
    }
  ],
  
  userProfiles: [
    {
      id: "profile_1",
      name: "Geschäftlich",
      monthlyMinutes: 450,
      monthlySMS: 50,
      monthlyDataGB: 8,
      createdAt: "2024-11-24T11:00:00Z",
      lastUsed: "2024-11-24T14:30:00Z"
    },
    {
      id: "profile_2",
      name: "Privat Wenignutzer",
      monthlyMinutes: 80,
      monthlySMS: 20,
      monthlyDataGB: 2,
      createdAt: "2024-11-24T11:05:00Z",
      lastUsed: "2024-11-23T09:15:00Z"
    },
    {
      id: "profile_3",
      name: "Heavy User",
      monthlyMinutes: 800,
      monthlySMS: 100,
      monthlyDataGB: 25,
      createdAt: "2024-11-24T11:10:00Z",
      lastUsed: "2024-11-20T16:45:00Z"
    }
  ],
  
  settings: {
    currency: "CHF",
    lastSelectedProfile: "profile_1",
    theme: "light"
  }
};

// Berechnungsergebnis (wird nicht gespeichert, nur zur Anzeige)
const calculationResult = {
  profileUsed: {
    name: "Geschäftlich",
    monthlyMinutes: 450,
    monthlySMS: 50,
    monthlyDataGB: 8
  },
  rankings: [
    {
      tariffId: "tariff_3",
      provider: "Sunrise",
      tariffName: "Sunrise Flex M",
      totalCost: 59.00,
      breakdown: {
        baseFee: 35.00,
        minutesCost: 22.50,    // (450-300) * 0.15
        smsCost: 0,            // included
        dataCost: 24.00        // (8-5) * 8.00
      },
      reason: "Beste Balance zwischen Grundgebühr und Zusatzkosten für Ihr Nutzungsprofil"
    },
    {
      tariffId: "tariff_1",
      provider: "Swisscom",
      tariffName: "Inone Mobile S",
      totalCost: 129.00,
      breakdown: {
        baseFee: 39.00,
        minutesCost: 70.00,    // (450-100) * 0.20
        smsCost: 0,            // (50-100) = included
        dataCost: 60.00        // (8-2) * 10.00
      },
      reason: "Inklusivleistungen zu gering für Ihr Nutzungsverhalten"
    },
    {
      tariffId: "tariff_2",
      provider: "Salt",
      tariffName: "Salt Swiss Unlimited",
      totalCost: 49.90,
      breakdown: {
        baseFee: 49.90,
        minutesCost: 0,
        smsCost: 0,
        dataCost: 0
      },
      reason: "Unbegrenzte Nutzung ohne Zusatzkosten - sicher aber nur bei sehr hoher Nutzung optimal"
    }
  ],
  calculatedAt: "2024-11-24T14:30:00Z"
};