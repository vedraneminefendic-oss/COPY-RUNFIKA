import { Product, ScenicRoute } from './types';

export const MAPBOX_TOKEN = 'pk.eyJ1IjoidmVkZGV2IiwiYSI6ImNtaXc0ZGhiNDBqb2UzZXBmeDI0Z21zcGYifQ.XH_aKILr0HftAzZCbHiZrg';
// Get your free API key at https://openweathermap.org/api
export const OPENWEATHER_API_KEY = ''; 

// Gothenburg, Sweden
export const DEFAULT_CENTER = { lng: 11.965000, lat: 57.700000 }; 
export const ZOOM_LEVEL = 13;

// SAFE MAP STYLE (Carto Voyager - No API Key needed for tiles)
export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export const EXPOSED_LOCATIONS = [
  'Älvsborgsbron',
  'Amundön',
  'Röda Sten',
  'Eriksbergskranen',
  'Sannegårdshamnen',
  'Säröbanan',
  'Masthuggskyrkan'
];

export const SCENIC_ROUTES: ScenicRoute[] = [
  // --- COASTAL & OCEAN ---
  {
    id: 'route_sarobanan',
    name: "Säröbanan (Ocean View)",
    description: "Gamla järnvägsspåret längs havet. Platt, bilfritt och magiska vyer.",
    // Point A: Linnéplatsen (Start of the trail from city)
    pointA: { lat: 57.6908, lng: 11.9529 },
    // Point B: Billdal (Billdals Park)
    pointB: { lat: 57.5843, lng: 11.9439 },
    // Waypoints tvingar rutten via vattnet (Amundön)
    waypoints: [{ lat: 57.6045, lng: 11.9300 }] 
  },
  {
    id: 'route_saltholmen',
    name: "Långedrag & Saltholmen",
    description: "Från Mariaplan ut mot skärgården längs spårvagn 11.",
    // Point A: Mariaplan (Majorna)
    pointA: { lat: 57.6815, lng: 11.9190 },
    // Point B: Saltholmens Brygga
    pointB: { lat: 57.6605, lng: 11.8385 },
    // Waypoint: Hinsholmen (Havskontakt)
    waypoints: [{ lat: 57.6715, lng: 11.8790 }]
  },
  {
    id: 'route_nya_varvet',
    name: "Röda Sten & Nya Varvet",
    description: "Under Älvsborgsbron, förbi graffiti och gammal örlogshamn.",
    // Point A: Chapmans Torg / Klippan
    pointA: { lat: 57.6965, lng: 11.9135 },
    // Point B: Nya Varvet / Hotellet
    pointB: { lat: 57.6855, lng: 11.8845 },
    // Waypoint: Röda Sten Konsthall
    waypoints: [{ lat: 57.6905, lng: 11.9150 }]
  },

  // --- URBAN & INDUSTRIAL ---
  {
    id: 'route_ringon',
    name: "Ringön Industrial (Beer Run)",
    description: "Rått och trendigt industriområde. Via Hisingsbron.",
    // Point A: Centralstationen / Operan
    pointA: { lat: 57.7085, lng: 11.9740 },
    // Point B: Ivans Pilsnerbar (Ringöns hjärta)
    pointB: { lat: 57.7215, lng: 11.9655 },
    // Waypoint: Mitt på Hisingsbron
    waypoints: [{ lat: 57.7145, lng: 11.9685 }]
  },
  {
    id: 'route_alvstranden',
    name: "Norra Älvstranden",
    description: "Träbryggor längs kajkanten med utsikt över södra stan.",
    // Point A: Eriksbergskranen
    pointA: { lat: 57.6995, lng: 11.9135 },
    // Point B: Lindholmen Science Park
    pointB: { lat: 57.7065, lng: 11.9685 },
    // Waypoint: Sannegårdshamnen (Gångbron)
    waypoints: [{ lat: 57.7024, lng: 11.9299 }]
  },
  {
    id: 'route_city_moat',
    name: "Vallgraven Runt",
    description: "Historisk runda längs vattnet mitt i centrum.",
    // Point A: Stora Teatern
    pointA: { lat: 57.7010, lng: 11.9750 },
    // Point B: Drottningtorget
    pointB: { lat: 57.7080, lng: 11.9700 },
    // Waypoint: Feskekörka
    waypoints: [{ lat: 57.7045, lng: 11.9550 }]
  },

  // --- NATURE & HILLS ---
  {
    id: 'route_ramberget',
    name: "King of the Hill (Ramberget)",
    description: "Brutal backe men stans bästa utsikt som belöning.",
    // Point A: Kvilletorget
    pointA: { lat: 57.7205, lng: 11.9535 },
    // Point B: Rambergets Topp
    pointB: { lat: 57.7115, lng: 11.9425 },
    // Waypoint: Keillers Park Entré
    waypoints: [{ lat: 57.7160, lng: 11.9400 }]
  },
  {
    id: 'route_slottsskogen',
    name: "Slottsskogen Park Run",
    description: "Kuperat och grönt i Göteborgs stadspark.",
    // Point A: Linnéplatsen
    pointA: { lat: 57.6925, lng: 11.9535 },
    // Point B: Mariaplan
    pointB: { lat: 57.6820, lng: 11.9350 },
    // Waypoint: Säldammen
    waypoints: [{ lat: 57.6855, lng: 11.9440 }]
  },
  {
    id: 'route_anggardsbergen',
    name: "Änggårdsbergen Trail",
    description: "Vildmark med stigar och ljunghedar.",
    // Point A: Botaniska Entrén
    pointA: { lat: 57.6835, lng: 11.9485 },
    // Point B: Högsbo / Sisjön håll
    pointB: { lat: 57.6650, lng: 11.9450 },
    // Waypoint: Uppe på krönet (Finns Mossar)
    waypoints: [{ lat: 57.6750, lng: 11.9550 }]
  },
  {
    id: 'route_delsjon',
    name: "Delsjön Nature Trail",
    description: "Grusvägar och skog runt sjön.",
    // Point A: Skatås Motionscentrum
    pointA: { lat: 57.6970, lng: 12.0250 },
    // Point B: Västra delen av Stora Delsjön
    pointB: { lat: 57.6850, lng: 12.0300 },
    // Waypoint: Delsjöbadet
    waypoints: [{ lat: 57.6928, lng: 12.0425 }]
  }
];

export const RECOMMENDED_GEAR: Product[] = [
  {
    id: 'p1',
    name: 'Ghost 15 Running Shoe',
    brand: 'Brooks',
    price: '1600 kr',
    image: 'shoe',
    description: 'Reliable daily trainer with soft cushioning. Perfect for city pavement.',
    tags: ['general'],
    affiliateLink: '#'
  },
  // ... (keeping other products the same)
];

// ELEVATION DATA (Approximate meters above sea level for Gothenburg)
export const FEATURED_CAFES = [
  // CAFES
  {
    id: 'f8', 
    name: 'Bar Centro',
    address: 'Kyrkogatan 31, Gothenburg',
    coordinates: { lat: 57.70549145239384, lng: 11.96969836786946 },
    category: 'cafe',
    elevation: 3,
    openingHours: 'Mon-Wed 07:30-23:00, Thu-Fri 07:30-01:00, Sat 10:00-01:00',
    geminiTitle: 'Centro Circuit Sprint',
    geminiDescription: 'Power through this run to awaken your senses with a potent coffee (or wine)!',
    geminiTip: 'Maintain a steady rhythm; the vibrant atmosphere is effort well spent.',
  },
  {
    id: 'f1',
    name: 'Da Matteo Magasinsgatan',
    address: 'Magasinsgatan 17A, Gothenburg',
    coordinates: { lat: 57.702924361709044, lng: 11.962371526542626 },
    category: 'cafe',
    elevation: 4,
    openingHours: 'Mon-Fri 07:30-18:00, Sat 09:00-17:00, Sun 10:00-17:00',
    geminiTitle: 'Da Matteo Magasinsgatan',
    geminiDescription: 'Push through nearly 8K to earn your artisanal coffee break at this vibrant cafe!',
    geminiTip: 'Remember to hydrate well on this longer run; a refreshing espresso awaits!',
  },
  {
    id: 'f2',
    name: 'Kafé Magasinet',
    address: 'Tredje Långgatan 9, Gothenburg',
    coordinates: { lat: 57.69903903558656, lng: 11.950993414572327 },
    category: 'cafe',
    elevation: 5,
    openingHours: 'Mon-Sun 07:00-22:00',
    geminiTitle: 'Magasinet Mile Challenge',
    geminiDescription: 'Conquer close to 9K and refuel with well-deserved energy at the bustling Kafé Magasinet!',
    geminiTip: 'Pace yourself on this demanding route, knowing a perfect pour-over is your prize.',
  },
  {
    id: 'f3',
    name: 'Café Husaren',
    address: 'Haga Nygata 28, Gothenburg',
    coordinates: { lat: 57.698540605015246, lng: 11.959880311199068 },
    category: 'cafe',
    elevation: 5,
    openingHours: 'Mon-Thu 08:00-19:00, Fri-Sat 08:00-18:00',
    geminiTitle: 'Haga Bun Run',
    geminiDescription: 'Famous for the gigantic "Hagabullen" cinnamon bun - the ultimate carb-loading reward.',
    geminiTip: 'The buns are huge, maybe bring a running buddy to share!',
  },
  {
    id: 'f4',
    name: 'Brogyllen',
    address: 'Västra Hamngatan 2, Gothenburg',
    coordinates: { lat: 57.70565469156952, lng: 11.963351356903143 },
    category: 'cafe',
    elevation: 3,
    openingHours: 'Mon-Fri 07:30-19:00, Sat 08:30-18:00, Sun 09:30-18:00',
    geminiTitle: 'The Classic Confection Run',
    geminiDescription: 'Run to a classic Gothenburg institution with chandeliers and exquisite pastries.',
    geminiTip: 'A perfect spot for a post-run celebration with a princess cake.',
    preferredWaypoints: [
      { lat: 57.7010, lng: 11.9750 }, // Stora Teatern
      { lat: 57.7045, lng: 11.9550 }  // Feskekörka
    ]
  },
  {
    id: 'f5',
    name: 'Alkemisten',
    address: 'Gustaf Dalénsgatan 14, Gothenburg',
    coordinates: { lat: 57.72258426827815, lng: 11.945059513051136 },
    category: 'cafe',
    elevation: 8,
    openingHours: 'Mon-Fri 07:30-17:00, Sat-Sun 10:00-16:00',
    geminiTitle: 'Hisingen Brew Sprint',
    geminiDescription: 'Cross the river for some of the best specialty coffee in the city.',
    geminiTip: 'The sourdough sandwiches here are legendary for recovery.',
    preferredWaypoints: [
      { lat: 57.6995, lng: 11.9135 }, // Eriksbergskranen
      { lat: 57.7024, lng: 11.9299 }  // Sannegårdshamnen
    ]
  },
  {
    id: 'f6',
    name: 'Viktors Kaffe',
    address: 'Geijersgatan 7, Gothenburg',
    coordinates: { lat: 57.69738400826711, lng: 11.978046326542298 },
    category: 'cafe',
    elevation: 15,
    openingHours: 'Mon-Fri 07:30-18:00, Sat 11:00-17:00, Sun 12:00-16:00',
    geminiTitle: 'Arts & Coffee Dash',
    geminiDescription: 'A trendy spot near Götaplatsen, perfect for a cultural finish to your run.',
    geminiTip: 'Try their tonic espresso for a refreshing cool-down drink.',
  },
  {
    id: 'f7',
    name: 'Ahlströms Konditori',
    address: 'Korsgatan 2, Gothenburg',
    coordinates: { lat: 57.70595595451243, lng: 11.965952014901083 },
    category: 'cafe',
    elevation: 3,
    openingHours: 'Mon-Fri 08:30-18:00, Sat 10:00-17:00',
    geminiTitle: 'Historic Heart Run',
    geminiDescription: 'One of the oldest patisseries in town, offering a traditional Swedish fika experience.',
    geminiTip: 'Great outdoor seating in the courtyard if you are sweaty!',
  },
  {
    id: 'f9',
    name: 'Mr Cake',
    address: 'Lilla Badhusgatan 2, Gothenburg',
    coordinates: { lat: 57.70578087574571, lng: 11.958027524691898 },
    category: 'cafe',
    elevation: 2,
    openingHours: 'Mon-Thu 07:30-18:00, Fri 07:30-19:00, Sat 09:00-18:00, Sun 10:00-17:00',
    geminiTitle: 'Red Velvet Run',
    geminiDescription: 'A destination for those with a serious sweet tooth - American cakes meet Swedish fika.',
    geminiTip: 'The Red Velvet croissant is a must-try reward.',
  },
  {
    id: 'f10',
    name: 'Kampanilen',
    address: 'Karl Johansgatan 5, Gothenburg',
    coordinates: { lat: 57.69850823865038, lng: 11.931586326542353 },
    category: 'cafe',
    elevation: 30,
    openingHours: 'Mon-Fri 07:00-18:00, Sat 08:00-16:00',
    geminiTitle: 'Majorna Morning Jog',
    geminiDescription: 'An organic artisan bakery in the heart of Majorna.',
    geminiTip: 'Get here early, the morning buns sell out fast!',
  },
  {
    id: 'f11',
    name: 'Flickorna på Färjenäs',
    address: 'Karl IX:s Väg 1, Gothenburg',
    coordinates: { lat: 57.69552588148963, lng: 11.901094628393034 },
    category: 'cafe',
    elevation: 5,
    openingHours: 'Tue-Fri 10:00-17:00, Sat-Sun 10:00-17:00',
    geminiTitle: 'Bridge View Loop',
    geminiDescription: 'Located under the Älvsborg bridge, offering classic fika with a view.',
    geminiTip: 'The dog-friendly atmosphere makes it great if you run with a pup.',
    preferredWaypoints: [
      { lat: 57.6905, lng: 11.9150 }, // Röda Sten
      { lat: 57.6935, lng: 11.9015 }  // Älvsborgsbron
    ]
  },
  {
    id: 'f12',
    name: 'Mahogny Coffee Bar',
    address: 'Södra Vägen 18, Gothenburg',
    coordinates: { lat: 57.69424738920366, lng: 11.972197453527144 },
    category: 'cafe',
    elevation: 10,
    openingHours: 'Mon-Fri 07:30-18:00, Sat 10:00-16:00',
    geminiTitle: 'The Espresso Enthusiast',
    geminiDescription: 'Serious about coffee? This is your finish line.',
    geminiTip: 'Small place, perfect for a quick espresso shot recovery.',
  },
  {
    id: 'f13',
    name: 'Bar Italia',
    address: 'Prinsgatan 7, Gothenburg',
    coordinates: { lat: 57.69657814292683, lng: 11.949782429914716 },
    category: 'cafe',
    elevation: 15,
    openingHours: 'Mon-Sun 08:00-18:00',
    geminiTitle: 'La Dolce Vita Dash',
    geminiDescription: 'Run like an Italian to this iconic corner espresso bar.',
    geminiTip: 'Standing room only sometimes - keep your legs moving!',
  },
  {
    id: 'f14',
    name: 'Kafé Marmelad',
    address: 'Mariagatan 17, Gothenburg',
    coordinates: { lat: 57.68569620837392, lng: 11.91823188051169 },
    category: 'cafe',
    elevation: 20,
    openingHours: 'Mon-Sun 10:00-20:00',
    geminiTitle: 'Mariaplan Marathon',
    geminiDescription: 'The living room of Majorna. Excellent coffee and even better atmosphere.',
    geminiTip: 'Perfect endpoint for a longer run through Slottsskogen.',
    preferredWaypoints: [
      { lat: 57.6925, lng: 11.9535 }, // Linnéplatsen
      { lat: 57.6855, lng: 11.9440 }  // Säldammen
    ]
  },
  {
    id: 'f16',
    name: 'Cum Pane',
    address: 'Mariagatan 6, Gothenburg',
    coordinates: { lat: 57.68581959797536, lng: 11.918406443735847 },
    category: 'cafe',
    elevation: 20,
    openingHours: 'Mon-Fri 07:00-18:00, Sat 08:00-15:00',
    geminiTitle: 'Organic Oven Run',
    geminiDescription: 'Award-winning organic sourdough bakery in Majorna.',
    geminiTip: 'Their cardamom buns are dense, flavorful, and worth every step.',
  },
  {
    id: 'f17',
    name: 'Gerd',
    address: 'Linnégatan 7, Gothenburg',
    coordinates: { lat: 57.69854747098133, lng: 11.951505401408163 },
    category: 'cafe',
    elevation: 5,
    openingHours: 'Mon-Sun 08:00-17:00',
    geminiTitle: 'Linné Luxury Loop',
    geminiDescription: 'A modern, trendy spot in Linné offering high-end pastries.',
    geminiTip: 'Great spot for people watching while you cool down.',
  },
  {
    id: 'f18',
    name: 'Berzelii Choklad',
    address: 'Södra Vägen 34, Gothenburg',
    coordinates: { lat: 57.70437432596761, lng: 11.962225868870986 },
    category: 'cafe',
    elevation: 4,
    openingHours: 'Mon-Fri 10:00-18:00, Sat 10:00-15:00',
    geminiTitle: 'Chocolate Chase',
    geminiDescription: 'Award-winning pralines and pastries near Korsvägen.',
    geminiTip: 'Treat yourself to a hot chocolate if it is a cold run.',
  },
  {
    id: 'f19',
    name: 'Kafé Gapet',
    address: 'Silverkällegatan 4, Gothenburg',
    coordinates: { lat: 57.68703780826152, lng: 11.917901067019256 },
    category: 'cafe',
    elevation: 35,
    openingHours: 'Mon-Fri 08:00-16:00',
    geminiTitle: 'Lunden Leg Stretch',
    geminiDescription: 'A friendly neighborhood bakery with a big heart.',
    geminiTip: 'Their soups are great for a post-run lunch.',
  },
  {
    id: 'f20',
    name: 'Matería',
    address: 'Mariagatan 13, Gothenburg',
    coordinates: { lat: 57.68664186206825, lng: 11.919450997705873 },
    category: 'cafe',
    elevation: 20,
    openingHours: 'Mon-Fri 08:00-17:00, Sat-Sun 10:00-16:00',
    geminiTitle: 'Minimalist Mile',
    geminiDescription: 'Stylish, healthy, and focused on great coffee near Mariaplan.',
    geminiTip: 'Try their matcha latte for a different kind of boost.',
  },
  {
    id: 'f21',
    name: 'St Agnes',
    address: 'Teatergatan 32, Gothenburg',
    coordinates: { lat: 57.70003880154524, lng: 11.973410797706586 },
    category: 'cafe',
    elevation: 12,
    openingHours: 'Mon-Sat 11:00-22:00',
    geminiTitle: 'The Vegan Victory',
    geminiDescription: 'Cozy spot with excellent vegan options right off the Avenue.',
    geminiTip: 'Their vegan brownies are surprisingly rich.',
  },
  {
    id: 'f22',
    name: 'Kafé Zenit',
    address: 'Allmänna Vägen 11, Gothenburg',
    coordinates: { lat: 57.69785914041037, lng: 11.931611253527327 },
    category: 'cafe',
    elevation: 25,
    openingHours: 'Mon-Sun 10:00-20:00',
    geminiTitle: 'Majorna Classic',
    geminiDescription: 'A relaxed, bohemian classic in Majorna with a great outdoor terrace.',
    geminiTip: 'Perfect for a sunny day run ending.',
  },
  {
    id: 'f24',
    name: 'Nöller Espressobar',
    address: 'Haga Nygata 19, Gothenburg',
    coordinates: { lat: 57.69852430475664, lng: 11.960021011199082 },
    category: 'cafe',
    elevation: 5,
    openingHours: 'Mon-Fri 08:00-18:00, Sat-Sun 10:00-17:00',
    geminiTitle: 'Haga Espresso Sprint',
    geminiDescription: 'A small, authentic espresso bar with an Italian vibe in Haga.',
    geminiTip: 'Grab a quick cortado on the bench outside.',
  },
  {
    id: 'f25',
    name: 'BOV',
    address: 'Gibraltargatan 20, Gothenburg',
    coordinates: { lat: 57.69229992377904, lng: 11.97787156516873 },
    category: 'cafe',
    elevation: 50,
    openingHours: 'Tue-Sat 17:00-23:00',
    geminiTitle: 'Johanneberg Gem',
    geminiDescription: 'Wood-fired sourdough pizza and bread in a rustic, intimate setting.',
    geminiTip: 'A cozy spot for a high-quality recovery meal.',
  },
  {
    id: 'f26',
    name: 'Systrarna Werner',
    address: 'Billdalsvägen 40, Billdal',
    coordinates: { lat: 57.58404338424, lng: 11.944050085693185 },
    category: 'cafe',
    elevation: 10,
    openingHours: 'Wed-Sun 11:00-16:00',
    geminiTitle: 'Billdal Garden Gallop',
    geminiDescription: 'A charming destination cafe set in a beautiful garden south of the city.',
    geminiTip: 'The Säröbanan trail takes you almost all the way there - a perfect long run.',
    linkedScenicRouteId: 'route_sarobanan', // Explicit Link
    preferredWaypoints: [
      { lat: 57.6836, lng: 11.9448 }, // Margreteberg - Start of Trail near Slottsskogen
      { lat: 57.6657, lng: 11.9398 }, // Järnbrott/Högsbo - Keeps on trail
      { lat: 57.6535, lng: 11.9388 }, // Askimsbadet - Forces trail usage
      { lat: 57.6291, lng: 11.9275 }, // Brottkärr/Amundön - Strictly coastal
      { lat: 57.6115, lng: 11.9365 }, // Järkholmsvägen (Hovås) - NEW Scenic Detour
      { lat: 57.6010, lng: 11.9350 }, // Lindås/Skintebo - Forces rail trail usage
      { lat: 57.5905, lng: 11.9390 }  // Billdal
    ]
  },

  // BARS
  {
    id: 'b1',
    name: 'Ölrepubliken',
    address: 'Kronhusgatan 2B, Gothenburg',
    coordinates: { lat: 57.70791206731299, lng: 11.961799382363752 },
    category: 'bar',
    elevation: 3,
    openingHours: 'Mon-Thu 16:00-23:00, Fri 15:00-01:00, Sat 13:00-01:00',
    geminiTitle: 'The Republic Run',
    geminiDescription: 'A temple of beer with over 30 taps near the historic Kronhuset.',
    geminiTip: 'The mussels are a fantastic light protein option.',
  },
  {
    id: 'b2',
    name: 'Brewers Beer Bar Tredje Lång',
    address: 'Tredje Långgatan 8, Gothenburg',
    coordinates: { lat: 57.69874857205448, lng: 11.950894070721523 },
    category: 'bar',
    elevation: 5,
    openingHours: 'Mon-Sun 16:00-Late',
    geminiTitle: 'Sourdough & Suds',
    geminiDescription: 'Famous for sourdough pizza and an ever-changing craft beer list.',
    geminiTip: 'Carb loading with pizza AFTER the run is fully approved.',
  },
  {
    id: 'b4',
    name: '3 Små Rum',
    address: 'Kristinelundsgatan 4, Gothenburg',
    coordinates: { lat: 57.69907060176991, lng: 11.973575329915667 },
    category: 'bar',
    elevation: 12,
    openingHours: 'Mon-Sat 17:00-23:00',
    geminiTitle: 'Underground Interval',
    geminiDescription: 'Jazz, Persian food, and a strict "Don\'t ask for a lager" policy.',
    geminiTip: 'Ask the owner for a recommendation, he knows his stuff.',
  },
  {
    id: 'b5',
    name: 'Haket',
    address: 'Första Långgatan 32, Gothenburg',
    coordinates: { lat: 57.699161803147376, lng: 11.942555026542376 },
    category: 'bar',
    elevation: 5,
    openingHours: 'Mon-Sun 16:00-01:00',
    geminiTitle: 'The Pub Lover\'s Loop',
    geminiDescription: 'A true beer lover\'s pub with a massive tap list and Japanese beer focus.',
    geminiTip: 'The outdoor seating catches the evening sun perfectly.',
  },
  {
    id: 'b6',
    name: 'Station Linné',
    address: 'Linnéplatsen 4, Gothenburg',
    coordinates: { lat: 57.690781040173064, lng: 11.952863113049407 },
    category: 'bar',
    elevation: 15,
    openingHours: 'Mon-Sun 11:30-01:00',
    geminiTitle: 'Slottsskogen Finish',
    geminiDescription: 'Right at the entrance to the park, perfect for post-trail refreshments.',
    geminiTip: 'Their Sunday Roast is the ultimate recovery meal.',
  },
  {
    id: 'b7',
    name: 'Ölstugan Tullen Majorna',
    address: 'Mariagatan 15, Gothenburg',
    coordinates: { lat: 57.68593985424368, lng: 11.91867096887006 },
    category: 'bar',
    elevation: 20,
    openingHours: 'Mon-Sun 16:00-01:00',
    geminiTitle: 'Majorna Pub Run',
    geminiDescription: 'Classic Swedish home cooking and only Swedish beer on tap.',
    geminiTip: 'Meatballs and lingonberries - the Swedish runner\'s fuel.',
  },
  {
    id: 'b8',
    name: 'Majornas Bryggeri',
    address: 'Karl Johansgatan 88, Gothenburg',
    coordinates: { lat: 57.69368795161784, lng: 11.918731640034604 },
    category: 'bar',
    elevation: 35,
    openingHours: 'Wed-Sat 16:00-23:00',
    geminiTitle: 'Brewery Belt',
    geminiDescription: 'A local brewery with a strong focus on vegetarian food pairings.',
    geminiTip: 'Fresh beer directly from the tanks tastes different.',
  },
  {
    id: 'b10',
    name: 'Ivans Pilsnerbar',
    address: 'Järnmalmsgatan 4, Gothenburg',
    coordinates: { lat: 57.7207095115622, lng: 11.971895443416358 },
    category: 'bar',
    elevation: 2,
    openingHours: 'Wed-Sat 17:00-01:00',
    geminiTitle: 'Industrial Interval',
    geminiDescription: 'A colorful, artistic beer wonderland on the industrial Ringön.',
    geminiTip: 'The visual art here is as stimulating as the run.',
  },
  {
    id: 'b11',
    name: 'Ölkompaniet',
    address: 'Danska Vägen 110, Gothenburg',
    coordinates: { lat: 57.71514631625509, lng: 12.004291767020794 },
    category: 'bar',
    elevation: 35,
    openingHours: 'Mon-Sun 16:00-00:00',
    geminiTitle: 'Redbergslid Route',
    geminiDescription: 'A relaxed neighborhood pub in the east with great selection.',
    geminiTip: 'A great halfway point if you are doing a long eastern loop.',
  },
  {
    id: 'b12',
    name: 'Bearded Rabbit',
    address: 'Norra Ågatan 10, Gothenburg',
    coordinates: { lat: 57.7132710916156, lng: 11.993280497707335 },
    category: 'bar',
    elevation: 5,
    openingHours: 'Fri 16:00-21:00',
    geminiTitle: 'Rabbit Run',
    geminiDescription: 'Tiny brewery taproom by the canal.',
    geminiTip: 'Check opening hours closely, it is a small operation!',
  },
  {
    id: 'b13',
    name: 'Zamenhof',
    address: 'Esperantoplatsen 5, Gothenburg',
    coordinates: { lat: 57.7022373918287, lng: 11.956076768870952 },
    category: 'bar',
    elevation: 5,
    openingHours: 'Mon-Sun 11:00-Late',
    geminiTitle: 'The Gamer\'s Gallop',
    geminiDescription: 'All-day dining and arcade games with a massive beer selection.',
    geminiTip: 'Challenge your running buddy to pinball after the run.',
  },
  {
    id: 'b14',
    name: 'Rolling Bistros Backyard',
    address: 'Väverigatan 5, Gothenburg',
    coordinates: { lat: 57.72610383992992, lng: 12.005283041231142 },
    category: 'bar',
    elevation: 8,
    openingHours: 'Tue-Sat 17:00-23:00',
    geminiTitle: 'Backyard Burger Dash',
    geminiDescription: 'A hidden industrial gem serving top-tier smash burgers and beer.',
    geminiTip: 'The run to Gamlestaden is flat and fast, perfect for a PB attempt.',
  },
  {
    id: 'b15',
    name: 'Le 20ème',
    address: 'Lars Kaggsgatan 2A, Gothenburg',
    coordinates: { lat: 57.730078172748215, lng: 12.007445312383368 },
    category: 'bar',
    elevation: 10,
    openingHours: 'Wed-Sat 17:00-23:00',
    geminiTitle: 'The French Connection',
    geminiDescription: 'Authentic French wine bar hidden in the old town of Gamlestaden.',
    geminiTip: 'A glass of natural wine is technically grape juice, right?',
  },
  {
    id: 'b16',
    name: 'Spike Brewery & Taproom',
    address: 'Slakthusområdet, Hus C, 415 02 Gothenburg',
    coordinates: { lat: 57.72853820024194, lng: 12.002062143738119 },
    category: 'bar',
    elevation: 5,
    openingHours: 'Fri-Sat 16:00-23:00',
    geminiTitle: 'Slakthuset Sprint',
    geminiDescription: 'Fresh craft beer straight from the source in the old slaughterhouse district.',
    geminiTip: 'The outdoor area is great in summer.',
  },
  {
    id: 'b17',
    name: 'Bennys Bar & Slice Shop',
    address: 'Rosenlundsgatan 4, 411 20 Gothenburg',
    coordinates: { lat: 57.70168466244569, lng: 11.956151036042804 },
    category: 'bar',
    elevation: 5,
    openingHours: 'Tue-Sun 16:00-Late',
    geminiTitle: 'Slice & Sprint',
    geminiDescription: 'New York style pizza slices and cold drinks by the canal.',
    geminiTip: 'Perfect for a quick carb refill.',
  },
  {
    id: 'b18',
    name: 'Oceanen',
    address: 'Stigbergstorget 8, 414 63 Gothenburg',
    coordinates: { lat: 57.69853459880356, lng: 11.933651000486833 },
    category: 'bar',
    elevation: 45,
    openingHours: 'Wed-Sat 17:00-01:00',
    geminiTitle: 'Cultural Climb',
    geminiDescription: 'A cultural hub at Stigbergstorget with a great beer selection.',
    geminiTip: 'Check their calendar for live music.',
  },
  {
    id: 'b19',
    name: 'The Red Lion',
    address: 'Mariagatan 11, 414 71 Gothenburg',
    coordinates: { lat: 57.686616357025024, lng: 11.91965886411213 },
    category: 'bar',
    elevation: 20,
    openingHours: 'Mon-Sun 14:00-01:00',
    geminiTitle: 'Lion\'s Loop',
    geminiDescription: 'A proper British pub experience in the heart of Majorna.',
    geminiTip: 'They have a massive selection of cask ales.',
  },
  {
    id: 'b20',
    name: 'Gyllene Prag',
    address: 'Sveagatan 25, 413 14 Gothenburg',
    coordinates: { lat: 57.69257708432471, lng: 11.954520573539982 },
    category: 'bar',
    elevation: 10,
    openingHours: 'Mon-Sun 16:00-23:00',
    geminiTitle: 'Fried Cheese Finish',
    geminiDescription: 'Eastern European classics and Czech beer in Linné.',
    geminiTip: 'The fried cheese (Smažený sýr) is legendary.',
  },
  {
    id: 'b21',
    name: 'Champagnebaren',
    address: 'Kyrkogatan 13, 411 15 Gothenburg',
    coordinates: { lat: 57.70463798383453, lng: 11.96289721272361 },
    category: 'bar',
    elevation: 4,
    openingHours: 'Tue-Sat 16:00-01:00',
    geminiTitle: 'Sparkling Sprint',
    geminiDescription: 'A hidden courtyard gem serving the best bubbles in town.',
    geminiTip: 'Celebrate a PB with a glass of grower champagne.',
  },
  {
    id: 'b22',
    name: 'Bar La Lune',
    address: 'Vasa kyrkogata 1, 411 27 Gothenburg',
    coordinates: { lat: 57.696598378537765, lng: 11.971663584213921 },
    category: 'bar',
    elevation: 12,
    openingHours: 'Tue-Sat 17:00-01:00',
    geminiTitle: 'Natural Wine Nav',
    geminiDescription: 'Tiny, intimate, and packed with natural wine enthusiasts.',
    geminiTip: 'Standing room only is common, keep those legs moving.',
  },
  {
    id: 'b23',
    name: 'Ölhallen 7:an',
    address: 'Kungstorget 7, 411 17 Gothenburg',
    coordinates: { lat: 57.703846953224264, lng: 11.967777885617812 },
    category: 'bar',
    elevation: 4,
    openingHours: 'Mon-Sun 11:00-Late',
    geminiTitle: 'Historic Hall Run',
    geminiDescription: 'Gothenburgs oldest beer hall - no food, just beer and history.',
    geminiTip: 'Strictly beer only. Perfect for a no-nonsense recovery.',
  }
];