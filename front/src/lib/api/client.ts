import type { UserProfile } from '$lib/auth2';
import type { ClipboardEntry } from '$lib/Clipboard/types';
import type { IngredientMeta, RecipeFull, RecipeMeta } from '$lib/Cookbook/types';
import type {
    Ephemerides,
    HomeTrackerLatestResponse,
    PressureHistoryItem,
    SensorMetadata,
    WeatherForecast
} from '$lib/HomeTracker/types';
import type { PersonalEvent } from '$lib/PersonalTracker/types';
import type { ReactorEntryForPublic } from '$lib/Reactor/types';
import type { ChordVisitItem, LinksChecks, RawChord } from '$lib/Songbook/types';
import type { WatchedContent } from '$lib/WebWatcher/types';

import type {
    Auth_Login_Input,
    Chords_AddLinkVisit_Input,
    Chords_UpdateAll_Input,
    Clipboard_AddEntry_Input,
    Clipboard_DeleteEntry_Input,
    Cookbook_AddRecipe_Input,
    Cookbook_GetRecipe_Input,
    HomeTracker_HistogramData_Input,
    HomeTracker_HistogramDataPublic_Input,
    HomeTracker_UpdateSensorMetadata_Input,
    PersonalTracker_Upload_Input,
    WebWatchers_CreateWatcher_Input,
    WebWatchers_DeleteWatcher_Input,
    WebWatchers_ToggleWatcherEnabled_Input
} from './client-types';
import { requestAPIGet, requestAPIPost } from './helpers';

export const client = {
    auth: {
        login: (data: Auth_Login_Input) => requestAPIPost<void>({ path: '/auth/login', data }),
        logout: () => requestAPIPost<void>({ path: '/auth/logout', data: {} }),
        me: () => requestAPIPost<UserProfile>({ path: '/auth/me', data: {} })
    },
    chords: {
        addLinkVisit: (data: Chords_AddLinkVisit_Input) =>
            requestAPIPost({ path: '/chords/addLinkVisit', data }),
        checkLinks: () => requestAPIGet<LinksChecks>({ path: '/chords/checkLinks' }),
        getAll: () => requestAPIGet<RawChord[]>({ path: '/chords/getAll' }),
        getLinksVisitsCount: () =>
            requestAPIGet<ChordVisitItem[]>({ path: '/chords/getLinksVisitsCount' }),
        updateAll: (data: Chords_UpdateAll_Input) =>
            requestAPIPost({ path: '/chords/updateAll', data })
    },
    clipboard: {
        addEntry: (data: Clipboard_AddEntry_Input) =>
            requestAPIPost<void>({ path: '/clipboard/addEntry', data }),
        deleteEntry: (data: Clipboard_DeleteEntry_Input) =>
            requestAPIPost<void>({ path: '/clipboard/deleteEntry', data }),
        getAllEntries: () => requestAPIGet<ClipboardEntry[]>({ path: '/clipboard/getAllEntries' }),
        getPublicEntries: () =>
            requestAPIGet<ClipboardEntry[]>({ path: '/clipboard/getPublicEntries' })
    },
    cookbook: {
        addRecipe: (data: Cookbook_AddRecipe_Input) =>
            requestAPIPost({ path: '/cookbook/addRecipe', data }),
        listRecipes: () =>
            requestAPIGet<{ recipes: RecipeMeta[] }>({ path: '/cookbook/listRecipes' }),
        listIngedients: () =>
            requestAPIGet<{ ingredients: IngredientMeta[] }>({ path: '/cookbook/listIngredients' }),
        getRecipe: (data: Cookbook_GetRecipe_Input) =>
            requestAPIPost<RecipeFull>({ path: '/cookbook/getRecipe', data })
    },
    gravitrips: {
        getNewGame: () => requestAPIGet<{ gameId: string }>({ path: '/gravitrips/getNewGame' })
    },
    homeTracker: {
        getEphemerides: () =>
            requestAPIGet<{ ephemerides: Ephemerides }>({ path: '/homeTracker/getEphemerides' }),
        getSensorsDataForDashboard: () =>
            requestAPIGet<{ sensors: SensorMetadata[] }>({
                path: '/homeTracker/getSensorsDataForDashboard'
            }),
        getWeatherForecast: () =>
            requestAPIGet<{ forecast: WeatherForecast; pressureHistory: PressureHistoryItem[] }>({
                path: '/homeTracker/getWeatherForecast'
            }),
        histogramData: (data: HomeTracker_HistogramData_Input) =>
            requestAPIPost<HomeTrackerLatestResponse>({ path: '/homeTracker/histogramData', data }),
        histogramDataPublic: (data: HomeTracker_HistogramDataPublic_Input) =>
            requestAPIPost<HomeTrackerLatestResponse>({
                path: '/homeTracker/histogramDataPublic',
                data
            }),
        updateSensorMetadata: (data: HomeTracker_UpdateSensorMetadata_Input) =>
            requestAPIPost<void>({
                path: '/homeTracker/updateSensorMetadata',
                data
            })
    },
    personalTracker: {
        upload: (data: PersonalTracker_Upload_Input) =>
            requestAPIPost<void>({ path: '/personalTracker/upload', data }),
        getAll: () =>
            requestAPIGet<{ events: PersonalEvent[] }>({ path: '/personalTracker/getAll' })
    },
    reactor: {
        getEntriesForPublic: () =>
            requestAPIGet<ReactorEntryForPublic[]>({ path: '/reactor/getEntriesForPublic' })
    },
    webWatchers: {
        createWatcher: (data: WebWatchers_CreateWatcher_Input) =>
            requestAPIPost<void>({ path: '/webWatcher/createWatcher', data }),
        deleteWatcher: (data: WebWatchers_DeleteWatcher_Input) =>
            requestAPIPost<void>({ path: '/webWatcher/deleteWatcher', data }),
        getAllWatchers: () =>
            requestAPIGet<WatchedContent[]>({ path: '/webWatcher/getAllWatchers' }),
        toggleWatcherEnabled: (data: WebWatchers_ToggleWatcherEnabled_Input) =>
            requestAPIPost<void>({ path: '/webWatcher/toggleWatcherEnabled', data })
    }
};
