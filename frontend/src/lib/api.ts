import {
  AuthResponse,
  User,
  Training,
  CupTeamRegistration,
  CupEditionResults,
  CupScheduleInfo,
  ContactMessage,
  AuditLog,
  CupTeamMember,
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
// Default capacity is 20 across all default trainings as requested
export const INITIAL_TRAININGS: Training[] = [
  {
    id: '1',
    title: 'BME Sportközpont Edzés - Hétfő',
    location: 'BME Sportközpont',
    date: '2026-11-02T18:00:00',
    type: 'Gyakorlás',
    maxParticipants: 20,
    description: 'Technikai és taktikai felkészülés, labdaérintések és közös játék.',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-30T09:30:00' },
      { id: 'u2', name: 'Nagy Anna', registeredAt: '2026-10-30T10:15:00' },
      { id: 'u3', name: 'Kiss Bence', registeredAt: '2026-10-30T11:00:00' },
      { id: 'u4', name: 'Szabó Eszter', registeredAt: '2026-10-30T11:20:00' },
      { id: 'u5', name: 'Horváth Márk', registeredAt: '2026-10-30T12:00:00' },
      { id: 'u6', name: 'Tóth Zsófia', registeredAt: '2026-10-30T13:45:00' },
    ],
    waitlist: [],
  },
  {
    id: '2',
    title: 'Óbudai Edzés - Kedd',
    location: 'Óbudai Egyetem - Doberdó úti Kollégium tornaterem',
    date: '2026-11-03T17:00:00',
    type: 'Meccs',
    maxParticipants: 20,
    description: 'Pörgős mérkőzések a Doberdó úti Kollégium tornatermében.',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-29T08:00:00' },
      { id: 'u2', name: 'Nagy Anna', registeredAt: '2026-10-29T08:05:00' },
      { id: 'u3', name: 'Kiss Bence', registeredAt: '2026-10-29T08:10:00' },
      { id: 'u4', name: 'Szabó Eszter', registeredAt: '2026-10-29T08:12:00' },
    ],
    waitlist: [],
  },
  {
    id: '3',
    title: 'Bercsényi Edzés - Szerda',
    location: 'Bercsényi Kollégium tornaterem',
    date: '2026-11-04T19:00:00',
    type: 'Szabad edzés',
    maxParticipants: 20,
    description: 'Kötetlen játék és jó hangulat a Bercsényi tornatermében.',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-28T10:00:00' },
      { id: 'u2', name: 'Kiss Bence', registeredAt: '2026-10-28T10:10:00' },
      { id: 'u4', name: 'Szabó Eszter', registeredAt: '2026-10-28T10:20:00' },
    ],
    waitlist: [],
  },
  {
    id: '4',
    title: 'Kármán Edzés - Csütörtök',
    location: 'Kármán Tódor Kollégium tornaterem',
    date: '2026-11-05T18:30:00',
    type: 'Gyakorlás',
    maxParticipants: 20,
    description: 'Edzés és meccsek a Kármán Tódor Kollégiumban.',
    participants: [
      { id: 'u2', name: 'Nagy Anna', registeredAt: '2026-10-28T10:00:00' },
      { id: 'u5', name: 'Horváth Márk', registeredAt: '2026-10-28T11:00:00' },
    ],
    waitlist: [],
  },
  {
    id: '5',
    title: 'BME Sporttelep Strandröpi - Szombat',
    location: 'BME Sporttelep - Strandröplabda pálya',
    date: '2026-11-07T10:00:00',
    type: 'Szabad edzés',
    maxParticipants: 20,
    description: 'Szabadtéri játék homokon a Bogdánfy úti BME Sporttelepen.',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-28T10:00:00' },
      { id: 'u3', name: 'Kiss Bence', registeredAt: '2026-10-28T10:30:00' },
    ],
    waitlist: [],
  },
  {
    id: '6',
    title: 'BME Sportközpont Vasárnapi Játék',
    location: 'BME Sportközpont',
    date: '2026-11-08T15:00:00',
    type: 'Meccs',
    maxParticipants: 20,
    description: 'Hétvégi mérkőzések a Bertalan Lajos utcai csarnokban.',
    participants: [
      { id: 'u1', name: 'Kovács Péter', registeredAt: '2026-10-29T10:00:00' },
      { id: 'u2', name: 'Nagy Anna', registeredAt: '2026-10-29T11:00:00' },
    ],
    waitlist: [],
  },
];

// Initial cup teams - Casual / Pro categories, Vegyes type, with isVik, isBme, isFemale checkboxes
export const INITIAL_CUP_TEAMS: CupTeamRegistration[] = [
  {
    id: 't1',
    teamName: 'Villany Ászok',
    captainName: 'Kovács Péter',
    captainEmail: 'kovacs.peter@ropikor.hu',
    playerCount: 6,
    type: 'Vegyes',
    category: 'Pro',
    edition: 'IV. VRK 2026',
    rulesAccepted: true,
    status: 'Jóváhagyva',
    createdAt: '2026-10-01T10:00:00',
    members: [
      { id: 'm1', name: 'Kovács Péter', isVik: true, isBme: true, isFemale: false },
      { id: 'm2', name: 'Nagy Anna', isVik: true, isBme: true, isFemale: true },
      { id: 'm3', name: 'Kiss Bence', isVik: true, isBme: true, isFemale: false },
      { id: 'm4', name: 'Szabó Eszter', isVik: false, isBme: true, isFemale: true },
      { id: 'm5', name: 'Horváth Márk', isVik: true, isBme: true, isFemale: false },
      { id: 'm6', name: 'Tóth Zsófia', isVik: false, isBme: false, isFemale: true },
    ],
  },
  {
    id: 't2',
    teamName: 'Schönherz Sáncolók',
    captainName: 'Balogh Tamás',
    captainEmail: 'tamas@ropikor.hu',
    playerCount: 6,
    type: 'Vegyes',
    category: 'Casual',
    edition: 'IV. VRK 2026',
    rulesAccepted: true,
    status: 'Jóváhagyva',
    createdAt: '2026-10-05T09:15:00',
    members: [
      { id: 'm7', name: 'Balogh Tamás', isVik: true, isBme: true, isFemale: false },
      { id: 'm8', name: 'Kerekes Luca', isVik: true, isBme: true, isFemale: true },
      { id: 'm9', name: 'Varga Dániel', isVik: true, isBme: true, isFemale: false },
      { id: 'm10', name: 'Molnár Gábor', isVik: true, isBme: true, isFemale: false },
      { id: 'm11', name: 'Farkas Lili', isVik: false, isBme: true, isFemale: true },
      { id: 'm12', name: 'Papp Balázs', isVik: false, isBme: false, isFemale: false },
    ],
  },
  {
    id: 't3',
    teamName: 'Mixed Signals',
    captainName: 'Takács Dóra',
    captainEmail: 'dora@ropikor.hu',
    playerCount: 6,
    type: 'Vegyes',
    category: 'Casual',
    edition: 'V. VRK 2027',
    rulesAccepted: true,
    status: 'Elküldve',
    createdAt: '2026-10-12T11:20:00',
    members: [
      { id: 'm13', name: 'Takács Dóra', isVik: true, isBme: true, isFemale: true },
      { id: 'm14', name: 'Bíró László', isVik: true, isBme: true, isFemale: false },
      { id: 'm15', name: 'Oláh Boglárka', isVik: true, isBme: true, isFemale: true },
      { id: 'm16', name: 'Gál Marcell', isVik: false, isBme: true, isFemale: false },
      { id: 'm17', name: 'Simon Vivien', isVik: false, isBme: false, isFemale: true },
      { id: 'm18', name: 'Németh Tamás', isVik: true, isBme: true, isFemale: false },
    ],
  },
];

// Initial cup results - ONLY Vegyes, no men-only entries
export const INITIAL_CUP_RESULTS: CupEditionResults[] = [
  {
    edition: 'I. VRK 2023',
    date: '2023. március 25.',
    results: [
      { placement: 1, teamName: 'BME VIK Röpi Kör', category: 'Vegyes', notes: 'Aranyérem, veretlen menetelés' },
      { placement: 2, teamName: 'Dirac Delta Spike', category: 'Vegyes', notes: 'Ezüstérem' },
      { placement: 3, teamName: 'Villámcsapás', category: 'Vegyes', notes: 'Bronzérem' },
    ],
  },
  {
    edition: 'II. VRK 2024',
    date: '2024. április 20.',
    results: [
      { placement: 1, teamName: 'Dirac Delta Spike', category: 'Vegyes', notes: 'Bajnok' },
      { placement: 2, teamName: 'Villany Ászok', category: 'Vegyes', notes: 'Ezüstérmes' },
      { placement: 3, teamName: 'LabView Legends', category: 'Vegyes', notes: 'Harmadik helyezett' },
    ],
  },
  {
    edition: 'III. VRK 2025',
    date: '2025. április 19.',
    results: [
      { placement: 1, teamName: 'Mixed Signals', category: 'Vegyes', notes: 'Vegyes torna aranyérmese' },
      { placement: 2, teamName: 'Schönherz Sáncolók', category: 'Vegyes', notes: 'Vegyes torna ezüstérmese' },
      { placement: 3, teamName: 'Villámcsapás', category: 'Vegyes', notes: 'Bronzérmes' },
    ],
  },
];

export const INITIAL_CUP_SCHEDULE: CupScheduleInfo & { fileData?: string } = {
  hasSchedule: true,
  fileName: 'IV_VRK_2026_lebonyolitas.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  updatedAt: '2026-11-01T12:00:00Z',
  fileData: 'SWTFcG9udCxQw6FseWEsQSBjc2FwYXQsQiBjc2FwYXQsS2F0ZWfDs3JpYSxKw6F0w6lrdmV6ZXTDtWsKMDk6MDAsMS4gcMOhbHlhLFZpbGxhbnkgw4Fzem9rLFNjaMO2bmhlcnogU8OhbmNvbMOzLFZlZ3llcyxSw7ZwaSBLw7ZyIGLDrcHLazoxMDowMCwxLiBww6FseWEsTWl4ZWQgU2lnbmFscyxJbmbDsyBCbG9rayxWZWd5ZXMsUsO2cGkgS8O2ciBiw61yw7NrCjExOjMwLDEuIHDDoWx5YSxFbMWRZMO2bnTDsSAxLEVsw5Zkw7ZudMWRIDIsVmVneWVzLFLDtnBpIEvDtnIgYsOtcsOzawoxMzowMCwxLiBww6FseWEsRMO2bnTDtSBBLETDtm50xZEgQixWZWd5ZXMsUsO2cGkgS8O2ciBiw61yw7Nr',
};

export const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: 'm1',
    name: 'Balogh Márton',
    email: 'marci.balogh@gmail.com',
    subject: 'Csatlakozási lehetőség',
    message: 'Sziasztok! Elsőéves hallgató vagyok, és szeretném megkérdezni, hogy teljesen kezdőként is lehet-e jönni a hétfői edzésekre?',
    isRead: false,
    createdAt: '2026-10-14T09:12:00',
  },
  {
    id: 'm2',
    name: 'Kovács Zsolt',
    email: 'zsolt.kovacs@vik.bme.hu',
    subject: 'Ötlet új edzésidőpontra',
    message: 'Szerintem szuper lenne vasárnap esténként is egy szabad játék edzés a Schönherz lakóinak.',
    isRead: true,
    createdAt: '2026-10-13T14:40:00',
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
    position: 'Körvezető',
    createdAt: '2024-09-01T10:00:00',
  },
  {
    id: 'u2',
    name: 'Nagy Anna',
    email: 'nagy.anna@ropikor.hu',
    neptun: 'ANNA02',
    role: 'ADMIN',
    isActiveMember: true,
    position: 'Körvezető helyettes',
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
    role: 'USER',
    isActiveMember: true,
    position: 'HR felelős',
    createdAt: '2024-09-01T10:00:00',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    action: 'Edzés kiírása',
    performedBy: 'Kovács Péter (Admin)',
    timestamp: '2026-10-30 17:30:12',
    details: 'BME Sportközpont Edzés - Hétfő meghirdetve (20 fő)',
  },
  {
    id: 'log-2',
    action: 'Kupa lebonyolítás táblázat feltöltve',
    performedBy: 'Kovács Péter (Admin)',
    timestamp: '2026-11-01 12:00:00',
    details: 'IV_VRK_2026_lebonyolitas_tablazat.xlsx',
  },
];

const STORAGE_KEYS = {
  TRAININGS: 'ropiweb_data_trainings',
  CUP_TEAMS: 'ropiweb_data_cup_teams',
  CUP_SCHEDULE: 'ropiweb_data_cup_schedule',
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
      // ignore
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
            position: 'Körvezető',
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
          position: 'Tag',
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
        const list = getStored<Training[]>(STORAGE_KEYS.TRAININGS, INITIAL_TRAININGS);
        const training = list.find((t) => t.id === trainingId);
        if (!training) throw new Error('Az edzés nem található');

        const partIndex = training.participants.findIndex((p) => p.id === userId);
        const waitIndex = training.waitlist.findIndex((w) => w.id === userId);

        if (partIndex !== -1) {
          training.participants.splice(partIndex, 1);
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
          body: JSON.stringify({
            ...data,
            category: data.category,
          }),
        });
        return response.team;
      } catch {
        const teams = getStored<CupTeamRegistration[]>(STORAGE_KEYS.CUP_TEAMS, INITIAL_CUP_TEAMS);
        const newTeam: CupTeamRegistration = {
          ...data,
          category: data.category,
          id: `t-${Date.now()}`,
          status: 'Elküldve',
          createdAt: new Date().toISOString(),
        };
        const updated = [newTeam, ...teams];
        setStored(STORAGE_KEYS.CUP_TEAMS, updated);
        return newTeam;
      }
    },

    updateMembers: async (id: string, members: Array<string | CupTeamMember>): Promise<CupTeamRegistration> => {
      try {
        return await apiClient<CupTeamRegistration>(`/api/cup/teams/${id}/members`, {
          method: 'PATCH',
          body: JSON.stringify({ members }),
        });
      } catch {
        const teams = getStored<CupTeamRegistration[]>(STORAGE_KEYS.CUP_TEAMS, INITIAL_CUP_TEAMS);
        const updated = teams.map((t) => {
          if (t.id === id) {
            const normalized = members.map((m) => (typeof m === 'string' ? { name: m } : m));
            return {
              ...t,
              members: normalized,
              playerCount: normalized.length,
            };
          }
          return t;
        });
        setStored(STORAGE_KEYS.CUP_TEAMS, updated);
        const item = updated.find((t) => t.id === id);
        if (!item) throw new Error('Csapat nem található');
        return item;
      }
    },

    getResults: async (): Promise<CupEditionResults[]> => {
      try {
        return await apiClient<CupEditionResults[]>('/api/cup/results', { requiresAuth: false });
      } catch {
        return INITIAL_CUP_RESULTS;
      }
    },

    getSchedule: async (): Promise<CupScheduleInfo> => {
      try {
        return await apiClient<CupScheduleInfo>('/api/cup/schedule', { requiresAuth: false });
      } catch {
        const stored = getStored<CupScheduleInfo>(STORAGE_KEYS.CUP_SCHEDULE, INITIAL_CUP_SCHEDULE);
        return stored;
      }
    },

    uploadSchedule: async (data: { fileName: string; fileData: string; mimeType?: string }): Promise<CupScheduleInfo> => {
      try {
        const res = await apiClient<{ schedule: CupScheduleInfo }>('/api/cup/schedule', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return res.schedule;
      } catch {
        const newSchedule: CupScheduleInfo & { fileData: string } = {
          hasSchedule: true,
          fileName: data.fileName,
          mimeType: data.mimeType || 'application/octet-stream',
          updatedAt: new Date().toISOString(),
          fileData: data.fileData,
        };
        setStored(STORAGE_KEYS.CUP_SCHEDULE, newSchedule);
        return newSchedule;
      }
    },

    deleteSchedule: async (): Promise<void> => {
      try {
        await apiClient('/api/cup/schedule', { method: 'DELETE' });
      } catch {
        // Fallback
      }
      setStored(STORAGE_KEYS.CUP_SCHEDULE, { hasSchedule: false, fileName: null, updatedAt: null });
    },

    downloadSchedule: async (): Promise<void> => {
      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${API_BASE_URL}/api/cup/schedule/download`, { headers });
        if (response.ok) {
          const blob = await response.blob();
          const disposition = response.headers.get('content-disposition');
          let filename = 'kupa_lebonyolitas.xlsx';
          if (disposition && disposition.indexOf('filename=') !== -1) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
            if (matches != null && matches[1]) {
              filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
            }
          }
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          return;
        }
      } catch {
        // Fallback to local stored fileData
      }

      const stored = getStored<any>(STORAGE_KEYS.CUP_SCHEDULE, INITIAL_CUP_SCHEDULE);
      if (stored && stored.hasSchedule && stored.fileData) {
        const byteCharacters = atob(stored.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: stored.mimeType || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = stored.fileName || 'kupa_lebonyolitas.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Jelenleg nem elérhető a kupa lebonyolítása');
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
        return await apiClient<ContactMessage>('/api/messages', {
          method: 'POST',
          body: JSON.stringify({
            senderName: data.name,
            senderEmail: data.email,
            subject: data.subject,
            body: data.message,
          }),
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
