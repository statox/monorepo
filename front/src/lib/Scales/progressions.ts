export type Chord = {
    degree: number;
    flat?: true;
    minor?: true;
};
export type Progression = {
    name: string;
    examples?: string[];
    chords: Chord[];
};

export const progressions: Progression[] = [
    {
        name: 'Axis progression',
        examples: [
            'Let it be',
            'Take on me',
            'Someone like you',
            "Don't step believin'",
            'Can you feel the love tonight',
            'Let it go'
        ],
        chords: [{ degree: 1 }, { degree: 5 }, { degree: 6, minor: true }, { degree: 4 }]
    },
    {
        name: 'Other axis progression',
        examples: [
            'Numb - Linkin Park',
            'Kids - MGMT',
            'Africa - Toto',
            'Rivers flow in you (piano thingy)',
            'Complicated - Avril Lavigne',
            'Grenade',
            'San Francisco',
            'Save tonight'
        ],
        chords: [{ degree: 6, minor: true }, { degree: 4 }, { degree: 1 }, { degree: 5 }]
    },
    {
        name: 'Third axis progression',
        examples: [
            "What's my age again?",
            'Umbrella - Rihanna',
            'Dragosta Din Tei',
            'Boulevard of broken dreams (chorus)',
            'Alejandro - Lady Gaga'
        ],
        chords: [{ degree: 4 }, { degree: 1 }, { degree: 5 }, { degree: 6, minor: true }]
    },
    {
        name: 'Andalusian cadence',
        examples: [
            'Hit the road Jack',
            'Good vibrations - The Beach boys',
            'Happy together',
            'Vanina'
        ],
        chords: [
            { degree: 1, minor: true },
            { degree: 7, flat: true },
            { degree: 6, flat: true },
            { degree: 5 }
        ]
    },
    {
        name: 'Aeolian vamp',
        examples: [
            'Rolling in the deep',
            'All along the watchtower',
            'Stairway to heaven',
            'My hear will go on',
            'Somebody that I used to know'
        ],
        chords: [
            { degree: 1, minor: true },
            { degree: 7, flat: true },
            { degree: 6, flat: true },
            { degree: 7, flat: true }
        ]
    },
    {
        name: 'Doo-Woop change',
        examples: [
            'I will always love you',
            'Crocodile rock',
            "Let's twist again",
            'Baby - Justin Bieber'
        ],
        chords: [{ degree: 1 }, { degree: 6, minor: true }, { degree: 4 }, { degree: 5 }]
    },
    {
        name: 'Major scale vamp',
        examples: ['Your body is a wonderland', 'All the small things - Blink 182'],
        chords: [{ degree: 1 }, { degree: 5 }, { degree: 4 }, { degree: 5 }]
    },
    {
        name: 'Mixolydyan vamp',
        examples: [
            'Hey Jude (Lalalalaa)',
            'Sympathy for the devil',
            "Sweet child o' mine",
            'Royals - Lorde',
            'Sweet home Alabama'
        ],
        chords: [{ degree: 1 }, { degree: 7, flat: true }, { degree: 4 }, { degree: 5 }]
    },
    {
        name: "pachelbel's cannon",
        chords: [
            { degree: 1 },
            { degree: 5 },
            { degree: 6, minor: true },
            { degree: 3, minor: true },
            { degree: 4 },
            { degree: 1 },
            { degree: 4 },
            { degree: 5 }
        ]
    },
    {
        name: 'Plagal cascade',
        examples: [
            'Wonderwall',
            'Boulevard of broken dreams (couplet)',
            'Mad world',
            'Pumped up kids',
            'Radioactive - Imagine Dragons'
        ],
        chords: [
            { degree: 1, minor: true },
            { degree: 3, flat: true },
            { degree: 7, flat: true },
            { degree: 4 }
        ]
    },
    {
        name: '"Can\'t stop" progression',
        examples: ["Can't stop", "Cant't hold us - Mackelmore & Ryan Lewis"],
        chords: [
            { degree: 1, minor: true },
            { degree: 7, flat: true },
            { degree: 5, minor: true },
            { degree: 6, flat: true }
        ]
    },
    {
        name: '"Closing time" progression',
        examples: ['Closing time - Semisonic', 'SOS - ABBA', 'Believe - Cher', 'All star (Shrek)'],
        chords: [{ degree: 1 }, { degree: 5 }, { degree: 2, minor: true }, { degree: 4 }]
    },
    {
        name: '"More than a feeling" progression',
        examples: ['More than a feeling', 'Mr Brightside - The Killers'],
        chords: [{ degree: 1 }, { degree: 4 }, { degree: 6, minor: true }, { degree: 5 }]
    },
    {
        name: 'Classic blues slow change',
        chords: [
            { degree: 1 },
            { degree: 1 },
            { degree: 1 },
            { degree: 1 },

            { degree: 4 },
            { degree: 4 },
            { degree: 1 },
            { degree: 1 },

            { degree: 5 },
            { degree: 4 },
            { degree: 1 },
            { degree: 5 }
        ]
    },
    {
        name: 'Classic blues quick change',
        chords: [
            { degree: 1 },
            { degree: 4 },
            { degree: 1 },
            { degree: 1 },

            { degree: 4 },
            { degree: 4 },
            { degree: 1 },
            { degree: 1 },

            { degree: 5 },
            { degree: 4 },
            { degree: 1 },
            { degree: 5 }
        ]
    },
    {
        name: 'Classic rock',
        chords: [
            { degree: 1 },
            { degree: 4 },
            { degree: 1 },
            { degree: 1 },

            { degree: 4 },
            { degree: 4 },
            { degree: 1 },
            { degree: 1 },

            { degree: 5 },
            { degree: 5 },
            { degree: 1 },
            { degree: 1 }
        ]
    }
];
