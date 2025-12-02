import type { Link } from './types';

export const sections: { [sectionName: string]: Link[] } = {
    News: [
        {
            name: 'Tildes',
            url: 'https://tildes.net',
            icon: 'https://tildes.net/favicon.ico'
        },
        { name: 'Lobste.rs', url: 'https://lobste.rs', icon: 'https://lobste.rs/favicon.ico' },
        {
            name: 'Hacker news',
            url: 'https://news.ycombinator.com/',
            icon: 'https://news.ycombinator.com/favicon.ico'
        },
        {
            name: 'Ars Technica',
            url: 'https://arstechnica.com/',
            icon: 'https://arstechnica.com/favicon.ico'
        },
        {
            name: 'Hackaday',
            url: 'https://hackaday.com/blog/',
            icon: 'https://hackaday.com/favicon.ico'
        },
        {
            name: 'SuperCluster',
            url: 'https://www.supercluster.com/',
            icon: 'https://supercluster.com/favicon-32x32.png'
        },
        {
            name: 'Le Blob',
            url: 'https://leblob.fr/',
            icon: 'https://leblob.fr/themes/custom/blob/images/favicon/favicon.ico'
        }
    ],
    Fun: [
        {
            name: 'Discuit',
            url: 'https://discuit.org/',
            icon: '/browserhome/discuit.png'
        },
        {
            name: 'BlueSky',
            url: 'https://bsky.app/',
            icon: '/browserhome/bluesky.png'
        }
    ],
    Electronics: [
        {
            name: 'Adafruit Blog',
            url: 'https://blog.adafruit.com/',
            icon: 'https://blog.adafruit.com/favicon.ico'
        },
        {
            name: 'PCB Cadence',
            url: 'https://resources.pcb.cadence.com/blog',
            icon: 'https://content.cdntwrk.com/files/aHViPTg1NDMzJmNtZD1mYXZpY29uJnZlcnNpb249MTcwMDE2MDIyOSZleHQ9cG5nJnNpemU9MzImc2lnPTRhYTYzYjlkM2Y5ZTg2NjcxNzRhZTA3YTRkODJkNzgx/favicon.png'
        }
    ],
    Perso: [
        {
            name: 'IoT Dashboard',
            url: 'https://kibana.statox.fr/app/dashboards#/view/2993b516-b09b-4826-a1b2-e40834834627?_g=(time:(from:now-12h,to:now))',
            icon: 'https://www.elastic.co/favicon.ico'
        }
    ],
    Infra: [
        {
            name: 'Kibana',
            url: 'https://kibana.statox.fr',
            icon: 'https://www.elastic.co/favicon.ico'
        },
        {
            name: 'Panda - Portainer',
            url: 'https://panda-portainer.statox.fr/',
            icon: 'https://www.portainer.io/favicon.ico'
        },
        {
            name: 'Panda - Transmission',
            url: 'http://transmission.statox.fr',
            icon: 'https://transmissionbt.com/favicon.ico'
        }
    ],
    Github: [
        {
            name: 'PR - api.statox.fr',
            url: 'https://github.com/statox/api.statox.fr/pulls',
            icon: 'https://github.com/favicon.ico'
        },
        {
            name: 'PR - apps.statox.fr',
            url: 'https://github.com/statox/apps.statox.fr/pulls',
            icon: 'https://github.com/favicon.ico'
        },
        {
            name: 'PR - blog',
            url: 'https://github.com/statox/blog/pulls',
            icon: 'https://github.com/favicon.ico'
        }
    ]
};
