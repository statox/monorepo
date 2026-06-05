import { client2 } from '$lib/api';

const getOrCreateClientId = (): string => {
    const key = 'apps-statox-client-id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
};

const keepAliveClient = client2.withOptions({ keepalive: true });

export const logWebStatRecord = (webStateEvent: { path: string; action: string }) => {
    const webStatEvent = {
        clientTimestamp: Math.round(Date.now() / 1000),
        app: 'apps.statox.fr',
        clientId: getOrCreateClientId(),
        path: webStateEvent.path,
        action: webStateEvent.action
    };

    keepAliveClient.webStats.record(webStatEvent);
};
