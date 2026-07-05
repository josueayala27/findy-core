import { getDb } from "./client";
import { places, placeMentions } from "./schema";

process.loadEnvFile(".env");

type PlaceInsert = typeof places.$inferInsert;
type MentionInsert = Omit<typeof placeMentions.$inferInsert, "placeId">;

interface SeedEntry {
  place: PlaceInsert;
  mentions: MentionInsert[];
}

const EL_SALVADOR_BOUNDS = {
  minLat: 12.9,
  maxLat: 14.5,
  minLng: -90.2,
  maxLng: -87.6,
};

function isWithinElSalvador(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) {
    return false;
  }
  return (
    lat >= EL_SALVADOR_BOUNDS.minLat &&
    lat <= EL_SALVADOR_BOUNDS.maxLat &&
    lng >= EL_SALVADOR_BOUNDS.minLng &&
    lng <= EL_SALVADOR_BOUNDS.maxLng
  );
}

function sumMentionField(mentions: MentionInsert[], field: keyof Pick<MentionInsert, "likes" | "comments" | "shares" | "bookmarks">): number {
  return mentions.reduce((total, mention) => total + (mention[field] ?? 0), 0);
}

function buildEntry(
  place: Omit<
    PlaceInsert,
    "mentionCount" | "totalLikes" | "totalComments" | "totalShares" | "totalBookmarks" | "suspiciousLocation"
  >,
  mentions: MentionInsert[],
): SeedEntry {
  return {
    place: {
      ...place,
      suspiciousLocation: !isWithinElSalvador(place.lat, place.lng),
      mentionCount: mentions.length,
      totalLikes: sumMentionField(mentions, "likes"),
      totalComments: sumMentionField(mentions, "comments"),
      totalShares: sumMentionField(mentions, "shares"),
      totalBookmarks: sumMentionField(mentions, "bookmarks"),
    },
    mentions,
  };
}

const seed: SeedEntry[] = [
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000001",
      canonicalName: "Playa El Tunco",
      locationText: "El Tunco, La Libertad, El Salvador",
      lat: 13.4927,
      lng: -89.3823,
      category: "beach",
    },
    [
      {
        videoId: "tt-eltunco-1",
        sentiment: "positive",
        sentimentScore: "0.81",
        likes: 21000,
        comments: 320,
        shares: 540,
        bookmarks: 1200,
        summary: "Sunset surf session at El Tunco; viewers love the vibe.",
        locationText: "El Tunco, La Libertad, El Salvador",
        transcript: "El atardecer en El Tunco es otro nivel, las olas perfectas para surf.",
      },
      {
        videoId: "tt-eltunco-2",
        sentiment: "positive",
        sentimentScore: "0.74",
        likes: 8500,
        comments: 110,
        shares: 180,
        bookmarks: 420,
        summary: "Weekend crowd but still worth it for the point break.",
        locationText: "El Tunco, La Libertad, El Salvador",
        transcript: "Vine un sábado y había gente pero las olas valieron la pena.",
      },
      {
        videoId: "tt-eltunco-3",
        sentiment: "neutral",
        sentimentScore: "0.52",
        likes: 3200,
        comments: 45,
        shares: 60,
        bookmarks: 90,
        summary: "Food stalls are pricey compared to nearby beaches.",
        locationText: "El Tunco, La Libertad, El Salvador",
        transcript: "La comida está cara comparado con otras playas cerca.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000002",
      canonicalName: "Playa El Zonte",
      locationText: "El Zonte, Chiltiupán, La Libertad, El Salvador",
      lat: 13.4989,
      lng: -89.4419,
      category: "beach",
    },
    [
      {
        videoId: "tt-elzonte-1",
        sentiment: "positive",
        sentimentScore: "0.77",
        likes: 15400,
        comments: 180,
        shares: 300,
        bookmarks: 900,
        summary: "Morning waves at El Zonte; chill Bitcoin Beach atmosphere.",
        locationText: "El Zonte, Chiltiupán, La Libertad, El Salvador",
        transcript: "El Zonte al amanecer, ambiente relajado y buenas olas.",
      },
      {
        videoId: "tt-elzonte-2",
        sentiment: "positive",
        sentimentScore: "0.69",
        likes: 6200,
        comments: 95,
        shares: 140,
        bookmarks: 310,
        summary: "Great for beginners and longboard days.",
        locationText: "El Zonte, Chiltiupán, La Libertad, El Salvador",
        transcript: "Ideal para principiantes, olas suaves y playa amplia.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000003",
      canonicalName: "Playa El Sunzal",
      locationText: "El Sunzal, La Libertad, El Salvador",
      lat: 13.495,
      lng: -89.438,
      category: "beach",
    },
    [
      {
        videoId: "tt-sunzal-1",
        sentiment: "positive",
        sentimentScore: "0.85",
        likes: 12000,
        comments: 210,
        shares: 380,
        bookmarks: 650,
        summary: "Classic right-hand point break; pros love it.",
        locationText: "El Sunzal, La Libertad, El Salvador",
        transcript: "Sunzal tiene una de las mejores derechas de Centroamérica.",
      },
      {
        videoId: "tt-sunzal-2",
        sentiment: "neutral",
        sentimentScore: "0.48",
        likes: 2800,
        comments: 55,
        shares: 40,
        bookmarks: 75,
        summary: "Parking is limited on busy weekends.",
        locationText: "El Sunzal, La Libertad, El Salvador",
        transcript: "El fin de semana cuesta encontrar dónde parquear.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000004",
      canonicalName: "Playa Los Cóbanos",
      locationText: "Los Cóbanos, Sonsonate, El Salvador",
      lat: 13.4186,
      lng: -89.8722,
      category: "beach",
    },
    [
      {
        videoId: "tt-cobanos-1",
        sentiment: "positive",
        sentimentScore: "0.72",
        likes: 5400,
        comments: 88,
        shares: 120,
        bookmarks: 290,
        summary: "Snorkeling and reef diving hotspot on the west coast.",
        locationText: "Los Cóbanos, Sonsonate, El Salvador",
        transcript: "Los arrecifes de Los Cóbanos son increíbles para bucear.",
      },
      {
        videoId: "tt-cobanos-2",
        sentiment: "positive",
        sentimentScore: "0.66",
        likes: 3100,
        comments: 42,
        shares: 65,
        bookmarks: 150,
        summary: "Quiet compared to La Libertad beaches.",
        locationText: "Los Cóbanos, Sonsonate, El Salvador",
        transcript: "Mucho más tranquilo que las playas de La Libertad.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000005",
      canonicalName: "Juayúa",
      locationText: "Juayúa, Sonsonate, El Salvador",
      lat: 13.8414,
      lng: -89.7486,
      category: "town",
    },
    [
      {
        videoId: "tt-juayua-1",
        sentiment: "positive",
        sentimentScore: "0.79",
        likes: 9800,
        comments: 160,
        shares: 220,
        bookmarks: 480,
        summary: "Famous weekend food festival in the Ruta de las Flores.",
        locationText: "Juayúa, Sonsonate, El Salvador",
        transcript: "El festival gastronómico de Juayúa no te lo puedes perder.",
      },
      {
        videoId: "tt-juayua-2",
        sentiment: "positive",
        sentimentScore: "0.71",
        likes: 4500,
        comments: 70,
        shares: 95,
        bookmarks: 200,
        summary: "Waterfall hikes nearby are stunning after breakfast.",
        locationText: "Juayúa, Sonsonate, El Salvador",
        transcript: "Después del desayuno fuimos a la cascada, espectacular.",
      },
      {
        videoId: "tt-juayua-3",
        sentiment: "negative",
        sentimentScore: "0.28",
        likes: 900,
        comments: 35,
        shares: 12,
        bookmarks: 18,
        summary: "Too crowded during peak festival hours.",
        locationText: "Juayúa, Sonsonate, El Salvador",
        transcript: "A mediodía está imposible caminar, demasiada gente.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000006",
      canonicalName: "Suchitoto",
      locationText: "Suchitoto, Cuscatlán, El Salvador",
      lat: 13.9381,
      lng: -89.0278,
      category: "town",
    },
    [
      {
        videoId: "tt-suchitoto-1",
        sentiment: "positive",
        sentimentScore: "0.83",
        likes: 11200,
        comments: 145,
        shares: 260,
        bookmarks: 520,
        summary: "Colonial streets and lake views; perfect day trip.",
        locationText: "Suchitoto, Cuscatlán, El Salvador",
        transcript: "Suchitoto tiene un encanto colonial único en El Salvador.",
      },
      {
        videoId: "tt-suchitoto-2",
        sentiment: "neutral",
        sentimentScore: "0.55",
        likes: 2100,
        comments: 38,
        shares: 30,
        bookmarks: 55,
        summary: "Some galleries were closed on Monday.",
        locationText: "Suchitoto, Cuscatlán, El Salvador",
        transcript: "Fuimos un lunes y varias galerías estaban cerradas.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000007",
      canonicalName: "Parque Nacional Cerro Verde",
      locationText: "Cerro Verde, Santa Ana, El Salvador",
      lat: 13.8167,
      lng: -89.6333,
      category: "hike",
    },
    [
      {
        videoId: "tt-cerroverde-1",
        sentiment: "positive",
        sentimentScore: "0.88",
        likes: 14500,
        comments: 230,
        shares: 410,
        bookmarks: 780,
        summary: "Cloud forest trails with views of Izalco and Santa Ana volcanoes.",
        locationText: "Cerro Verde, Santa Ana, El Salvador",
        transcript: "Desde Cerro Verde se ven los tres volcanes, vista increíble.",
      },
      {
        videoId: "tt-cerroverde-2",
        sentiment: "positive",
        sentimentScore: "0.75",
        likes: 6800,
        comments: 92,
        shares: 155,
        bookmarks: 340,
        summary: "Cool misty weather; bring a jacket.",
        locationText: "Cerro Verde, Santa Ana, El Salvador",
        transcript: "Hace frío arriba, lleven chaqueta para el sendero.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000008",
      canonicalName: "Lago de Coatepeque",
      locationText: "Coatepeque, Santa Ana, El Salvador",
      lat: 13.8667,
      lng: -89.55,
      category: "lake",
    },
    [
      {
        videoId: "tt-coatepeque-1",
        sentiment: "positive",
        sentimentScore: "0.86",
        likes: 18900,
        comments: 275,
        shares: 490,
        bookmarks: 920,
        summary: "Crystal blue crater lake; boat rides and cliff jumps.",
        locationText: "Coatepeque, Santa Ana, El Salvador",
        transcript: "El agua del lago de Coatepeque es azul turquesa, parece unreal.",
      },
      {
        videoId: "tt-coatepeque-2",
        sentiment: "positive",
        sentimentScore: "0.70",
        likes: 7200,
        comments: 105,
        shares: 175,
        bookmarks: 380,
        summary: "Private docks and Airbnb stays with lake access.",
        locationText: "Coatepeque, Santa Ana, El Salvador",
        transcript: "Rentamos una casa con muelle privado, experiencia top.",
      },
      {
        videoId: "tt-coatepeque-3",
        sentiment: "neutral",
        sentimentScore: "0.50",
        likes: 1500,
        comments: 28,
        shares: 22,
        bookmarks: 40,
        summary: "Public access points are limited without a day pass.",
        locationText: "Coatepeque, Santa Ana, El Salvador",
        transcript: "Sin day pass es difícil acceder a la orilla del lago.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000009",
      canonicalName: "Joya de Cerén",
      locationText: "Joya de Cerén, La Libertad, El Salvador",
      lat: 13.8289,
      lng: -89.3864,
      category: "museum",
    },
    [
      {
        videoId: "tt-joya-1",
        sentiment: "positive",
        sentimentScore: "0.76",
        likes: 4300,
        comments: 72,
        shares: 95,
        bookmarks: 210,
        summary: "UNESCO Mayan village preserved by volcanic ash.",
        locationText: "Joya de Cerén, La Libertad, El Salvador",
        transcript: "Joya de Cerén es el Pompeya de América, imperdible.",
      },
      {
        videoId: "tt-joya-2",
        sentiment: "neutral",
        sentimentScore: "0.58",
        likes: 1800,
        comments: 30,
        shares: 18,
        bookmarks: 35,
        summary: "Guided tour is short but informative.",
        locationText: "Joya de Cerén, La Libertad, El Salvador",
        transcript: "El recorrido dura como una hora pero aprendes mucho.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000010",
      canonicalName: "El Boquerón",
      locationText: "Parque Nacional El Boquerón, San Salvador, El Salvador",
      lat: 13.7344,
      lng: -89.2878,
      category: "volcano",
    },
    [
      {
        videoId: "tt-boqueron-1",
        sentiment: "positive",
        sentimentScore: "0.73",
        likes: 7600,
        comments: 115,
        shares: 190,
        bookmarks: 340,
        summary: "Easy crater rim walk above San Salvador.",
        locationText: "Parque Nacional El Boquerón, San Salvador, El Salvador",
        transcript: "El Boquerón tiene un cráter enorme y el sendero es fácil.",
      },
      {
        videoId: "tt-boqueron-2",
        sentiment: "negative",
        sentimentScore: "0.35",
        likes: 1100,
        comments: 48,
        shares: 15,
        bookmarks: 22,
        summary: "Fog blocked the view on our visit.",
        locationText: "Parque Nacional El Boquerón, San Salvador, El Salvador",
        transcript: "Llegamos con neblina y no se veía nada del cráter.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000011",
      canonicalName: "Concepción de Ataco",
      locationText: "Ataco, Ahuachapán, El Salvador",
      lat: 13.8694,
      lng: -89.8481,
      category: "town",
    },
    [
      {
        videoId: "tt-ataco-1",
        sentiment: "positive",
        sentimentScore: "0.80",
        likes: 9100,
        comments: 130,
        shares: 210,
        bookmarks: 450,
        summary: "Colorful murals and coffee shops on the Ruta de las Flores.",
        locationText: "Ataco, Ahuachapán, El Salvador",
        transcript: "Ataco está lleno de murales y cafés artesanales.",
      },
      {
        videoId: "tt-ataco-2",
        sentiment: "positive",
        sentimentScore: "0.67",
        likes: 3800,
        comments: 58,
        shares: 80,
        bookmarks: 165,
        summary: "Night market with local crafts.",
        locationText: "Ataco, Ahuachapán, El Salvador",
        transcript: "El mercado nocturno tiene artesanías muy bonitas.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000012",
      canonicalName: "Perquín",
      locationText: "Perquín, Morazán, El Salvador",
      lat: 13.95,
      lng: -88.1667,
      category: "museum",
    },
    [
      {
        videoId: "tt-perquin-1",
        sentiment: "positive",
        sentimentScore: "0.68",
        likes: 5200,
        comments: 85,
        shares: 110,
        bookmarks: 240,
        summary: "Museum of the Revolution in the eastern highlands.",
        locationText: "Perquín, Morazán, El Salvador",
        transcript: "El museo de la revolución en Perquín es conmovedor.",
      },
      {
        videoId: "tt-perquin-2",
        sentiment: "neutral",
        sentimentScore: "0.51",
        likes: 1600,
        comments: 32,
        shares: 25,
        bookmarks: 45,
        summary: "Remote; plan a full day for the drive.",
        locationText: "Perquín, Morazán, El Salvador",
        transcript: "Está lejos de San Salvador, hay que planear el día completo.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000013",
      canonicalName: "Playa El Cuco",
      locationText: "El Cuco, San Miguel, El Salvador",
      lat: 13.1667,
      lng: -88.1833,
      category: "beach",
    },
    [
      {
        videoId: "tt-cuco-1",
        sentiment: "positive",
        sentimentScore: "0.74",
        likes: 8700,
        comments: 125,
        shares: 200,
        bookmarks: 410,
        summary: "Long sandy beach on the eastern coast.",
        locationText: "El Cuco, San Miguel, El Salvador",
        transcript: "El Cuco tiene playa larga y olas constantes en la costa oriental.",
      },
      {
        videoId: "tt-cuco-2",
        sentiment: "positive",
        sentimentScore: "0.62",
        likes: 2900,
        comments: 48,
        shares: 55,
        bookmarks: 120,
        summary: "Fresh seafood at beachfront pupuserías.",
        locationText: "El Cuco, San Miguel, El Salvador",
        transcript: "Las pupuserías frente al mar tienen mariscos frescos.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000014",
      canonicalName: "Playa Las Flores",
      locationText: "Las Flores, San Miguel, El Salvador",
      lat: 13.3222,
      lng: -87.8431,
      category: "beach",
    },
    [
      {
        videoId: "tt-lasflores-1",
        sentiment: "positive",
        sentimentScore: "0.82",
        likes: 10200,
        comments: 155,
        shares: 280,
        bookmarks: 530,
        summary: "World-class right point; surf camp destination.",
        locationText: "Las Flores, San Miguel, El Salvador",
        transcript: "Las Flores es un point break de clase mundial en el oriente.",
      },
      {
        videoId: "tt-lasflores-2",
        sentiment: "neutral",
        sentimentScore: "0.47",
        likes: 2400,
        comments: 40,
        shares: 35,
        bookmarks: 60,
        summary: "Rocky entry; wear booties.",
        locationText: "Las Flores, San Miguel, El Salvador",
        transcript: "Hay que entrar por rocas, conviene llevar escarpines.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000015",
      canonicalName: "Santa Ana",
      locationText: "Santa Ana, El Salvador",
      lat: 13.9942,
      lng: -89.5597,
      category: "town",
    },
    [
      {
        videoId: "tt-santaana-1",
        sentiment: "positive",
        sentimentScore: "0.70",
        likes: 6400,
        comments: 98,
        shares: 145,
        bookmarks: 280,
        summary: "Neo-Gothic cathedral and lively central plaza.",
        locationText: "Santa Ana, El Salvador",
        transcript: "La catedral de Santa Ana es impresionante por dentro y por fuera.",
      },
      {
        videoId: "tt-santaana-2",
        sentiment: "neutral",
        sentimentScore: "0.53",
        likes: 1900,
        comments: 36,
        shares: 28,
        bookmarks: 50,
        summary: "Good base for volcano day trips.",
        locationText: "Santa Ana, El Salvador",
        transcript: "Usamos Santa Ana como base para ir a Cerro Verde.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000016",
      canonicalName: "Volcán Izalco",
      locationText: "Izalco, Santa Ana, El Salvador",
      lat: 13.8128,
      lng: -89.6731,
      category: "volcano",
    },
    [
      {
        videoId: "tt-izalco-1",
        sentiment: "positive",
        sentimentScore: "0.84",
        likes: 11800,
        comments: 190,
        shares: 330,
        bookmarks: 610,
        summary: "Steep hike to the youngest volcano in El Salvador.",
        locationText: "Izalco, Santa Ana, El Salvador",
        transcript: "Subir el Izalco es duro pero la vista desde la cima vale todo.",
      },
      {
        videoId: "tt-izalco-2",
        sentiment: "negative",
        sentimentScore: "0.31",
        likes: 800,
        comments: 52,
        shares: 10,
        bookmarks: 15,
        summary: "Trail is poorly marked in sections.",
        locationText: "Izalco, Santa Ana, El Salvador",
        transcript: "En algunos tramos el sendero no está bien señalizado.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000017",
      canonicalName: "La Palma",
      locationText: "La Palma, Chalatenango, El Salvador",
      lat: 14.3125,
      lng: -89.1708,
      category: "town",
    },
    [
      {
        videoId: "tt-lapalma-1",
        sentiment: "positive",
        sentimentScore: "0.65",
        likes: 4100,
        comments: 62,
        shares: 85,
        bookmarks: 175,
        summary: "Birthplace of naive art; colorful handicrafts.",
        locationText: "La Palma, Chalatenango, El Salvador",
        transcript: "La Palma es famosa por el arte naif y los souvenirs pintados.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000018",
      canonicalName: "Apaneca",
      locationText: "Apaneca, Ahuachapán, El Salvador",
      lat: 13.8592,
      lng: -89.8081,
      category: "town",
    },
    [
      {
        videoId: "tt-apaneca-1",
        sentiment: "positive",
        sentimentScore: "0.78",
        likes: 7300,
        comments: 105,
        shares: 165,
        bookmarks: 320,
        summary: "Canopy zipline and coffee finca tours.",
        locationText: "Apaneca, Ahuachapán, El Salvador",
        transcript: "El canopy en Apaneca pasa sobre cafetales, experiencia única.",
      },
      {
        videoId: "tt-apaneca-2",
        sentiment: "positive",
        sentimentScore: "0.64",
        likes: 3500,
        comments: 55,
        shares: 70,
        bookmarks: 140,
        summary: "Cool mountain air; great escape from the heat.",
        locationText: "Apaneca, Ahuachapán, El Salvador",
        transcript: "El clima fresco de Apaneca es perfecto para escapar del calor.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000019",
      canonicalName: "Café Hunab Ku",
      locationText: "San Salvador, El Salvador",
      lat: 13.6929,
      lng: -89.2182,
      category: "cafe",
    },
    [
      {
        videoId: "tt-hunabku-1",
        sentiment: "positive",
        sentimentScore: "0.71",
        likes: 5600,
        comments: 88,
        shares: 95,
        bookmarks: 210,
        summary: "Specialty coffee roastery in the capital.",
        locationText: "San Salvador, El Salvador",
        transcript: "Hunab Ku tiene uno de los mejores cafés de especialidad en San Salvador.",
      },
      {
        videoId: "tt-hunabku-2",
        sentiment: "neutral",
        sentimentScore: "0.49",
        likes: 1200,
        comments: 25,
        shares: 18,
        bookmarks: 30,
        summary: "Small seating area; expect a wait on weekends.",
        locationText: "San Salvador, El Salvador",
        transcript: "El local es pequeño, los fines de semana hay fila.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000020",
      canonicalName: "Restaurante Acajutla",
      locationText: "Acajutla, Sonsonate, El Salvador",
      lat: 13.5922,
      lng: -89.8272,
      category: "restaurant",
    },
    [
      {
        videoId: "tt-acajutla-1",
        sentiment: "positive",
        sentimentScore: "0.63",
        likes: 3200,
        comments: 58,
        shares: 72,
        bookmarks: 130,
        summary: "Seafood platters at the port town.",
        locationText: "Acajutla, Sonsonate, El Salvador",
        transcript: "En Acajutla probamos mariscada fresca del puerto.",
      },
      {
        videoId: "tt-acajutla-2",
        sentiment: "negative",
        sentimentScore: "0.32",
        likes: 650,
        comments: 40,
        shares: 8,
        bookmarks: 12,
        summary: "Industrial area smell near the dock.",
        locationText: "Acajutla, Sonsonate, El Salvador",
        transcript: "Cerca del muelle huele a industria, no es lo más agradable.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000021",
      canonicalName: "Pupusería sin ubicación",
      locationText: "San Salvador, El Salvador",
      lat: null,
      lng: null,
      category: "restaurant",
    },
    [
      {
        videoId: "tt-nocoords-1",
        sentiment: "positive",
        sentimentScore: "0.60",
        likes: 2100,
        comments: 35,
        shares: 40,
        bookmarks: 55,
        summary: "Great pupusas but no geotag on the video.",
        locationText: "San Salvador, El Salvador",
        transcript: "Las pupusas estaban deliciosas pero el video no tenía ubicación.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000022",
      canonicalName: "Antigua Guatemala (erróneo)",
      locationText: "Antigua Guatemala, Sacatepéquez, Guatemala",
      lat: 14.5586,
      lng: -90.7335,
      category: "town",
    },
    [
      {
        videoId: "tt-guatemala-1",
        sentiment: "positive",
        sentimentScore: "0.75",
        likes: 8900,
        comments: 120,
        shares: 200,
        bookmarks: 380,
        summary: "Geocoded outside El Salvador bounds — suspicious location test.",
        locationText: "Antigua Guatemala, Sacatepéquez, Guatemala",
        transcript: "Video menciona El Salvador pero las coords apuntan a Guatemala.",
      },
    ],
  ),
  buildEntry(
    {
      id: "a1000001-0000-4000-8000-000000000023",
      canonicalName: "South Beach Miami (erróneo)",
      locationText: "Miami Beach, Florida, USA",
      lat: 25.7617,
      lng: -80.1918,
      category: "beach",
    },
    [
      {
        videoId: "tt-miami-1",
        sentiment: "neutral",
        sentimentScore: "0.45",
        likes: 1500,
        comments: 22,
        shares: 15,
        bookmarks: 28,
        summary: "Clearly outside El Salvador — bad geocode test case.",
        locationText: "Miami Beach, Florida, USA",
        transcript: "Las coordenadas caen en Miami, claramente fuera de El Salvador.",
      },
    ],
  ),
];

async function run() {
  const db = getDb();

  for (const entry of seed) {
    const [place] = await db
      .insert(places)
      .values(entry.place)
      .onConflictDoUpdate({
        target: places.canonicalName,
        set: {
          locationText: entry.place.locationText,
          lat: entry.place.lat,
          lng: entry.place.lng,
          category: entry.place.category,
          suspiciousLocation: entry.place.suspiciousLocation,
          mentionCount: entry.place.mentionCount,
          totalLikes: entry.place.totalLikes,
          totalComments: entry.place.totalComments,
          totalShares: entry.place.totalShares,
          totalBookmarks: entry.place.totalBookmarks,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    for (const mention of entry.mentions) {
      await db
        .insert(placeMentions)
        .values({ ...mention, placeId: place.id })
        .onConflictDoNothing({ target: [placeMentions.videoId, placeMentions.placeId] });
    }

    console.log(
      `Seeded ${place.canonicalName} (${place.id}) — ${entry.mentions.length} mentions, suspicious=${entry.place.suspiciousLocation}`,
    );
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
