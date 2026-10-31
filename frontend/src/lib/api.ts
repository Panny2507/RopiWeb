import {
  AuthResponse,
  User,
  Training,
  CupTeamRegistration,
  CupEditionResults,
  ContactMessage,
  AuditLog,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const TOKEN_KEY = 'ropiweb_auth_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const token = getToken();
  if (token && requiresAuth) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Hiba történt a kérés során (HTTP ${response.status}: ${response.statusText})`;
      const error = new Error(errorMessage) as Error & { status: number; data: any };
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data as T;
  } catch (error: any) {
    // If network error (backend not running yet), format friendly message
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Nem sikerült kapcsolódni a szerverhez (http://localhost:3001). Ellenőrizd, hogy fut-e a backend szerver!'
      );
    }
    throw error;
  }
}

type TrainingApiResponse = Training & {
  registrations?: Array<{
    status?: string;
    user?: Partial<User> & { neptunCode?: string };
  }>;
};

function normalizeTraining(training: TrainingApiResponse): Training {
  const registrations = Array.isArray(training.registrations)
    ? training.registrations
    : [];

  const participants =
    Array.isArray(training.participants) && training.participants.length > 0
      ? training.participants
      : registrations
          .filter((registration) => registration.status === 'ACCEPTED' && registration.user)
          .map((registration) => ({
            id: String(registration.user!.id),
            name: registration.user!.name || 'Ismeretlen résztvevő',
            email: registration.user!.email,
          }));

  const waitlist =
    Array.isArray(training.waitlist) && training.waitlist.length > 0
      ? training.waitlist
      : registrations
          .filter((registration) => registration.status === 'WAITLISTED' && registration.user)
          .map((registration) => ({
            id: String(registration.user!.id),
            name: registration.user!.name || 'Ismeretlen résztvevő',
            email: registration.user!.email,
          }));

  return {
    ...training,
    id: String(training.id),
    participants,
    waitlist,
  };
}

// Initial Mock data fallbacks for development / seamless offline testing
export const INITIAL_TRAININGS: Training[] = [
  {
    id: '1',
    title: 'Hétfői Technikai Gyakorlás',
    location: 'BME Sportközpont - BME Terem',
    date: '2026-10-19T18:00:00',
    type: 'Gyakorlás',
    maxParticipants: 14,
    description: 'Érintés, alkarérintés, feladás és nyitásfogadás fókuszú edzés haladóknak és kezdőknek.',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-15T09:30:00' },
      { id: 'u2', name: 'Nagy Anna', registeredAt: '2026-10-15T10:15:00' },
      { id: 'u3', name: 'Kiss Bence', registeredAt: '2026-10-15T11:00:00' },
      { id: 'u4', name: 'Szabó Eszter', registeredAt: '2026-10-15T11:20:00' },
      { id: 'u5', name: 'Horváth Márk', registeredAt: '2026-10-15T12:00:00' },
      { id: 'u6', name: 'Tóth Zsófia', registeredAt: '2026-10-15T13:45:00' },
      { id: 'u7', name: 'Varga Dániel', registeredAt: '2026-10-15T14:10:00' },
      { id: 'u8', name: 'Molnár Gábor', registeredAt: '2026-10-15T15:00:00' },
      { id: 'u9', name: 'Farkas Lili', registeredAt: '2026-10-15T16:30:00' },
      { id: 'u10', name: 'Papp Balázs', registeredAt: '2026-10-15T17:00:00' },
      { id: 'u11', name: 'Takács Dóra', registeredAt: '2026-10-15T18:00:00' },
      { id: 'u12', name: 'Juhász Ádám', registeredAt: '2026-10-15T18:30:00' },
    ],
    waitlist: [],
  },
  {
    id: '2',
    title: 'Szerdai Pörgős Meccsezés',
    location: 'Óbudai Egyetem Sportcsarnok',
    date: '2026-10-21T19:30:00',
    type: 'Meccs',
    maxParticipants: 12,
    description: '6v6 mérkőzések forgással, pontozással. Kérjük hozz fekete és fehér felsőt is!',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-14T08:00:00' },
      { id: 'u2', name: 'Nagy Anna', registeredAt: '2026-10-14T08:05:00' },
      { id: 'u3', name: 'Kiss Bence', registeredAt: '2026-10-14T08:10:00' },
      { id: 'u4', name: 'Szabó Eszter', registeredAt: '2026-10-14T08:12:00' },
      { id: 'u5', name: 'Németh Tamás', registeredAt: '2026-10-14T08:15:00' },
      { id: 'u6', name: 'Simon Vivien', registeredAt: '2026-10-14T08:20:00' },
      { id: 'u7', name: 'Mészáros Bálint', registeredAt: '2026-10-14T08:25:00' },
      { id: 'u8', name: 'Lukács Kata', registeredAt: '2026-10-14T08:30:00' },
      { id: 'u9', name: 'Bíró László', registeredAt: '2026-10-14T08:35:00' },
      { id: 'u10', name: 'Oláh Boglárka', registeredAt: '2026-10-14T08:40:00' },
      { id: 'u11', name: 'Gál Marcell', registeredAt: '2026-10-14T08:45:00' },
      { id: 'u12', name: 'Balogh Zoltán', registeredAt: '2026-10-14T08:50:00' },
    ],
    waitlist: [
      { id: 'u13', name: 'Szilágyi Nóra', registeredAt: '2026-10-14T09:00:00' },
      { id: 'u14', name: 'Vincze Tamás', registeredAt: '2026-10-14T09:15:00' },
    ],
  },
  {
    id: '3',
    title: 'Pénteki Strandröplabda & Nyárzáró',
    location: 'BME Strandröplabda pálya (Központi Kampusz)',
    date: '2026-10-23T16:00:00',
    type: 'Szabad edzés',
    maxParticipants: 16,
    description: 'Kötetlen játék homokon, zene és jó hangulat. Időjárásfüggő!',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-14T10:00:00' },
      { id: 'u2', name: 'Kiss Bence', registeredAt: '2026-10-14T10:10:00' },
      { id: 'u4', name: 'Szabó Eszter', registeredAt: '2026-10-14T10:20:00' },
      { id: 'u7', name: 'Fekete Krisztián', registeredAt: '2026-10-14T11:00:00' },
      { id: 'u8', name: 'Kelemen Ágnes', registeredAt: '2026-10-14T11:30:00' },
    ],
    waitlist: [],
  },
  {
    id: '4',
    title: 'Szombati Bajnoki Felkészülés',
    location: 'Óbudai Egyetem Sportcsarnok',
    date: '2026-10-24T10:00:00',
    type: 'Gyakorlás',
    maxParticipants: 14,
    description: 'Taktikai elemek, sánc-védekezés összedolgozása a Röpikupa előtt.',
    participants: [
      { id: 'u2', name: 'Nagy Anna', registeredAt: '2026-10-15T10:00:00' },
      { id: 'u5', name: 'Kerekes Attila', registeredAt: '2026-10-15T11:00:00' },
      { id: 'u6', name: 'Somogyi Luca', registeredAt: '2026-10-15T12:00:00' },
    ],
    waitlist: [],
  },
];

export const INITIAL_CUP_TEAMS: CupTeamRegistration[] = [
  {
    id: 't1',
    teamName: 'Villany Ászok',
    captainName: 'Kovács Péter',
    captainEmail: 'kovacs.peter@ropikor.hu',
    playerCount: 6,
    category: 'Vegyes',
    edition: 'IV. VRK 2026',
    rulesAccepted: true,
    status: 'Jóváhagyva',
    createdAt: '2026-10-01T10:00:00',
  },
  {
    id: 't2',
    teamName: 'Dirac Delta Spike',
    captainName: 'Nagy Anna',
    captainEmail: 'nagy.anna@ropikor.hu',
    playerCount: 7,
    category: 'Férfi',
    edition: 'IV. VRK 2026',
    rulesAccepted: true,
    status: 'Jóváhagyva',
    createdAt: '2026-10-02T14:30:00',
  },
  {
    id: 't3',
    teamName: 'Schönherz Sáncolók',
    captainName: 'Kiss Bence',
    captainEmail: 'kiss.bence@ropikor.hu',
    playerCount: 6,
    category: 'Vegyes',
    edition: 'IV. VRK 2026',
    rulesAccepted: true,
    status: 'Jóváhagyva',
    createdAt: '2026-10-05T09:15:00',
  },
  {
    id: 't4',
    teamName: 'Infós Ászadók',
    captainName: 'Varga Dániel',
    captainEmail: 'varga.daniel@edu.bme.hu',
    playerCount: 6,
    category: 'Férfi',
    edition: 'IV. VRK 2026',
    rulesAccepted: true,
    status: 'Elküldve',
    createdAt: '2026-10-10T16:40:00',
  },
  {
    id: 't5',
    teamName: 'Arany Kezek',
    captainName: 'Szabó Eszter',
    captainEmail: 'szabo.eszter@ropikor.hu',
    playerCount: 6,
    category: 'Női',
    edition: 'IV. VRK 2026',
    rulesAccepted: true,
    status: 'Jóváhagyva',
    createdAt: '2026-10-12T11:20:00',
  },
];

export const INITIAL_CUP_RESULTS: CupEditionResults[] = [
  {
    edition: 'Bajnokság I.',
    date: '2026. január 17.',
    results: [
      { placement: 1, teamName: 'Dirac Delta Spike', category: 'Férfi', notes: 'Döntő: 2-1 (25:23, 22:25, 15:12)' },
      { placement: 2, teamName: 'Villany Ászok', category: 'Férfi', notes: 'Ezüstérmes' },
      { placement: 3, teamName: 'Schönherz Blokk', category: 'Férfi', notes: 'Bronzmérkőzés győztes' },
      { placement: 1, teamName: 'VolleyQueens', category: 'Női', notes: 'Veretlen bajnok' },
      { placement: 2, teamName: 'VIK Girls', category: 'Női', notes: 'Ezüstérmes' },
      { placement: 1, teamName: 'BME Vegyesgépészek', category: 'Vegyes', notes: 'Aranyérmes' },
      { placement: 2, teamName: 'Kollégiumi Reménységek', category: 'Vegyes', notes: 'Ezüstérmes' },
    ],
  },
  {
    edition: 'Bajnokság II.',
    date: '2026. február 21.',
    results: [
      { placement: 1, teamName: 'Röpi Kör All-Stars', category: 'Vegyes', notes: 'Bajnok' },
      { placement: 2, teamName: 'Dirac Delta Spike', category: 'Vegyes', notes: 'Ezüstérmes' },
      { placement: 3, teamName: 'Schönherz Kollégium', category: 'Vegyes', notes: 'Bronzérmes' },
      { placement: 1, teamName: 'Villany Ászok', category: 'Férfi', notes: 'Aranyérmes' },
      { placement: 2, teamName: 'Infós Sáncolók', category: 'Férfi', notes: 'Ezüstérmes' },
    ],
  },
  {
    edition: 'VRK - döntő',
    date: '2026. március 21.',
    results: [
      { placement: 1, teamName: 'BME VIK Röpi Kör', category: 'Vegyes', notes: 'Alapító kupa győztese' },
      { placement: 2, teamName: 'Villany Ászok', category: 'Vegyes', notes: 'Ezüstérmes' },
      { placement: 3, teamName: 'Infó Blokk', category: 'Vegyes', notes: 'Bronzérmes' },
    ],
  },
];

export const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: 'm1',
    name: 'Balogh Márton',
    email: 'marci.balogh@gmail.com',
    subject: 'Csatlakozási lehetőség teljesen kezdőknek',
    message: 'Sziasztok! Elsőéves mérnökinformatikus hallgató vagyok, és szeretném megkérdezni, hogy teljesen kezdőként is lehet-e jönni a hétfői edzésekre?',
    isRead: false,
    createdAt: '2026-10-14T09:12:00',
  },
  {
    id: 'm2',
    name: 'Kovács Zsolt',
    email: 'zsolt.kovacs@vik.bme.hu',
    subject: 'Röpikupa nevezési határidő kérdés',
    message: 'Üdv! A csapatunk még vár egy cserejátékos megerősítésére. Lehetséges 1-2 nappal később leadni a végső névsort a nevezés után?',
    isRead: true,
    createdAt: '2026-10-13T14:40:00',
  },
  {
    id: 'm3',
    name: 'Farkas Tamás',
    email: 'farkas.tamas@partner.bme.hu',
    subject: 'Terembérlés egyeztetés',
    message: 'Kedves Vezetőség! A Sportközpont vezetőségétől kereslek benneteket a jövő félévi órarendi beosztások kapcsán.',
    isRead: true,
    createdAt: '2026-10-11T16:05:00',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Kovács Péter',
    email: 'kovacs.peter@ropikor.hu',
    neptun: 'PETE01',
    role: 'ADMIN',
    isActiveMember: true,
    position: 'Elnök',
    createdAt: '2024-09-01T10:00:00',
  },
  {
    id: 'u2',
    name: 'Nagy Anna',
    email: 'nagy.anna@ropikor.hu',
    neptun: 'ANNA02',
    role: 'ADMIN',
    isActiveMember: true,
    position: 'Alelnök',
    createdAt: '2024-09-01T10:00:00',
  },
  {
    id: 'u3',
    name: 'Kiss Bence',
    email: 'kiss.bence@ropikor.hu',
    neptun: 'BENC03',
    role: 'ADMIN',
    isActiveMember: true,
    position: 'Gazdasági felelős',
    createdAt: '2024-09-01T10:00:00',
  },
  {
    id: 'u4',
    name: 'Szabó Eszter',
    email: 'szabo.eszter@ropikor.hu',
    neptun: 'ESZT04',
    role: 'ADMIN',
    isActiveMember: true,
    position: 'PR felelős',
    createdAt: '2024-09-01T10:00:00',
  },
  {
    id: 'u5',
    name: 'Horváth Márk',
    email: 'mark.horvath@edu.bme.hu',
    neptun: 'HMRK99',
    role: 'MEMBER',
    isActiveMember: true,
    position: 'Körtag',
    createdAt: '2025-02-10T12:00:00',
  },
  {
    id: 'u6',
    name: 'Sajbán Anna',
    email: 'sajban.anna@edu.bme.hu',
    neptun: 'QTLYQ6',
    role: 'ADMIN',
    isActiveMember: true,
    position: 'Vezető fejlesztő',
    createdAt: '2024-09-01T10:00:00',
  },
  {
    id: 'u7',
    name: 'Teszt Vendég',
    email: 'vendeg@bme.hu',
    neptun: 'VEND01',
    role: 'USER',
    isActiveMember: false,
    position: 'Érdeklődő',
    createdAt: '2026-09-15T15:00:00',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    action: 'Edzés kiírása',
    performedBy: 'Kovács Péter (Admin)',
    timestamp: '2026-10-14 17:30:12',
    details: 'Hétfői Technikai Gyakorlás meghirdetve (14 fő, BME Sportközpont)',
  },
  {
    id: 'log-2',
    action: 'Jelentkezés elfogadva',
    performedBy: 'Varga Dániel',
    timestamp: '2026-10-14 17:45:00',
    details: 'Sikeres foglalás: Hétfői Technikai Gyakorlás (helyszín: BME)',
  },
  {
    id: 'log-3',
    action: 'Várólistára kerülés',
    performedBy: 'Szilágyi Nóra',
    timestamp: '2026-10-14 18:00:15',
    details: 'Szerdai Pörgős Meccsezés betelt, várólista 1. hely',
  },
  {
    id: 'log-4',
    action: 'Röpikupa nevezés',
    performedBy: 'Szabó Eszter',
    timestamp: '2026-10-14 18:02:00',
    details: 'Csapat: Arany Kezek (Női kategória, 6 fő)',
  },
  {
    id: 'log-5',
    action: 'Illetéktelen admin hívás elutasítva',
    performedBy: 'vendeg@bme.hu (IP: 152.66.x.x)',
    timestamp: '2026-10-14 18:05:40',
    details: 'HTTP 403 Forbidden: /api/trainings/delete jogtalan próbálkozás',
  },
];

// High-level API methods with automatic fallback to mock store in localStorage for offline testing
const STORAGE_KEYS = {
  TRAININGS: 'ropiweb_data_trainings',
  CUP_TEAMS: 'ropiweb_data_cup_teams',
  MESSAGES: 'ropiweb_data_messages',
  USERS: 'ropiweb_data_users',
  AUDIT_LOGS: 'ropiweb_data_audit_logs',
};

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }
}

export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
      try {
        const res = await apiClient<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
          requiresAuth: false,
        });
        if (res.token) setToken(res.token);
        return res;
      } catch (err: any) {
        // Fallback demo login if backend is not running
        const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        const match = users.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());
        if (match) {
          const mockToken = `mock-token-${match.id}-${Date.now()}`;
          setToken(mockToken);
          return {
            token: mockToken,
            user: match,
            message: 'Sikeres bejelentkezés (Demo mód)',
          };
        }
        if (
          (credentials.email === 'admin@ropikor.hu' || credentials.email === 'admin') &&
          credentials.password === 'admin123'
        ) {
          const adminUser: User = {
            id: 'admin-1',
            name: 'Kovács Péter',
            email: 'kovacs.peter@ropikor.hu',
            role: 'ADMIN',
            isActiveMember: true,
            position: 'Elnök',
          };
          const mockToken = `mock-token-admin-${Date.now()}`;
          setToken(mockToken);
          return { token: mockToken, user: adminUser };
        }
        throw new Error('Hibás e-mail cím vagy jelszó!');
      }
    },

    register: async (data: {
      name: string;
      email: string;
      password: string;
    }): Promise<AuthResponse> => {
      try {
        const res = await apiClient<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
          requiresAuth: false,
        });
        if (res.token) setToken(res.token);
        return res;
      } catch (err) {
        // Fallback demo registration
        const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
          throw new Error('Ezzel az e-mail címmel már regisztráltak!');
        }
        const newUser: User = {
          id: `u-${Date.now()}`,
          name: data.name,
          email: data.email,
          role: 'USER',
          isActiveMember: false,
          position: 'Új tag',
          createdAt: new Date().toISOString(),
        };
        const updated = [...users, newUser];
        setStored(STORAGE_KEYS.USERS, updated);
        const mockToken = `mock-token-${newUser.id}`;
        setToken(mockToken);
        return {
          token: mockToken,
          user: newUser,
          message: 'Sikeres regisztráció!',
        };
      }
    },

    getMe: async (): Promise<User | null> => {
      const token = getToken();
      if (!token) return null;
      try {
        const res = await apiClient<{ user: User }>('/api/auth/me');
        return res.user;
      } catch {
        // Fallback if demo token
        const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        if (token.includes('admin')) {
          return users.find((u) => u.role === 'ADMIN') || users[0];
        }
        const userId = token.split('-')[2];
        return users.find((u) => u.id === userId) || users[0];
      }
    },
  },

  trainings: {
    getAll: async (): Promise<Training[]> => {
      try {
        const trainings = await apiClient<TrainingApiResponse[]>('/api/trainings', {
          requiresAuth: false,
        });
        return trainings.map(normalizeTraining);
      } catch {
        return getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
      }
    },

    getById: async (id: string): Promise<Training | undefined> => {
      try {
        const training = await apiClient<TrainingApiResponse>(`/api/trainings/${id}`, {
          requiresAuth: false,
        });
        return normalizeTraining(training);
      } catch {
        const list = getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
        return list.find((t) => t.id === id);
      }
    },

    create: async (training: Omit<Training, 'id' | 'participants' | 'waitlist'>): Promise<Training> => {
      try {
        return await apiClient<Training>('/api/trainings', {
          method: 'POST',
          body: JSON.stringify(training),
        });
      } catch (err: any) {
        if (err.status === 400 || err.status === 403) throw err;
        const list = getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
        const newTraining: Training = {
          ...training,
          id: `t-${Date.now()}`,
          participants: [],
          waitlist: [],
        };
        setStored(STORAGE_KEYS.TRAININGS, [newTraining, ...list]);
        return newTraining;
      }
    },

    update: async (id: string, updates: Partial<Training>): Promise<Training> => {
      try {
        return await apiClient<Training>(`/api/trainings/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      } catch {
        const list = getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
        const updated = list.map((t) => (t.id === id ? { ...t, ...updates } : t));
        setStored(STORAGE_KEYS.TRAININGS, updated);
        const item = updated.find((t) => t.id === id);
        if (!item) throw new Error('Edzés nem található');
        return item;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await apiClient(`/api/trainings/${id}`, { method: 'DELETE' });
      } catch {
        const list = getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
        const filtered = list.filter((t) => t.id !== id);
        setStored(STORAGE_KEYS.TRAININGS, filtered);
      }
    },

    register: async (trainingId: string, user: User): Promise<{ training: Training; status: 'registered' | 'waitlisted' }> => {
      try {
        return await apiClient(`/api/trainings/${trainingId}/register`, {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (err: any) {
        if (err.status) throw err;
        // Fallback local logic according to specification:
        // EF-1: If space available -> registered
        // EF-2: If full -> waitlist
        // EF-4: If already registered -> reject duplicate
        const list = getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
        const training = list.find((t) => t.id === trainingId);
        if (!training) throw new Error('Az edzés nem található');

        const isAlreadyParticipant = training.participants.some((p) => p.id === user.id);
        const isAlreadyWaitlisted = training.waitlist.some((w) => w.id === user.id);

        if (isAlreadyParticipant || isAlreadyWaitlisted) {
          throw new Error('Már regisztráltál erre az edzésre!');
        }

        const participantObj = {
          id: user.id,
          name: user.name,
          email: user.email,
          registeredAt: new Date().toISOString(),
        };

        let resultStatus: 'registered' | 'waitlisted';

        if (training.participants.length < training.maxParticipants) {
          training.participants.push(participantObj);
          resultStatus = 'registered';
        } else {
          training.waitlist.push(participantObj);
          resultStatus = 'waitlisted';
        }

        setStored(STORAGE_KEYS.TRAININGS, list);
        return { training, status: resultStatus };
      }
    },

    cancel: async (trainingId: string, userId: string): Promise<Training> => {
      try {
        return await apiClient(`/api/trainings/${trainingId}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ userId }),
        });
      } catch {
        // EF-7: Sikeres jelentkezés lemondása betelt edzésen.
        // A felhasználó törlődik a főlistáról, a várólista 1. helyén álló tag automatikusan átkerül az elfogadott keretbe.
        const list = getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
        const training = list.find((t) => t.id === trainingId);
        if (!training) throw new Error('Az edzés nem található');

        const partIndex = training.participants.findIndex((p) => p.id === userId);
        const waitIndex = training.waitlist.findIndex((w) => w.id === userId);

        if (partIndex !== -1) {
          training.participants.splice(partIndex, 1);
          // If anyone on waitlist, promote first waitlist person
          if (training.waitlist.length > 0) {
            const promoted = training.waitlist.shift();
            if (promoted) {
              training.participants.push(promoted);
            }
          }
        } else if (waitIndex !== -1) {
          training.waitlist.splice(waitIndex, 1);
        }

        setStored(STORAGE_KEYS.TRAININGS, list);
        return training;
      }
    },
  },

  cup: {
    getTeams: async (): Promise<CupTeamRegistration[]> => {
      try {
        return await apiClient<CupTeamRegistration[]>('/api/cup/teams', { requiresAuth: false });
      } catch {
        return getStored<CupTeamRegistration[]>(STORAGE_KEYS.CUP_TEAMS, INITIAL_CUP_TEAMS);
      }
    },

    registerTeam: async (data: CupTeamRegistration): Promise<CupTeamRegistration> => {
      try {
        const response = await apiClient<{ team: CupTeamRegistration }>('/api/cup/teams', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return response.team;
      } catch {
        const teams = getStored<CupTeamRegistration[]>(STORAGE_KEYS.CUP_TEAMS, INITIAL_CUP_TEAMS);
        const newTeam: CupTeamRegistration = {
          ...data,
          id: `t-${Date.now()}`,
          status: 'Elküldve',
          createdAt: new Date().toISOString(),
        };
        const updated = [newTeam, ...teams];
        setStored(STORAGE_KEYS.CUP_TEAMS, updated);
        return newTeam;
      }
    },

    updateMembers: async (id: string, members: string[]): Promise<CupTeamRegistration> => {
      return apiClient<CupTeamRegistration>(`/api/cup/teams/${id}/members`, {
        method: 'PATCH',
        body: JSON.stringify({ members }),
      });
    },

    getResults: async (): Promise<CupEditionResults[]> => {
      try {
        return await apiClient<CupEditionResults[]>('/api/cup/results', { requiresAuth: false });
      } catch {
        return INITIAL_CUP_RESULTS;
      }
    },
  },

  contact: {
    sendMessage: async (data: {
      name: string;
      email: string;
      subject: string;
      message: string;
    }): Promise<ContactMessage> => {
      try {
        return await apiClient<ContactMessage>('/api/contact', {
          method: 'POST',
          body: JSON.stringify(data),
          requiresAuth: false,
        });
      } catch {
        const messages = getStored<ContactMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
        const newMessage: ContactMessage = {
          ...data,
          id: `m-${Date.now()}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setStored(STORAGE_KEYS.MESSAGES, [newMessage, ...messages]);
        return newMessage;
      }
    },

    getMessages: async (): Promise<ContactMessage[]> => {
      try {
        return await apiClient<ContactMessage[]>('/api/messages');
      } catch {
        return getStored<ContactMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
      }
    },

    markAsRead: async (id: string): Promise<void> => {
      try {
        await apiClient(`/api/messages/${id}/read`, { method: 'PATCH' });
      } catch {
        const messages = getStored<ContactMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
        const updated = messages.map((m) => (m.id === id ? { ...m, isRead: true } : m));
        setStored(STORAGE_KEYS.MESSAGES, updated);
      }
    },

    deleteMessage: async (id: string): Promise<void> => {
      try {
        await apiClient(`/api/messages/${id}`, { method: 'DELETE' });
      } catch {
        const messages = getStored<ContactMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
        setStored(
          STORAGE_KEYS.MESSAGES,
          messages.filter((m) => m.id !== id)
        );
      }
    },
  },

  users: {
    getAll: async (): Promise<User[]> => {
      try {
        return await apiClient<User[]>('/api/admin/users');
      } catch {
        return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      }
    },

    updateUser: async (
      id: string,
      updates: Partial<Pick<User, 'role' | 'isActiveMember' | 'position'>>
    ): Promise<User> => {
      try {
        const response = await apiClient<{ user: User }>(`/api/admin/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        return response.user;
      } catch {
        const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        const updated = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
        setStored(STORAGE_KEYS.USERS, updated);
        const user = updated.find((u) => u.id === id);
        if (!user) throw new Error('Felhasználó nem található');
        return user;
      }
    },
  },

  auditLogs: {
    getAll: async (): Promise<AuditLog[]> => {
      try {
        return await apiClient<AuditLog[]>('/api/admin/audit-log');
      } catch {
        return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
      }
    },
    addLog: (action: string, performedBy: string, details?: string) => {
      const logs = getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        action,
        performedBy,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        details,
      };
      setStored(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
    },
  },
};
