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
            name: 'Ephemerides',
            description: 'Get data about the sun and moon visibility in Paris',
            link: '/ephemerides'
        },
        {
            name: 'Personal tracker',
            description: 'Tracking me data',
            link: '/personal-tracker'
        }
    ]
};

export const gameSection = {
    name: 'Games',
    apps: [
        {
            name: 'Gravitrip',
            description: 'Connect four pieces to wi',
            link: '/gravitrip'
        },
        {
            name: 'Sudoku',
            description: 'A classic Sudoku game. Grids are generated automatically.',
            link: 'https://statox.github.io/sudoku/game'
        },
        {
            name: 'Tic Tac Wow',
            description: 'Tic Tac Toe and different variants with AI opponents.',
            link: 'https://statox.github.io/tic-tac-wow/'
        },
        {
            name: '2048',
            description: 'The famous puzzle game from 2014.',
            link: 'https://statox.github.io/2048/'
        },
        {
            name: 'Reversi',
            description: 'A two players strategy board game with an AI opponent.',
            link: 'https://statox.github.io/reversi/'
        },
        {
            name: 'Triomaster',
            description:
                'My implementation of a famous 3-sided dominoes game, with an AI opponent.',
            link: 'https://statox.github.io/triomaster/'
        },
        {
            name: 'Asteroides',
            description: 'The old arcade game with a spaceship destroyins space rocks.',
            link: 'https://asteroides.statox.fr/'
        },
        {
            name: 'Minesweeper',
            description: 'The classical minesweeper game.',
            link: 'https://www.statox.fr/posts/2020/07/minesweeper/'
        }
    ]
};

export const allApps = [personalSection, utilsSection, musicSection, gameSection];
