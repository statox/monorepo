export const musicSection = {
    name: 'Music',
    apps: [
        {
            name: 'Song Book',
            description: 'The list of my guitar tablatures',
            link: '/songbook'
        },
        {
            name: 'Metronome',
            description: 'Never miss a beat',
            link: '/metronome'
        },
        {
            name: 'Scales',
            description: 'A tool to visualize music scales and common chords progressions',
            link: '/scales'
        },
        {
            name: 'Chord Wheel',
            description: 'A tool to find the key of a song and work with scale degrees',
            link: '/chordwheel'
        },
        {
            name: 'Tap Tempo',
            description: 'Find a tempo by tapping it on the screen or the keyboard',
            link: '/taptempo'
        }
    ]
};

export const utilsSection = {
    name: 'Utils',
    apps: [
        {
            name: 'Notes',
            description: 'A list of notes for stuff I keep forgetting',
            link: '/notes'
        },
        {
            name: 'Clipboard',
            description: 'My universal clipboard',
            link: '/clipboard'
        },
        {
            name: 'Reactor',
            description: 'My collection of memes and various reaction images',
            link: '/reactor'
        },
        {
            name: 'Web Watcher',
            description: 'Monitor pages on the web and notify me when they change',
            link: '/webwatcher'
        },
        {
            name: 'Cookbook',
            description: 'Food recipes',
            link: '/cookbook'
        },
        {
            name: 'About',
            description: 'The about section of this website',
            link: '/about'
        }
    ]
};

export const personalSection = {
    name: 'Perso',
    apps: [
        {
            name: 'Browser home',
            description:
                'A page meant to be the default page of my browsers. Holding my important and often visited links',
            link: '/browser-home'
        },
        {
            name: 'Home tracker',
            description: 'My homemade home monitoring system',
            link: '/home-tracker'
        },
        {
            name: 'Personal tracker',
            description: 'Tracking me data',
            link: '/personal-tracker'
        }
    ]
};

export const allApps = [personalSection, utilsSection, musicSection];
