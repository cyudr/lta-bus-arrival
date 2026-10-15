import { BusStop, BusRoute } from '../types/bus';

export const SINGAPORE_BUS_STOPS: BusStop[] = [
  // Orchard / Somerset Corridor
  {
    BusStopCode: '09048',
    RoadName: 'Orchard Rd',
    Description: 'Opp Orchard Stn / ION Orchard',
    Latitude: 1.3044,
    Longitude: 103.8318,
    mrtConnections: ['NS22', 'TE14'],
    services: ['7', '14', '16', '36', '65', '106', '111', '124', '174', '175', '190', '502'],
  },
  {
    BusStopCode: '09047',
    RoadName: 'Orchard Rd',
    Description: 'Orchard Stn / Lucky Plaza',
    Latitude: 1.3039,
    Longitude: 103.8341,
    mrtConnections: ['NS22', 'TE14'],
    services: ['7', '14', '16', '36', '65', '106', '111', '124', '174', '175', '190', '502'],
  },
  {
    BusStopCode: '08138',
    RoadName: 'Orchard Rd',
    Description: 'Somerset Stn / 313@Somerset',
    Latitude: 1.3009,
    Longitude: 103.8385,
    mrtConnections: ['NS23'],
    services: ['7', '14', '16', '36', '65', '106', '111', '124', '174', '175', '190'],
  },
  {
    BusStopCode: '08057',
    RoadName: 'Orchard Rd',
    Description: 'Dhoby Ghaut Stn Exit B',
    Latitude: 1.2993,
    Longitude: 103.8453,
    mrtConnections: ['NS24', 'NE6', 'CC1'],
    services: ['7', '14', '16', '36', '65', '106', '111', '124', '174', '175', '190', '857'],
  },
  {
    BusStopCode: '08079',
    RoadName: 'Bras Basah Rd',
    Description: 'Bencoolen Stn Exit B',
    Latitude: 1.2981,
    Longitude: 103.8504,
    mrtConnections: ['DT21'],
    services: ['7', '14', '16', '36', '111', '174', '175'],
  },

  // Bugis / Victoria St Corridor
  {
    BusStopCode: '01012',
    RoadName: 'Victoria St',
    Description: 'Hotel Grand Pacific',
    Latitude: 1.2968,
    Longitude: 103.8530,
    mrtConnections: ['DT21', 'CC2'],
    services: ['7', '12', '14', '16', '36', '175', '190', '857'],
  },
  {
    BusStopCode: '01112',
    RoadName: 'Victoria St',
    Description: 'Bugis Stn Exit A / Bugis Junction',
    Latitude: 1.3005,
    Longitude: 103.8558,
    mrtConnections: ['EW12', 'DT14'],
    services: ['7', '12', '61', '63', '80', '145', '175', '190', '851', '857', '960'],
  },
  {
    BusStopCode: '01113',
    RoadName: 'Victoria St',
    Description: 'Bugis Stn Exit B / Bugis Street',
    Latitude: 1.3011,
    Longitude: 103.8552,
    mrtConnections: ['EW12', 'DT14'],
    services: ['2', '12', '32', '33', '130', '133', '145', '197', '851', '960'],
  },
  {
    BusStopCode: '01119',
    RoadName: 'Victoria St',
    Description: 'Opp Bugis Stn Exit C',
    Latitude: 1.3018,
    Longitude: 103.8569,
    mrtConnections: ['EW12', 'DT14'],
    services: ['7', '12', '61', '145', '175', '190', '851', '857'],
  },

  // City Hall / Civic District / Marina Bay
  {
    BusStopCode: '04119',
    RoadName: 'North Bridge Rd',
    Description: 'City Hall Stn Exit B',
    Latitude: 1.2929,
    Longitude: 103.8519,
    mrtConnections: ['NS25', 'EW13'],
    services: ['61', '124', '145', '166', '174', '190', '851'],
  },
  {
    BusStopCode: '02049',
    RoadName: 'Raffles Ave',
    Description: 'The Esplanade / Esplanade Mall',
    Latitude: 1.2898,
    Longitude: 103.8563,
    mrtConnections: ['CC3'],
    services: ['36', '56', '70M', '77', '97', '106', '111', '133', '195'],
  },
  {
    BusStopCode: '03211',
    RoadName: 'Bayfront Ave',
    Description: 'Marina Bay Sands Hotel',
    Latitude: 1.2834,
    Longitude: 103.8607,
    mrtConnections: ['DT16', 'CE1'],
    services: ['97', '106', '133', '502', '518'],
  },
  {
    BusStopCode: '03239',
    RoadName: 'Bayfront Ave',
    Description: 'Bayfront Stn Exit B / Sands Expo',
    Latitude: 1.2818,
    Longitude: 103.8588,
    mrtConnections: ['DT16', 'CE1'],
    services: ['97', '106', '133', '502', '518'],
  },
  {
    BusStopCode: '03019',
    RoadName: 'Collyer Quay',
    Description: 'Ocean Financial Centre / Raffles Place Stn',
    Latitude: 1.2839,
    Longitude: 103.8515,
    mrtConnections: ['NS26', 'EW14'],
    services: ['10', '57', '70', '100', '107', '130', '131', '167', '196'],
  },
  {
    BusStopCode: '03059',
    RoadName: 'Robinson Rd',
    Description: 'Aft Capital Tower / Tanjong Pagar Stn',
    Latitude: 1.2774,
    Longitude: 103.8475,
    mrtConnections: ['EW15'],
    services: ['10', '70', '97', '100', '106', '130', '133', '196'],
  },

  // Chinatown / Clarke Quay / Outram
  {
    BusStopCode: '05013',
    RoadName: 'Eu Tong Sen St',
    Description: 'Chinatown Stn Exit C / People\'s Park Complex',
    Latitude: 1.2843,
    Longitude: 103.8441,
    mrtConnections: ['NE4', 'DT19'],
    services: ['2', '12', '33', '54', '61', '124', '143', '147', '190'],
  },
  {
    BusStopCode: '05022',
    RoadName: 'New Bridge Rd',
    Description: 'Chinatown Stn Exit E / Chinatown Point',
    Latitude: 1.2858,
    Longitude: 103.8453,
    mrtConnections: ['NE4', 'DT19'],
    services: ['2', '12', '33', '54', '61', '124', '143', '147', '190'],
  },
  {
    BusStopCode: '04222',
    RoadName: 'Eu Tong Sen St',
    Description: 'Clarke Quay Stn Exit E / Clarke Quay Central',
    Latitude: 1.2885,
    Longitude: 103.8468,
    mrtConnections: ['NE5'],
    services: ['2', '12', '33', '54', '147', '190'],
  },
  {
    BusStopCode: '05019',
    RoadName: 'Eu Tong Sen St',
    Description: 'Outram Park Stn Exit 7',
    Latitude: 1.2801,
    Longitude: 103.8402,
    mrtConnections: ['EW16', 'NE3', 'TE17'],
    services: ['54', '124', '143', '147', '190'],
  },

  // Little India / Rochor
  {
    BusStopCode: '40019',
    RoadName: 'Serangoon Rd',
    Description: 'Little India Stn Exit E / Tekka Ctr',
    Latitude: 1.3068,
    Longitude: 103.8509,
    mrtConnections: ['NE7', 'DT12'],
    services: ['23', '64', '65', '66', '67', '131', '139', '147', '857'],
  },
  {
    BusStopCode: '07539',
    RoadName: 'Rochor Canal Rd',
    Description: 'Rochor Stn Exit A / Sim Lim Sq',
    Latitude: 1.3038,
    Longitude: 103.8533,
    mrtConnections: ['DT13'],
    services: ['23', '67', '170', '851', '857', '960'],
  },

  // Jurong East / Clementi (West)
  {
    BusStopCode: '28009',
    RoadName: 'Jurong Gateway Rd',
    Description: 'Jurong East Temp Int',
    Latitude: 1.3331,
    Longitude: 103.7423,
    mrtConnections: ['NS1', 'EW24', 'JE5'],
    services: ['51', '52', '66', '78', '79', '97', '105', '143', '160', '197', '502'],
  },
  {
    BusStopCode: '28201',
    RoadName: 'Jurong East Ctrl',
    Description: 'Jem / Opp Westgate',
    Latitude: 1.3345,
    Longitude: 103.7438,
    mrtConnections: ['NS1', 'EW24'],
    services: ['52', '105', '183', '188', '502'],
  },
  {
    BusStopCode: '17179',
    RoadName: 'Clementi Ave 3',
    Description: 'Clementi Int / Clementi Mall',
    Latitude: 1.3151,
    Longitude: 103.7652,
    mrtConnections: ['EW23'],
    services: ['7', '14', '52', '96', '99', '105', '106', '147', '156', '165', '166', '175', '196'],
  },
  {
    BusStopCode: '11389',
    RoadName: 'Holland Rd',
    Description: 'Holland Village Stn Exit B',
    Latitude: 1.3115,
    Longitude: 103.7963,
    mrtConnections: ['CC21'],
    services: ['7', '61', '75', '77', '106', '165', '970'],
  },

  // Bishan / Ang Mo Kio / Toa Payoh (Central / North)
  {
    BusStopCode: '53009',
    RoadName: 'Bishan St 13',
    Description: 'Bishan Bus Interchange / Junction 8',
    Latitude: 1.3508,
    Longitude: 103.8481,
    mrtConnections: ['NS17', 'CC15'],
    services: ['50', '52', '53', '54', '55', '56', '57', '58', '59', '410G', '410W'],
  },
  {
    BusStopCode: '54009',
    RoadName: 'Ang Mo Kio Ave 8',
    Description: 'Ang Mo Kio Int / AMK Hub',
    Latitude: 1.3698,
    Longitude: 103.8496,
    mrtConnections: ['NS16', 'CR11'],
    services: ['22', '24', '25', '73', '86', '130', '133', '135', '136', '138', '166', '169'],
  },
  {
    BusStopCode: '52009',
    RoadName: 'Lor 6 Toa Payoh',
    Description: 'Toa Payoh Int / HDB Hub',
    Latitude: 1.3326,
    Longitude: 103.8478,
    mrtConnections: ['NS19'],
    services: ['8', '26', '28', '31', '73', '88', '90', '139', '141', '142', '143', '145', '155', '157'],
  },

  // Tampines / Bedok (East)
  {
    BusStopCode: '75009',
    RoadName: 'Tampines Ave 4',
    Description: 'Tampines Int / Tampines 1 / Mall',
    Latitude: 1.3526,
    Longitude: 103.9452,
    mrtConnections: ['EW2', 'DT32'],
    services: ['3', '4', '8', '10', '19', '20', '23', '28', '29', '31', '37', '38', '65', '67', '72', '81'],
  },
  {
    BusStopCode: '84009',
    RoadName: 'Bedok North Ave 1',
    Description: 'Bedok Int / Bedok Mall',
    Latitude: 1.3240,
    Longitude: 103.9300,
    mrtConnections: ['EW5'],
    services: ['7', '9', '14', '16', '17', '18', '26', '30', '35', '40', '60', '66', '69', '87', '168', '196', '197'],
  },

  // Woodlands (North)
  {
    BusStopCode: '46009',
    RoadName: 'Woodlands Sq',
    Description: 'Woodlands Integrated Transport Hub / Causeway Point',
    Latitude: 1.4361,
    Longitude: 103.7865,
    mrtConnections: ['NS9', 'TE2'],
    services: ['161', '168', '169', '178', '187', '856', '900', '901', '903', '911', '912', '913', '925', '960', '961', '963', '965', '969'],
  },

  // HarbourFront / Bukit Merah (South)
  {
    BusStopCode: '14119',
    RoadName: 'Telok Blangah Rd',
    Description: 'HarbourFront Stn / VivoCity',
    Latitude: 1.2653,
    Longitude: 103.8215,
    mrtConnections: ['NE1', 'CC29'],
    services: ['10', '30', '57', '61', '65', '80', '97', '100', '131', '143', '145', '166', '855', '963'],
  },
];

export const POPULAR_BUS_SERVICES: BusRoute[] = [
  {
    ServiceNo: '190',
    Operator: 'SMRT',
    Direction: 1,
    OriginCode: '44009',
    OriginName: 'Choa Chu Kang Int',
    DestinationCode: '10009',
    DestinationName: 'Kampong Bahru Ter',
    Category: 'Trunk',
    OperatingHours: {
      firstBusWeekday: '05:30',
      lastBusWeekday: '23:30',
      firstBusWeekend: '05:45',
      lastBusWeekend: '23:30',
    },
    Stops: [
      { StopSequence: 1, BusStopCode: '09048', Distance: 15.2 }, // Opp Orchard Stn
      { StopSequence: 2, BusStopCode: '09047', Distance: 15.7 }, // Orchard Stn / Lucky Plaza
      { StopSequence: 3, BusStopCode: '08138', Distance: 16.4 }, // Somerset Stn
      { StopSequence: 4, BusStopCode: '08057', Distance: 17.2 }, // Dhoby Ghaut Stn
      { StopSequence: 5, BusStopCode: '01012', Distance: 18.1 }, // Hotel Grand Pacific
      { StopSequence: 6, BusStopCode: '01112', Distance: 18.7 }, // Bugis Stn Exit A
      { StopSequence: 7, BusStopCode: '04119', Distance: 19.8 }, // City Hall Stn
      { StopSequence: 8, BusStopCode: '04222', Distance: 20.6 }, // Clarke Quay Stn
      { StopSequence: 9, BusStopCode: '05013', Distance: 21.3 }, // Chinatown Stn
      { StopSequence: 10, BusStopCode: '05019', Distance: 22.1 }, // Outram Park Stn
    ],
    Polyline: [
      [1.3044, 103.8318],
      [1.3039, 103.8341],
      [1.3009, 103.8385],
      [1.2993, 103.8453],
      [1.2968, 103.8530],
      [1.3005, 103.8558],
      [1.2929, 103.8519],
      [1.2885, 103.8468],
      [1.2843, 103.8441],
      [1.2801, 103.8402],
    ],
  },
  {
    ServiceNo: '65',
    Operator: 'SBST',
    Direction: 1,
    OriginCode: '75009',
    OriginName: 'Tampines Int',
    DestinationCode: '14119',
    DestinationName: 'HarbourFront Int',
    Category: 'Trunk',
    OperatingHours: {
      firstBusWeekday: '05:30',
      lastBusWeekday: '23:45',
      firstBusWeekend: '05:45',
      lastBusWeekend: '23:45',
    },
    Stops: [
      { StopSequence: 1, BusStopCode: '75009', Distance: 0.0 }, // Tampines Int
      { StopSequence: 2, BusStopCode: '40019', Distance: 14.2 }, // Little India
      { StopSequence: 3, BusStopCode: '08057', Distance: 15.6 }, // Dhoby Ghaut
      { StopSequence: 4, BusStopCode: '08138', Distance: 16.3 }, // Somerset Stn
      { StopSequence: 5, BusStopCode: '09047', Distance: 16.9 }, // Lucky Plaza
      { StopSequence: 6, BusStopCode: '09048', Distance: 17.3 }, // Opp Orchard Stn
      { StopSequence: 7, BusStopCode: '14119', Distance: 23.5 }, // HarbourFront Stn
    ],
    Polyline: [
      [1.3526, 103.9452],
      [1.3068, 103.8509],
      [1.2993, 103.8453],
      [1.3009, 103.8385],
      [1.3039, 103.8341],
      [1.3044, 103.8318],
      [1.2653, 103.8215],
    ],
  },
  {
    ServiceNo: '106',
    Operator: 'TTS',
    Direction: 1,
    OriginCode: '43009',
    OriginName: 'Bukit Batok Int',
    DestinationCode: '03059',
    DestinationName: 'Shenton Way Ter',
    Category: 'Trunk',
    OperatingHours: {
      firstBusWeekday: '05:40',
      lastBusWeekday: '23:35',
      firstBusWeekend: '05:45',
      lastBusWeekend: '23:35',
    },
    Stops: [
      { StopSequence: 1, BusStopCode: '17179', Distance: 6.2 }, // Clementi Int
      { StopSequence: 2, BusStopCode: '11389', Distance: 9.8 }, // Holland Village
      { StopSequence: 3, BusStopCode: '09048', Distance: 14.5 }, // Opp Orchard Stn
      { StopSequence: 4, BusStopCode: '08138', Distance: 15.6 }, // Somerset Stn
      { StopSequence: 5, BusStopCode: '08057', Distance: 16.5 }, // Dhoby Ghaut
      { StopSequence: 6, BusStopCode: '02049', Distance: 18.2 }, // The Esplanade
      { StopSequence: 7, BusStopCode: '03211', Distance: 19.5 }, // Marina Bay Sands
      { StopSequence: 8, BusStopCode: '03239', Distance: 20.1 }, // Sands Expo
      { StopSequence: 9, BusStopCode: '03059', Distance: 21.8 }, // Shenton Way
    ],
    Polyline: [
      [1.3151, 103.7652],
      [1.3115, 103.7963],
      [1.3044, 103.8318],
      [1.3009, 103.8385],
      [1.2993, 103.8453],
      [1.2898, 103.8563],
      [1.2834, 103.8607],
      [1.2818, 103.8588],
      [1.2774, 103.8475],
    ],
  },
  {
    ServiceNo: '7',
    Operator: 'SBST',
    Direction: 1,
    OriginCode: '84009',
    OriginName: 'Bedok Int',
    DestinationCode: '17179',
    DestinationName: 'Clementi Int',
    Category: 'Trunk',
    OperatingHours: {
      firstBusWeekday: '05:30',
      lastBusWeekday: '23:45',
      firstBusWeekend: '05:30',
      lastBusWeekend: '23:45',
    },
    Stops: [
      { StopSequence: 1, BusStopCode: '84009', Distance: 0.0 }, // Bedok Int
      { StopSequence: 2, BusStopCode: '01112', Distance: 11.2 }, // Bugis Stn
      { StopSequence: 3, BusStopCode: '01012', Distance: 11.9 }, // Victoria St
      { StopSequence: 4, BusStopCode: '08079', Distance: 12.5 }, // Bras Basah
      { StopSequence: 5, BusStopCode: '08057', Distance: 13.1 }, // Dhoby Ghaut
      { StopSequence: 6, BusStopCode: '08138', Distance: 13.9 }, // Somerset
      { StopSequence: 7, BusStopCode: '09047', Distance: 14.6 }, // Orchard Stn
      { StopSequence: 8, BusStopCode: '11389', Distance: 19.2 }, // Holland Village
      { StopSequence: 9, BusStopCode: '17179', Distance: 23.4 }, // Clementi Int
    ],
    Polyline: [
      [1.3240, 103.9300],
      [1.3005, 103.8558],
      [1.2968, 103.8530],
      [1.2981, 103.8504],
      [1.2993, 103.8453],
      [1.3009, 103.8385],
      [1.3039, 103.8341],
      [1.3115, 103.7963],
      [1.3151, 103.7652],
    ],
  },
  {
    ServiceNo: '857',
    Operator: 'TTS',
    Direction: 1,
    OriginCode: '59009',
    OriginName: 'Yishun Int',
    DestinationCode: '02049',
    DestinationName: 'Suntec City / Marina Centre',
    Category: 'Express',
    OperatingHours: {
      firstBusWeekday: '05:30',
      lastBusWeekday: '23:30',
      firstBusWeekend: '05:45',
      lastBusWeekend: '23:30',
    },
    Stops: [
      { StopSequence: 1, BusStopCode: '40019', Distance: 15.1 }, // Little India
      { StopSequence: 2, BusStopCode: '07539', Distance: 15.9 }, // Rochor Stn
      { StopSequence: 3, BusStopCode: '01112', Distance: 16.7 }, // Bugis Stn
      { StopSequence: 4, BusStopCode: '01012', Distance: 17.3 }, // Victoria St
      { StopSequence: 5, BusStopCode: '08057', Distance: 18.2 }, // Dhoby Ghaut
      { StopSequence: 6, BusStopCode: '02049', Distance: 20.4 }, // The Esplanade
    ],
    Polyline: [
      [1.3068, 103.8509],
      [1.3038, 103.8533],
      [1.3005, 103.8558],
      [1.2968, 103.8530],
      [1.2993, 103.8453],
      [1.2898, 103.8563],
    ],
  },
  {
    ServiceNo: '147',
    Operator: 'SBST',
    Direction: 1,
    OriginCode: '64009',
    OriginName: 'Hougang Central Int',
    DestinationCode: '17179',
    DestinationName: 'Clementi Int',
    Category: 'Trunk',
    OperatingHours: {
      firstBusWeekday: '05:30',
      lastBusWeekday: '23:45',
      firstBusWeekend: '05:45',
      lastBusWeekend: '23:45',
    },
    Stops: [
      { StopSequence: 1, BusStopCode: '40019', Distance: 8.5 }, // Little India
      { StopSequence: 2, BusStopCode: '04222', Distance: 11.2 }, // Clarke Quay
      { StopSequence: 3, BusStopCode: '05013', Distance: 12.0 }, // Chinatown Stn
      { StopSequence: 4, BusStopCode: '05019', Distance: 13.1 }, // Outram Park
      { StopSequence: 5, BusStopCode: '17179', Distance: 24.5 }, // Clementi Int
    ],
    Polyline: [
      [1.3068, 103.8509],
      [1.2885, 103.8468],
      [1.2843, 103.8441],
      [1.2801, 103.8402],
      [1.3151, 103.7652],
    ],
  },
];
