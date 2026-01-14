export const emotionWheel: {
    [category: string]:
        | {
              _color: string;
          }
        | {
              [subcategory: string]: {
                  [emotion: string]: {
                      en: string;
                  };
              };
          };
} = {
    fearful: {
        _color: '#FFA726',
        scared: {
            helpless: {
                en: 'helpless'
            },
            frightened: {
                en: 'frightened'
            }
        },
        anxious: {
            apprehensive: {
                en: 'apprehensive'
            },
            worried: {
                en: 'worried'
            }
        },
        insecure: {
            inadequate: {
                en: 'inadequate'
            },
            'self-conscious': {
                en: 'self-conscious'
            }
        },
        weak: {
            worthless: {
                en: 'worthless'
            },
            insignificant: {
                en: 'insignificant'
            }
        },
        rejected: {
            excluded: {
                en: 'excluded'
            },
            persecuted: {
                en: 'persecuted'
            }
        },
        threatened: {
            nervous: {
                en: 'nervous'
            },
            exposed: {
                en: 'exposed'
            }
        }
    },
    angry: {
        _color: '#EF5350',
        'let down': {
            betrayed: {
                en: 'betrayed'
            },
            resentful: {
                en: 'resentful'
            }
        },
        humiliated: {
            disrespected: {
                en: 'disrespected'
            },
            ridiculed: {
                en: 'ridiculed'
            }
        },
        bitter: {
            indignant: {
                en: 'indignant'
            },
            violated: {
                en: 'violated'
            }
        },
        mad: {
            furious: {
                en: 'furious'
            },
            jealous: {
                en: 'jealous'
            }
        },
        aggressive: {
            provoked: {
                en: 'provoked'
            },
            hostile: {
                en: 'hostile'
            }
        },
        frustrated: {
            infuriated: {
                en: 'infuriated'
            },
            annoyed: {
                en: 'annoyed'
            }
        },
        distant: {
            withdrawn: {
                en: 'withdrawn'
            },
            numb: {
                en: 'numb'
            }
        },
        critical: {
            skeptical: {
                en: 'skeptical'
            },
            dismissive: {
                en: 'dismissive'
            }
        }
    },
    disgusted: {
        _color: '#9E9E9E',
        disapproving: {
            judgmental: {
                en: 'judgmental'
            },
            disdainful: {
                en: 'disdainful'
            }
        },
        disappointed: {
            appalled: {
                en: 'appalled'
            },
            revolted: {
                en: 'revolted'
            }
        },
        awful: {
            nauseated: {
                en: 'nauseated'
            },
            detestable: {
                en: 'detestable'
            }
        },
        repelled: {
            horrified: {
                en: 'horrified'
            },
            hesitant: {
                en: 'hesitant'
            }
        }
    },
    sad: {
        _color: '#42A5F5',
        lonely: {
            isolated: {
                en: 'isolated'
            },
            abandoned: {
                en: 'abandoned'
            }
        },
        vulnerable: {
            victimized: {
                en: 'victimized'
            },
            fragile: {
                en: 'fragile'
            }
        },
        despair: {
            grief: {
                en: 'grief'
            },
            powerless: {
                en: 'powerless'
            }
        },
        guilty: {
            ashamed: {
                en: 'ashamed'
            },
            remorseful: {
                en: 'remorseful'
            }
        },
        depressed: {
            inferior: {
                en: 'inferior'
            },
            empty: {
                en: 'empty'
            }
        },
        hurt: {
            embarrassed: {
                en: 'embarrassed'
            },
            discouraged: {
                en: 'discouraged'
            }
        }
    },
    happy: {
        _color: '#FFEB3B',
        interested: {
            curious: {
                en: 'curious'
            },
            inquisitive: {
                en: 'inquisitive'
            }
        },
        proud: {
            successful: {
                en: 'successful'
            },
            confident: {
                en: 'confident'
            }
        },
        accepted: {
            respected: {
                en: 'respected'
            },
            valued: {
                en: 'valued'
            }
        },
        powerful: {
            courageous: {
                en: 'courageous'
            },
            creative: {
                en: 'creative'
            }
        },
        peaceful: {
            loving: {
                en: 'loving'
            },
            thankful: {
                en: 'thankful'
            }
        },
        trusting: {
            sensitive: {
                en: 'sensitive'
            },
            intimate: {
                en: 'intimate'
            }
        },
        optimistic: {
            hopeful: {
                en: 'hopeful'
            },
            inspired: {
                en: 'inspired'
            }
        },
        playful: {
            aroused: {
                en: 'aroused'
            },
            cheeky: {
                en: 'cheeky'
            }
        },
        content: {
            free: {
                en: 'free'
            },
            joyful: {
                en: 'joyful'
            }
        }
    },
    surprised: {
        _color: '#AB47BC',
        startled: {
            shocked: {
                en: 'shocked'
            },
            dismayed: {
                en: 'dismayed'
            }
        },
        confused: {
            disillusioned: {
                en: 'disillusioned'
            },
            perplexed: {
                en: 'perplexed'
            }
        },
        amazed: {
            astonished: {
                en: 'astonished'
            },
            awe: {
                en: 'awe'
            }
        },
        excited: {
            eager: {
                en: 'eager'
            },
            energetic: {
                en: 'energetic'
            }
        }
    },
    bad: {
        _color: '#66BB6A',
        bored: {
            indifferent: {
                en: 'indifferent'
            },
            apathetic: {
                en: 'apathetic'
            }
        },
        busy: {
            pressured: {
                en: 'pressured'
            },
            rushed: {
                en: 'rushed'
            }
        },
        stressed: {
            overwhelmed: {
                en: 'overwhelmed'
            },
            'out of control': {
                en: 'out of control'
            }
        },
        tired: {
            sleepy: {
                en: 'sleepy'
            },
            unfocused: {
                en: 'unfocused'
            }
        }
    }
};
