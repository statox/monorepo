// AUTO-GENERATED - do not edit. Run: cd back && npm run generate:sdk
// Generated on: 2026-05-26T21:58:32.413Z

import type { FromSchema } from 'json-schema-to-ts';
import type { Endpoint, FetchFn } from '../types.js';

export const schemas = {
  "auth_login_Input": {
    "type": "object",
    "required": [
      "username",
      "password"
    ],
    "additionalProperties": false,
    "properties": {
      "username": {
        "type": "string"
      },
      "password": {
        "type": "string"
      }
    }
  },
  "auth_login_Output": {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false
  },
  "auth_logout_Input": {
    "type": "object",
    "required": [],
    "additionalProperties": false,
    "properties": {}
  },
  "auth_logout_Output": {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false
  },
  "auth_me_Input": {
    "type": "object",
    "required": [],
    "additionalProperties": false,
    "properties": {}
  },
  "auth_me_Output": {
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "logged_out"
            ]
          }
        },
        "required": [
          "status"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "logged_in"
            ]
          },
          "user": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number"
              },
              "username": {
                "type": "string"
              },
              "scopes": {
                "type": "array",
                "items": {
                  "type": "string",
                  "enum": [
                    "admin",
                    "public",
                    "homeTracker",
                    "personalTracker"
                  ]
                }
              }
            },
            "required": [
              "id",
              "username",
              "scopes"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "status",
          "user"
        ],
        "additionalProperties": false
      }
    ]
  },
  "chords_addLinkVisit_Input": {
    "type": "object",
    "required": [
      "url"
    ],
    "additionalProperties": false,
    "properties": {
      "url": {
        "type": "string"
      }
    }
  },
  "chords_addLinkVisit_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "chords_checkLinks_Output": {
    "type": "object",
    "properties": {
      "nbChecks": {
        "type": "number"
      },
      "nbSkipped": {
        "type": "number"
      },
      "nbFails": {
        "type": "number"
      },
      "timestamp": {
        "type": "number"
      },
      "fails": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string"
            },
            "chord": {
              "type": "object",
              "properties": {
                "artist": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "creationDate": {
                  "type": "number"
                },
                "tags": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "required": [
                "artist",
                "title",
                "url",
                "creationDate",
                "tags"
              ],
              "additionalProperties": false
            },
            "error": {
              "type": "object"
            }
          },
          "required": [
            "status",
            "chord"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "nbChecks",
      "nbSkipped",
      "nbFails",
      "timestamp",
      "fails"
    ],
    "additionalProperties": false
  },
  "chords_getAll_Output": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "artist": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "url": {
          "type": "string"
        },
        "creationDate": {
          "type": "number"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "artist",
        "title",
        "url",
        "creationDate",
        "tags"
      ]
    }
  },
  "chords_getLinksVisitsCount_Output": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string"
        },
        "count": {
          "type": "number"
        },
        "lastAccessDateUnix": {
          "type": "number"
        }
      },
      "required": [
        "url",
        "count",
        "lastAccessDateUnix"
      ],
      "additionalProperties": false
    }
  },
  "chords_updateAll_Input": {
    "type": "object",
    "required": [
      "chords"
    ],
    "additionalProperties": false,
    "properties": {
      "chords": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "artist",
            "title",
            "url",
            "creationDate",
            "tags"
          ],
          "additionalProperties": false,
          "properties": {
            "artist": {
              "type": "string",
              "minLength": 1
            },
            "title": {
              "type": "string",
              "minLength": 1
            },
            "url": {
              "type": "string",
              "minLength": 1
            },
            "creationDate": {
              "oneOf": [
                {
                  "type": "number",
                  "minimum": 1600000000000
                },
                {
                  "type": "number",
                  "enum": [
                    0
                  ]
                }
              ]
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      }
    }
  },
  "chords_updateAll_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "clipboard_addEntry_Input": {
    "type": "object",
    "required": [
      "name"
    ],
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string"
      },
      "content": {
        "type": "string"
      },
      "ttlSeconds": {
        "type": [
          "number",
          "string"
        ],
        "minimum": 0
      },
      "isPublic": {
        "type": [
          "boolean",
          "string"
        ]
      }
    }
  },
  "clipboard_addEntry_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "clipboard_deleteEntry_Input": {
    "type": "object",
    "required": [
      "name"
    ],
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string"
      }
    }
  },
  "clipboard_deleteEntry_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "clipboard_getAllEntries_Output": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "content": {
          "type": "string"
        },
        "creationDateUnix": {
          "type": "number"
        },
        "ttl": {
          "type": "number"
        },
        "isPublic": {
          "type": "boolean"
        },
        "linkId": {
          "type": "string"
        },
        "s3Key": {
          "type": [
            "string"
          ]
        },
        "s3PresignedUrl": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "content",
        "creationDateUnix",
        "ttl",
        "isPublic",
        "linkId"
      ],
      "additionalProperties": false
    }
  },
  "clipboard_getPublicEntries_Output": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "content": {
          "type": "string"
        },
        "creationDateUnix": {
          "type": "number"
        },
        "ttl": {
          "type": "number"
        },
        "isPublic": {
          "type": "boolean"
        },
        "linkId": {
          "type": "string"
        },
        "s3Key": {
          "type": "string"
        },
        "s3PresignedUrl": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "content",
        "creationDateUnix",
        "ttl",
        "isPublic",
        "linkId"
      ],
      "additionalProperties": false
    }
  },
  "clipboard_view_Output": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "content": {
          "type": "string"
        },
        "creationDateUnix": {
          "type": "number"
        },
        "ttl": {
          "type": "number"
        },
        "isPublic": {
          "type": "boolean"
        },
        "linkId": {
          "type": "string"
        },
        "s3Key": {
          "type": [
            "string",
            "null"
          ]
        },
        "s3PresignedUrl": {
          "type": "string"
        },
        "contentIsLink": {
          "type": "boolean"
        }
      },
      "required": [
        "id",
        "name",
        "content",
        "creationDateUnix",
        "ttl",
        "isPublic",
        "linkId"
      ],
      "additionalProperties": false
    }
  },
  "cookbook_addRecipe_Input": {
    "type": "object",
    "required": [
      "name",
      "content",
      "ingredients"
    ],
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string"
      },
      "content": {
        "type": "string"
      },
      "ingredients": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string"
            },
            "quantity": {
              "type": "number"
            },
            "unit": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "cookbook_addRecipe_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "cookbook_getRecipe_Input": {
    "type": "object",
    "required": [
      "recipeId"
    ],
    "additionalProperties": false,
    "properties": {
      "recipeId": {
        "type": "number"
      }
    }
  },
  "cookbook_getRecipe_Output": {
    "type": "object",
    "required": [
      "id",
      "name",
      "creationDateUnix",
      "updateDateUnix",
      "content",
      "ingredients"
    ],
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "number"
      },
      "name": {
        "type": "string"
      },
      "creationDateUnix": {
        "type": "number"
      },
      "updateDateUnix": {
        "type": "number"
      },
      "content": {
        "type": "string"
      },
      "ingredients": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "quantity": {
              "type": [
                "number",
                "null"
              ]
            },
            "unit": {
              "type": [
                "string",
                "null"
              ]
            }
          }
        }
      }
    }
  },
  "cookbook_listIngredients_Output": {
    "type": "object",
    "properties": {
      "ingredients": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "ingredients"
    ],
    "additionalProperties": false
  },
  "cookbook_listRecipes_Output": {
    "type": "object",
    "properties": {
      "recipes": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "creationDateUnix": {
              "type": "number"
            },
            "updateDateUnix": {
              "type": "number"
            }
          },
          "required": [
            "id",
            "name",
            "creationDateUnix",
            "updateDateUnix"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "recipes"
    ],
    "additionalProperties": false
  },
  "ephemerides_getRange_Input": {
    "type": "object",
    "description": "Get the ephemerides for a range of dates.",
    "properties": {
      "from": {
        "type": "number",
        "description": "The UTC timestamp in (in ms) of the first day of the range"
      },
      "to": {
        "type": "number",
        "description": "The UTC timestamp in (in ms) of the last day of the range"
      }
    },
    "additionalProperties": false,
    "required": [
      "from",
      "to"
    ]
  },
  "ephemerides_getRange_Output": {
    "type": "object",
    "properties": {
      "ephemerides": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "day": {
              "type": "number",
              "description": "timestamp (ms) of the day"
            },
            "ephemeride": {
              "type": "object",
              "properties": {
                "moonState": {
                  "type": "object",
                  "properties": {
                    "lunarAge": {
                      "type": "number"
                    },
                    "lunarAgePercent": {
                      "type": "number"
                    },
                    "lunarDistance": {
                      "type": "number",
                      "description": "Distance to the moon measured in units of Earth radii, with perigee at 56 and apogee at 63.8"
                    },
                    "moonPhase": {
                      "type": "string"
                    },
                    "moonPhaseFr": {
                      "type": "string"
                    },
                    "moonVisibilityWindow": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      },
                      "maxItems": 2,
                      "minItems": 2
                    }
                  },
                  "required": [
                    "lunarAge",
                    "lunarAgePercent",
                    "lunarDistance",
                    "moonPhase",
                    "moonPhaseFr",
                    "moonVisibilityWindow"
                  ],
                  "additionalProperties": false
                },
                "sunState": {
                  "type": "object",
                  "properties": {
                    "sunrise": {
                      "type": "number"
                    },
                    "sunset": {
                      "type": "number"
                    },
                    "solarNoon": {
                      "type": "number"
                    },
                    "goldenHour": {
                      "type": "number"
                    },
                    "dayLengthMs": {
                      "type": "number",
                      "description": "How many hours of sun this day (in ms)"
                    },
                    "dayLengthDiffMs": {
                      "type": "number",
                      "description": "The difference of day length compared to yesterday (in ms)"
                    }
                  },
                  "required": [
                    "dayLengthDiffMs",
                    "dayLengthMs",
                    "sunrise",
                    "sunset",
                    "solarNoon",
                    "goldenHour"
                  ],
                  "additionalProperties": false
                }
              },
              "required": [
                "moonState",
                "sunState"
              ],
              "additionalProperties": false
            }
          },
          "required": [
            "day",
            "ephemeride"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "ephemerides"
    ],
    "additionalProperties": false
  },
  "ephemerides_getToday_Output": {
    "type": "object",
    "properties": {
      "ephemerides": {
        "type": "object",
        "properties": {
          "moonState": {
            "type": "object",
            "properties": {
              "lunarAge": {
                "type": "number"
              },
              "lunarAgePercent": {
                "type": "number"
              },
              "lunarDistance": {
                "type": "number",
                "description": "Distance to the moon measured in units of Earth radii, with perigee at 56 and apogee at 63.8"
              },
              "moonPhase": {
                "type": "string"
              },
              "moonPhaseFr": {
                "type": "string"
              },
              "moonVisibilityWindow": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "maxItems": 2,
                "minItems": 2
              }
            },
            "required": [
              "lunarAge",
              "lunarAgePercent",
              "lunarDistance",
              "moonPhase",
              "moonPhaseFr",
              "moonVisibilityWindow"
            ],
            "additionalProperties": false
          },
          "sunState": {
            "type": "object",
            "properties": {
              "sunrise": {
                "type": "number"
              },
              "sunset": {
                "type": "number"
              },
              "solarNoon": {
                "type": "number"
              },
              "goldenHour": {
                "type": "number"
              },
              "dayLengthMs": {
                "type": "number",
                "description": "How many hours of sun this day (in ms)"
              },
              "dayLengthDiffMs": {
                "type": "number",
                "description": "The difference of day length compared to yesterday (in ms)"
              }
            },
            "required": [
              "dayLengthDiffMs",
              "dayLengthMs",
              "sunrise",
              "sunset",
              "solarNoon",
              "goldenHour"
            ],
            "additionalProperties": false
          },
          "upcomingLunarStates": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "lunarState": {
                  "type": "object",
                  "properties": {
                    "lunarAge": {
                      "type": "number"
                    },
                    "lunarAgePercent": {
                      "type": "number"
                    },
                    "lunarDistance": {
                      "type": "number",
                      "description": "Distance to the moon measured in units of Earth radii, with perigee at 56 and apogee at 63.8"
                    },
                    "moonPhase": {
                      "type": "string"
                    },
                    "moonPhaseFr": {
                      "type": "string"
                    },
                    "moonVisibilityWindow": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      },
                      "maxItems": 2,
                      "minItems": 2
                    }
                  },
                  "required": [
                    "lunarAge",
                    "lunarAgePercent",
                    "lunarDistance",
                    "moonPhase",
                    "moonPhaseFr",
                    "moonVisibilityWindow"
                  ],
                  "additionalProperties": false
                },
                "tsMillis": {
                  "type": "number"
                }
              },
              "required": [
                "tsMillis",
                "lunarState"
              ]
            }
          }
        },
        "required": [
          "moonState",
          "sunState",
          "upcomingLunarStates"
        ],
        "additionalProperties": false
      }
    },
    "required": [
      "ephemerides"
    ],
    "additionalProperties": false
  },
  "gravitrips_getNewGame_Output": {
    "type": "object",
    "properties": {
      "gameId": {
        "type": "string"
      }
    }
  },
  "health_getRemoteTime_Output": {
    "type": "number"
  },
  "homeTracker_getSensorsDataForDashboard_Output": {
    "type": "object",
    "properties": {
      "sensors": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "sensorName": {
              "type": "string"
            },
            "lastAlertDateUnix": {
              "type": [
                "number",
                "null"
              ]
            },
            "lastSyncDateUnix": {
              "type": "number"
            },
            "hexColor": {
              "type": "string",
              "description": "RGB color in hex format. Example: #AA33CC",
              "pattern": "^#[A-F0-9]{6}$"
            },
            "lastLogData": {
              "type": "object",
              "properties": {
                "timestamp": {
                  "type": "number"
                },
                "sensorName": {
                  "type": "string"
                },
                "batteryCharge": {
                  "type": "number"
                },
                "batteryPercent": {
                  "type": "number"
                },
                "detectedForcedReset": {
                  "type": "boolean"
                },
                "detectedInternalSensorFailure": {
                  "type": "boolean"
                },
                "detectedLowBattery": {
                  "type": "boolean"
                },
                "detectedSensorFailure": {
                  "type": "boolean"
                },
                "humidity": {
                  "type": "number"
                },
                "internalHumidity": {
                  "type": "number"
                },
                "internalTempCelsius": {
                  "type": "number"
                },
                "pressurehPa": {
                  "type": "number"
                },
                "tempCelsius": {
                  "type": "number"
                },
                "timeToSendMs": {
                  "type": "number"
                }
              },
              "required": [
                "sensorName",
                "timestamp"
              ],
              "additionalProperties": false
            },
            "oneHourAgoLogData": {
              "type": "object",
              "properties": {
                "timestamp": {
                  "type": "number"
                },
                "sensorName": {
                  "type": "string"
                },
                "batteryCharge": {
                  "type": "number"
                },
                "batteryPercent": {
                  "type": "number"
                },
                "detectedForcedReset": {
                  "type": "boolean"
                },
                "detectedInternalSensorFailure": {
                  "type": "boolean"
                },
                "detectedLowBattery": {
                  "type": "boolean"
                },
                "detectedSensorFailure": {
                  "type": "boolean"
                },
                "humidity": {
                  "type": "number"
                },
                "internalHumidity": {
                  "type": "number"
                },
                "internalTempCelsius": {
                  "type": "number"
                },
                "pressurehPa": {
                  "type": "number"
                },
                "tempCelsius": {
                  "type": "number"
                },
                "timeToSendMs": {
                  "type": "number"
                }
              },
              "required": [
                "sensorName",
                "timestamp"
              ],
              "additionalProperties": false
            },
            "oneDayAgoLogData": {
              "type": "object",
              "properties": {
                "timestamp": {
                  "type": "number"
                },
                "sensorName": {
                  "type": "string"
                },
                "batteryCharge": {
                  "type": "number"
                },
                "batteryPercent": {
                  "type": "number"
                },
                "detectedForcedReset": {
                  "type": "boolean"
                },
                "detectedInternalSensorFailure": {
                  "type": "boolean"
                },
                "detectedLowBattery": {
                  "type": "boolean"
                },
                "detectedSensorFailure": {
                  "type": "boolean"
                },
                "humidity": {
                  "type": "number"
                },
                "internalHumidity": {
                  "type": "number"
                },
                "internalTempCelsius": {
                  "type": "number"
                },
                "pressurehPa": {
                  "type": "number"
                },
                "tempCelsius": {
                  "type": "number"
                },
                "timeToSendMs": {
                  "type": "number"
                }
              },
              "required": [
                "sensorName",
                "timestamp"
              ],
              "additionalProperties": false
            },
            "sleepTimeSec": {
              "type": "number"
            },
            "tempOffset": {
              "type": "number"
            }
          },
          "required": [
            "sensorName",
            "tempOffset",
            "sleepTimeSec",
            "hexColor",
            "lastSyncDateUnix",
            "lastAlertDateUnix",
            "lastLogData",
            "oneHourAgoLogData",
            "oneDayAgoLogData"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "sensors"
    ],
    "additionalProperties": false
  },
  "homeTracker_getWeatherForecast_Output": {
    "type": "object",
    "properties": {
      "forecast": {
        "type": "object",
        "properties": {
          "pressureTrend": {
            "type": "string",
            "enum": [
              "falling",
              "rising",
              "steady",
              "unknown"
            ]
          },
          "forecast": {
            "type": "string"
          },
          "dataPoints": {
            "type": "object",
            "properties": {
              "latest": {
                "type": "object",
                "properties": {
                  "pressurehPa": {
                    "type": "number"
                  },
                  "timestampMs": {
                    "type": "number"
                  }
                },
                "required": [
                  "pressurehPa",
                  "timestampMs"
                ],
                "additionalProperties": false
              },
              "oldest": {
                "type": "object",
                "properties": {
                  "pressurehPa": {
                    "type": "number"
                  },
                  "timestampMs": {
                    "type": "number"
                  }
                },
                "required": [
                  "pressurehPa",
                  "timestampMs"
                ],
                "additionalProperties": false
              }
            },
            "required": [
              "latest",
              "oldest"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "pressureTrend",
          "forecast"
        ],
        "additionalProperties": false
      },
      "pressureHistory": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "timestamp": {
              "type": "number"
            },
            "averagePressurehPa": {
              "type": "number"
            }
          },
          "required": [
            "timestamp",
            "averagePressurehPa"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "forecast",
      "pressureHistory"
    ],
    "additionalProperties": false
  },
  "homeTracker_histogramData_Input": {
    "type": "object",
    "required": [
      "timeWindow"
    ],
    "additionalProperties": false,
    "properties": {
      "timeWindow": {
        "type": "object",
        "required": [
          "startDateMs",
          "endDateMs"
        ],
        "additionalProperties": false,
        "properties": {
          "startDateMs": {
            "type": "number"
          },
          "endDateMs": {
            "type": "number"
          }
        }
      }
    }
  },
  "homeTracker_histogramData_Output": {
    "type": "object",
    "properties": {
      "sensorNames": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "histogramData": {
        "type": "object",
        "additionalProperties": {
          "type": "object",
          "properties": {
            "tempCelsius": {
              "type": "object",
              "additionalProperties": {
                "type": "number"
              }
            },
            "internalTempCelsius": {
              "type": "object",
              "additionalProperties": {
                "type": "number"
              }
            },
            "batteryCharge": {
              "type": "object",
              "additionalProperties": {
                "type": "number"
              }
            },
            "humidity": {
              "type": "object",
              "additionalProperties": {
                "type": "number"
              }
            },
            "internalHumidity": {
              "type": "object",
              "additionalProperties": {
                "type": "number"
              }
            },
            "pressurehPa": {
              "type": "object",
              "additionalProperties": {
                "type": "number"
              }
            }
          },
          "additionalProperties": false
        }
      }
    },
    "required": [
      "sensorNames",
      "histogramData"
    ],
    "additionalProperties": false
  },
  "homeTracker_updateSensorMetadata_Input": {
    "type": "object",
    "required": [
      "sensorName",
      "hexColor",
      "tempOffset",
      "sleepTimeSec"
    ],
    "additionalProperties": false,
    "properties": {
      "sensorName": {
        "type": "string"
      },
      "hexColor": {
        "type": "string"
      },
      "tempOffset": {
        "type": "number"
      },
      "sleepTimeSec": {
        "type": "number",
        "minimum": 0
      }
    }
  },
  "homeTracker_updateSensorMetadata_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "homeTracker_upload_Input": {
    "type": "object",
    "required": [
      "sensorName"
    ],
    "additionalProperties": false,
    "properties": {
      "sensorName": {
        "description": "Name of the sensor",
        "type": "string"
      },
      "tempCelsius": {
        "description": "The current room temperature in celsius",
        "type": "number"
      },
      "humidity": {
        "description": "The current room humidity in percent",
        "type": "number"
      },
      "pressurePa": {
        "description": "The current room pressure in Pascal",
        "type": "number"
      },
      "internalTempCelsius": {
        "description": "The current room temperature in celsius",
        "type": "number"
      },
      "internalHumidity": {
        "description": "The current room humidity in percent",
        "type": "number"
      },
      "batteryCharge": {
        "description": "Computed charge of the battery in Volts",
        "type": "number"
      },
      "batteryPercent": {
        "description": "Computed percentage battery",
        "type": "number"
      },
      "timeToSendMs": {
        "description": "Computed interval between the start of the loop and the HTTP call",
        "type": "number"
      },
      "detectedLowBattery": {
        "description": "True if board detected a battery voltage low enough to trigger shutdown",
        "type": "boolean"
      },
      "detectedForcedReset": {
        "description": "True if board detected it restarted after an interrupt forced a restart",
        "type": "boolean"
      },
      "detectedInternalSensorFailure": {
        "description": "True if board detected it could not succcessfully read from the internal sensor",
        "type": "boolean"
      },
      "detectedSensorFailure": {
        "description": "True if board detected it could not succcessfully read from the main sensor",
        "type": "boolean"
      }
    }
  },
  "homeTracker_upload_Output": {
    "type": "object",
    "required": [
      "instructSleepSec"
    ],
    "additionalProperties": false,
    "properties": {
      "instructSleepSec": {
        "description": "The recommended sleeping time of the sensor in seconds",
        "type": "number"
      }
    }
  },
  "openapi_definitionJson_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "personalTracker_getAll_Output": {
    "type": "object",
    "required": [
      "events"
    ],
    "additionalProperties": false,
    "properties": {
      "events": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": [
            "eventDateUnix",
            "saltB64",
            "nonceB64",
            "ciphertextB64"
          ],
          "additionalProperties": false,
          "properties": {
            "eventDateUnix": {
              "description": "The date of the event in seconds in UTC",
              "type": "number"
            },
            "saltB64": {
              "description": "The salt used to cipher the event in base64",
              "type": "string"
            },
            "nonceB64": {
              "description": "The salt used to cipher the event in base64",
              "type": "string"
            },
            "ciphertextB64": {
              "description": "The event a stringified JSON object encrypted and encoded in base64",
              "type": "string"
            }
          }
        }
      }
    }
  },
  "personalTracker_upload_Input": {
    "type": "object",
    "required": [
      "eventDateUnix",
      "saltB64",
      "nonceB64",
      "ciphertextB64"
    ],
    "additionalProperties": false,
    "properties": {
      "eventDateUnix": {
        "description": "The date of the event in seconds in UTC",
        "type": "number"
      },
      "saltB64": {
        "description": "The salt used to cipher the event in base64",
        "type": "string"
      },
      "nonceB64": {
        "description": "The salt used to cipher the event in base64",
        "type": "string"
      },
      "ciphertextB64": {
        "description": "The event a stringified JSON object encrypted and encoded in base64",
        "type": "string"
      }
    }
  },
  "personalTracker_upload_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "reactor_addEntry_Input": {
    "type": "object",
    "required": [
      "name",
      "commaSeparatedTags"
    ],
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string"
      },
      "commaSeparatedTags": {
        "type": "string"
      }
    }
  },
  "reactor_addEntry_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "reactor_getEntriesForPublic_Output": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "creationDateUnix": {
          "type": "number"
        },
        "s3PresignedUrl": {
          "type": "string"
        },
        "uri": {
          "type": "string"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "name",
        "creationDateUnix",
        "s3PresignedUrl",
        "uri",
        "tags"
      ],
      "additionalProperties": false
    }
  },
  "misc_r_Output": {
    "type": "string",
    "description": "A S3 presigned URL to redirect to"
  },
  "webReader_getPageTitle_Input": {
    "type": "object",
    "required": [
      "url"
    ],
    "additionalProperties": false,
    "properties": {
      "url": {
        "type": "string"
      }
    }
  },
  "webReader_getPageTitle_Output": {
    "type": "object",
    "required": [
      "title"
    ],
    "additionalProperties": false,
    "properties": {
      "title": {
        "type": "string"
      }
    }
  },
  "webStats_record_Input": {
    "type": "object",
    "required": [
      "clientTimestamp",
      "app",
      "path",
      "action",
      "clientId"
    ],
    "additionalProperties": false,
    "properties": {
      "clientTimestamp": {
        "type": "number"
      },
      "app": {
        "type": "string"
      },
      "path": {
        "type": "string"
      },
      "action": {
        "type": "string"
      },
      "clientId": {
        "type": "string"
      }
    }
  },
  "webStats_record_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "webWatcher_createWatcher_Input": {
    "oneOf": [
      {
        "type": "object",
        "required": [
          "name",
          "notificationMessage",
          "url",
          "watchType",
          "cssSelector",
          "checkIntervalSeconds"
        ],
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the watcher (must be uniq)"
          },
          "notificationMessage": {
            "type": "string",
            "description": "Message to send went the content changes"
          },
          "url": {
            "type": "string",
            "description": "URL to monitor"
          },
          "watchType": {
            "type": "string",
            "description": "Type of watch to do",
            "enum": [
              "CSS"
            ]
          },
          "cssSelector": {
            "type": "string",
            "description": "CSS selector to the element to monitor in the page"
          },
          "checkIntervalSeconds": {
            "type": "number",
            "description": "Minimum time between to checks in seconds",
            "minimum": 900
          }
        }
      },
      {
        "type": "object",
        "required": [
          "name",
          "notificationMessage",
          "url",
          "watchType",
          "checkIntervalSeconds"
        ],
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the watcher (must be uniq)"
          },
          "notificationMessage": {
            "type": "string",
            "description": "Message to send went the content changes"
          },
          "url": {
            "type": "string",
            "description": "URL to monitor"
          },
          "watchType": {
            "type": "string",
            "description": "Type of watch to do",
            "enum": [
              "HASH"
            ]
          },
          "checkIntervalSeconds": {
            "type": "number",
            "description": "Minimum time between to checks in seconds",
            "minimum": 900
          }
        }
      }
    ]
  },
  "webWatcher_createWatcher_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "webWatcher_deleteWatcher_Input": {
    "type": "object",
    "required": [
      "id"
    ],
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "number",
        "description": "id of the watcher to delete"
      }
    }
  },
  "webWatcher_deleteWatcher_Output": {
    "type": "object",
    "additionalProperties": false
  },
  "webWatcher_getAllWatchers_Output": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "notificationMessage": {
          "type": "string"
        },
        "url": {
          "type": "string"
        },
        "watchType": {
          "type": "string",
          "enum": [
            "CSS",
            "HASH"
          ]
        },
        "cssSelector": {
          "type": "string"
        },
        "lastContent": {
          "type": "string"
        },
        "lastCheckDateUnix": {
          "type": [
            "number",
            "null"
          ]
        },
        "lastUpdateDateUnix": {
          "type": [
            "number",
            "null"
          ]
        },
        "archivalDateUnix": {
          "type": [
            "number",
            "null"
          ]
        },
        "checkIntervalSeconds": {
          "type": "number"
        },
        "lastErrorDateUnix": {
          "type": [
            "number",
            "null"
          ]
        },
        "lastErrorMessage": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "name",
        "notificationMessage",
        "url",
        "watchType",
        "lastContent",
        "lastCheckDateUnix",
        "lastUpdateDateUnix",
        "archivalDateUnix",
        "checkIntervalSeconds",
        "lastErrorDateUnix",
        "lastErrorMessage"
      ],
      "additionalProperties": false
    }
  },
  "webWatcher_toggleWatcherEnabled_Input": {
    "type": "object",
    "required": [
      "watcherId",
      "setToEnabled"
    ],
    "additionalProperties": false,
    "properties": {
      "watcherId": {
        "type": "number",
        "description": "The sql id of the watcher"
      },
      "setToEnabled": {
        "type": "boolean",
        "description": "The new enabled status of the watcher"
      }
    }
  },
  "webWatcher_toggleWatcherEnabled_Output": {
    "type": "object",
    "additionalProperties": false
  }
} as const;

// Type exports
export type Auth_Login_Input = FromSchema<typeof schemas.auth_login_Input>;
export type Auth_Login_Output = FromSchema<typeof schemas.auth_login_Output>;
export type Auth_Login = Endpoint<Auth_Login_Output, Auth_Login_Input>;
export type Auth_Login_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Auth_Logout_Input = FromSchema<typeof schemas.auth_logout_Input>;
export type Auth_Logout_Output = FromSchema<typeof schemas.auth_logout_Output>;
export type Auth_Logout = Endpoint<Auth_Logout_Output, Auth_Logout_Input>;
export type Auth_Logout_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Auth_Me_Input = FromSchema<typeof schemas.auth_me_Input>;
export type Auth_Me_Output = FromSchema<typeof schemas.auth_me_Output>;
export type Auth_Me = Endpoint<Auth_Me_Output, Auth_Me_Input>;
export type Auth_Me_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Chords_AddLinkVisit_Input = FromSchema<typeof schemas.chords_addLinkVisit_Input>;
export type Chords_AddLinkVisit_Output = FromSchema<typeof schemas.chords_addLinkVisit_Output>;
export type Chords_AddLinkVisit = Endpoint<Chords_AddLinkVisit_Output, Chords_AddLinkVisit_Input>;
export type Chords_AddLinkVisit_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Chords_CheckLinks_Output = FromSchema<typeof schemas.chords_checkLinks_Output>;
export type Chords_CheckLinks = Endpoint<Chords_CheckLinks_Output>;
export type Chords_CheckLinks_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Chords_GetAll_Output = FromSchema<typeof schemas.chords_getAll_Output>;
export type Chords_GetAll = Endpoint<Chords_GetAll_Output>;
export type Chords_GetAll_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Chords_GetLinksVisitsCount_Output = FromSchema<typeof schemas.chords_getLinksVisitsCount_Output>;
export type Chords_GetLinksVisitsCount = Endpoint<Chords_GetLinksVisitsCount_Output>;
export type Chords_GetLinksVisitsCount_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Chords_UpdateAll_Input = FromSchema<typeof schemas.chords_updateAll_Input>;
export type Chords_UpdateAll_Output = FromSchema<typeof schemas.chords_updateAll_Output>;
export type Chords_UpdateAll = Endpoint<Chords_UpdateAll_Output, Chords_UpdateAll_Input>;
export type Chords_UpdateAll_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Clipboard_AddEntry_Input = FromSchema<typeof schemas.clipboard_addEntry_Input>;
export type Clipboard_AddEntry_Output = FromSchema<typeof schemas.clipboard_addEntry_Output>;
export type Clipboard_AddEntry = Endpoint<Clipboard_AddEntry_Output, Clipboard_AddEntry_Input>;
export type Clipboard_AddEntry_Errors = 'FILE_OR_CONTENT_REQUIRED' | 'ITEM_ALREADY_EXISTS' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Clipboard_DeleteEntry_Input = FromSchema<typeof schemas.clipboard_deleteEntry_Input>;
export type Clipboard_DeleteEntry_Output = FromSchema<typeof schemas.clipboard_deleteEntry_Output>;
export type Clipboard_DeleteEntry = Endpoint<Clipboard_DeleteEntry_Output, Clipboard_DeleteEntry_Input>;
export type Clipboard_DeleteEntry_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Clipboard_GetAllEntries_Output = FromSchema<typeof schemas.clipboard_getAllEntries_Output>;
export type Clipboard_GetAllEntries = Endpoint<Clipboard_GetAllEntries_Output>;
export type Clipboard_GetAllEntries_Errors = 'ITEM_NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Clipboard_GetPublicEntries_Output = FromSchema<typeof schemas.clipboard_getPublicEntries_Output>;
export type Clipboard_GetPublicEntries = Endpoint<Clipboard_GetPublicEntries_Output>;
export type Clipboard_GetPublicEntries_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Clipboard_View_Output = FromSchema<typeof schemas.clipboard_view_Output>;
export type Clipboard_View = Endpoint<Clipboard_View_Output>;
export type Clipboard_View_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Cookbook_AddRecipe_Input = FromSchema<typeof schemas.cookbook_addRecipe_Input>;
export type Cookbook_AddRecipe_Output = FromSchema<typeof schemas.cookbook_addRecipe_Output>;
export type Cookbook_AddRecipe = Endpoint<Cookbook_AddRecipe_Output, Cookbook_AddRecipe_Input>;
export type Cookbook_AddRecipe_Errors = 'ITEM_ALREADY_EXISTS' | 'DUPLICATE_INGREDIENT' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Cookbook_GetRecipe_Input = FromSchema<typeof schemas.cookbook_getRecipe_Input>;
export type Cookbook_GetRecipe_Output = FromSchema<typeof schemas.cookbook_getRecipe_Output>;
export type Cookbook_GetRecipe = Endpoint<Cookbook_GetRecipe_Output, Cookbook_GetRecipe_Input>;
export type Cookbook_GetRecipe_Errors = 'ITEM_NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Cookbook_ListIngredients_Output = FromSchema<typeof schemas.cookbook_listIngredients_Output>;
export type Cookbook_ListIngredients = Endpoint<Cookbook_ListIngredients_Output>;
export type Cookbook_ListIngredients_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Cookbook_ListRecipes_Output = FromSchema<typeof schemas.cookbook_listRecipes_Output>;
export type Cookbook_ListRecipes = Endpoint<Cookbook_ListRecipes_Output>;
export type Cookbook_ListRecipes_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Ephemerides_GetRange_Input = FromSchema<typeof schemas.ephemerides_getRange_Input>;
export type Ephemerides_GetRange_Output = FromSchema<typeof schemas.ephemerides_getRange_Output>;
export type Ephemerides_GetRange = Endpoint<Ephemerides_GetRange_Output, Ephemerides_GetRange_Input>;
export type Ephemerides_GetRange_Errors = 'RANGE_TOO_LARGE' | 'RANGE_IS_INVALID' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Ephemerides_GetToday_Output = FromSchema<typeof schemas.ephemerides_getToday_Output>;
export type Ephemerides_GetToday = Endpoint<Ephemerides_GetToday_Output>;
export type Ephemerides_GetToday_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Gravitrips_GetNewGame_Output = FromSchema<typeof schemas.gravitrips_getNewGame_Output>;
export type Gravitrips_GetNewGame = Endpoint<Gravitrips_GetNewGame_Output>;
export type Gravitrips_GetNewGame_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Health_GetRemoteTime_Output = FromSchema<typeof schemas.health_getRemoteTime_Output>;
export type Health_GetRemoteTime = Endpoint<Health_GetRemoteTime_Output>;
export type Health_GetRemoteTime_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type HomeTracker_GetSensorsDataForDashboard_Output = FromSchema<typeof schemas.homeTracker_getSensorsDataForDashboard_Output>;
export type HomeTracker_GetSensorsDataForDashboard = Endpoint<HomeTracker_GetSensorsDataForDashboard_Output>;
export type HomeTracker_GetSensorsDataForDashboard_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type HomeTracker_GetWeatherForecast_Output = FromSchema<typeof schemas.homeTracker_getWeatherForecast_Output>;
export type HomeTracker_GetWeatherForecast = Endpoint<HomeTracker_GetWeatherForecast_Output>;
export type HomeTracker_GetWeatherForecast_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type HomeTracker_HistogramData_Input = FromSchema<typeof schemas.homeTracker_histogramData_Input>;
export type HomeTracker_HistogramData_Output = FromSchema<typeof schemas.homeTracker_histogramData_Output>;
export type HomeTracker_HistogramData = Endpoint<HomeTracker_HistogramData_Output, HomeTracker_HistogramData_Input>;
export type HomeTracker_HistogramData_Errors = 'INVALID_TIME_WINDOW' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type HomeTracker_UpdateSensorMetadata_Input = FromSchema<typeof schemas.homeTracker_updateSensorMetadata_Input>;
export type HomeTracker_UpdateSensorMetadata_Output = FromSchema<typeof schemas.homeTracker_updateSensorMetadata_Output>;
export type HomeTracker_UpdateSensorMetadata = Endpoint<HomeTracker_UpdateSensorMetadata_Output, HomeTracker_UpdateSensorMetadata_Input>;
export type HomeTracker_UpdateSensorMetadata_Errors = 'SENSOR_NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type HomeTracker_Upload_Input = FromSchema<typeof schemas.homeTracker_upload_Input>;
export type HomeTracker_Upload_Output = FromSchema<typeof schemas.homeTracker_upload_Output>;
export type HomeTracker_Upload = Endpoint<HomeTracker_Upload_Output, HomeTracker_Upload_Input>;
export type HomeTracker_Upload_Errors = 'MISSING_API_KEY' | 'INVALID_AUTH_HEADER' | 'UNKNOWN_API_KEY' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Openapi_DefinitionJson_Output = FromSchema<typeof schemas.openapi_definitionJson_Output>;
export type Openapi_DefinitionJson = Endpoint<Openapi_DefinitionJson_Output>;
export type Openapi_DefinitionJson_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type PersonalTracker_GetAll_Output = FromSchema<typeof schemas.personalTracker_getAll_Output>;
export type PersonalTracker_GetAll = Endpoint<PersonalTracker_GetAll_Output>;
export type PersonalTracker_GetAll_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type PersonalTracker_Upload_Input = FromSchema<typeof schemas.personalTracker_upload_Input>;
export type PersonalTracker_Upload_Output = FromSchema<typeof schemas.personalTracker_upload_Output>;
export type PersonalTracker_Upload = Endpoint<PersonalTracker_Upload_Output, PersonalTracker_Upload_Input>;
export type PersonalTracker_Upload_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Reactor_AddEntry_Input = FromSchema<typeof schemas.reactor_addEntry_Input>;
export type Reactor_AddEntry_Output = FromSchema<typeof schemas.reactor_addEntry_Output>;
export type Reactor_AddEntry = Endpoint<Reactor_AddEntry_Output, Reactor_AddEntry_Input>;
export type Reactor_AddEntry_Errors = 'ITEM_ALREADY_EXISTS' | 'FILE_REQUIRED' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Reactor_GetEntriesForPublic_Output = FromSchema<typeof schemas.reactor_getEntriesForPublic_Output>;
export type Reactor_GetEntriesForPublic = Endpoint<Reactor_GetEntriesForPublic_Output>;
export type Reactor_GetEntriesForPublic_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type Misc_R_Output = FromSchema<typeof schemas.misc_r_Output>;
export type Misc_R = Endpoint<Misc_R_Output>;
export type Misc_R_Errors = 'ITEM_NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type WebReader_GetPageTitle_Input = FromSchema<typeof schemas.webReader_getPageTitle_Input>;
export type WebReader_GetPageTitle_Output = FromSchema<typeof schemas.webReader_getPageTitle_Output>;
export type WebReader_GetPageTitle = Endpoint<WebReader_GetPageTitle_Output, WebReader_GetPageTitle_Input>;
export type WebReader_GetPageTitle_Errors = 'INVALID_URL' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type WebStats_Record_Input = FromSchema<typeof schemas.webStats_record_Input>;
export type WebStats_Record_Output = FromSchema<typeof schemas.webStats_record_Output>;
export type WebStats_Record = Endpoint<WebStats_Record_Output, WebStats_Record_Input>;
export type WebStats_Record_Errors = 'MISSING_API_KEY' | 'INVALID_AUTH_HEADER' | 'UNKNOWN_API_KEY' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type WebWatcher_CreateWatcher_Input = FromSchema<typeof schemas.webWatcher_createWatcher_Input>;
export type WebWatcher_CreateWatcher_Output = FromSchema<typeof schemas.webWatcher_createWatcher_Output>;
export type WebWatcher_CreateWatcher = Endpoint<WebWatcher_CreateWatcher_Output, WebWatcher_CreateWatcher_Input>;
export type WebWatcher_CreateWatcher_Errors = 'ITEM_ALREADY_EXISTS' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type WebWatcher_DeleteWatcher_Input = FromSchema<typeof schemas.webWatcher_deleteWatcher_Input>;
export type WebWatcher_DeleteWatcher_Output = FromSchema<typeof schemas.webWatcher_deleteWatcher_Output>;
export type WebWatcher_DeleteWatcher = Endpoint<WebWatcher_DeleteWatcher_Output, WebWatcher_DeleteWatcher_Input>;
export type WebWatcher_DeleteWatcher_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type WebWatcher_GetAllWatchers_Output = FromSchema<typeof schemas.webWatcher_getAllWatchers_Output>;
export type WebWatcher_GetAllWatchers = Endpoint<WebWatcher_GetAllWatchers_Output>;
export type WebWatcher_GetAllWatchers_Errors = 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';
export type WebWatcher_ToggleWatcherEnabled_Input = FromSchema<typeof schemas.webWatcher_toggleWatcherEnabled_Input>;
export type WebWatcher_ToggleWatcherEnabled_Output = FromSchema<typeof schemas.webWatcher_toggleWatcherEnabled_Output>;
export type WebWatcher_ToggleWatcherEnabled = Endpoint<WebWatcher_ToggleWatcherEnabled_Output, WebWatcher_ToggleWatcherEnabled_Input>;
export type WebWatcher_ToggleWatcherEnabled_Errors = 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INPUT_VALIDATION_FAILED' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';

export function buildModules(fetch: FetchFn) {
  return {

    auth: {
      /**
       * POST /auth/login
       * Auth: user2
       */
      login: (input: Auth_Login_Input) =>
        fetch('/auth/login', input, null, { inputSchema: schemas.auth_login_Input, outputSchema: schemas.auth_login_Output, endpoint: 'auth.login' }, { method: 'POST' }, { type: 'user2' }) as Promise<Auth_Login_Output>,

      /**
       * POST /auth/logout
       * Auth: user2
       */
      logout: (input: Auth_Logout_Input) =>
        fetch('/auth/logout', input, null, { inputSchema: schemas.auth_logout_Input, outputSchema: schemas.auth_logout_Output, endpoint: 'auth.logout' }, { method: 'POST' }, { type: 'user2' }) as Promise<Auth_Logout_Output>,

      /**
       * POST /auth/me
       * Auth: user2
       */
      me: (input: Auth_Me_Input) =>
        fetch('/auth/me', input, null, { inputSchema: schemas.auth_me_Input, outputSchema: schemas.auth_me_Output, endpoint: 'auth.me' }, { method: 'POST' }, { type: 'user2' }) as Promise<Auth_Me_Output>,

    },

    chords: {
      /**
       * POST /chords/addLinkVisit
       * Auth: user2
       */
      addLinkVisit: (input: Chords_AddLinkVisit_Input) =>
        fetch('/chords/addLinkVisit', input, null, { inputSchema: schemas.chords_addLinkVisit_Input, outputSchema: schemas.chords_addLinkVisit_Output, endpoint: 'chords.addLinkVisit' }, { method: 'POST' }, { type: 'user2' }) as Promise<Chords_AddLinkVisit_Output>,

      /**
       * GET /chords/checkLinks
       * Auth: none
       */
      checkLinks: () =>
        fetch('/chords/checkLinks', null, null, { outputSchema: schemas.chords_checkLinks_Output, endpoint: 'chords.checkLinks' }, { method: 'GET' }, { type: 'none' }) as Promise<Chords_CheckLinks_Output>,

      /**
       * GET /chords/getAll
       * Auth: none
       */
      getAll: () =>
        fetch('/chords/getAll', null, null, { outputSchema: schemas.chords_getAll_Output, endpoint: 'chords.getAll' }, { method: 'GET' }, { type: 'none' }) as Promise<Chords_GetAll_Output>,

      /**
       * GET /chords/getLinksVisitsCount
       * Auth: none
       */
      getLinksVisitsCount: () =>
        fetch('/chords/getLinksVisitsCount', null, null, { outputSchema: schemas.chords_getLinksVisitsCount_Output, endpoint: 'chords.getLinksVisitsCount' }, { method: 'GET' }, { type: 'none' }) as Promise<Chords_GetLinksVisitsCount_Output>,

      /**
       * POST /chords/updateAll
       * Auth: user2
       */
      updateAll: (input: Chords_UpdateAll_Input) =>
        fetch('/chords/updateAll', input, null, { inputSchema: schemas.chords_updateAll_Input, outputSchema: schemas.chords_updateAll_Output, endpoint: 'chords.updateAll' }, { method: 'POST' }, { type: 'user2' }) as Promise<Chords_UpdateAll_Output>,

    },

    clipboard: {
      /**
       * POST /clipboard/addEntry
       * Auth: user2
       */
      addEntry: (input: Clipboard_AddEntry_Input, file: null | File) =>
        fetch('/clipboard/addEntry', input, file, { inputSchema: schemas.clipboard_addEntry_Input, outputSchema: schemas.clipboard_addEntry_Output, endpoint: 'clipboard.addEntry' }, { method: 'POST' }, { type: 'user2' }) as Promise<Clipboard_AddEntry_Output>,

      /**
       * POST /clipboard/deleteEntry
       * Auth: user2
       */
      deleteEntry: (input: Clipboard_DeleteEntry_Input) =>
        fetch('/clipboard/deleteEntry', input, null, { inputSchema: schemas.clipboard_deleteEntry_Input, outputSchema: schemas.clipboard_deleteEntry_Output, endpoint: 'clipboard.deleteEntry' }, { method: 'POST' }, { type: 'user2' }) as Promise<Clipboard_DeleteEntry_Output>,

      /**
       * GET /clipboard/getAllEntries
       * Auth: user2
       */
      getAllEntries: () =>
        fetch('/clipboard/getAllEntries', null, null, { outputSchema: schemas.clipboard_getAllEntries_Output, endpoint: 'clipboard.getAllEntries' }, { method: 'GET' }, { type: 'user2' }) as Promise<Clipboard_GetAllEntries_Output>,

      /**
       * GET /clipboard/getPublicEntries
       * Auth: none
       */
      getPublicEntries: () =>
        fetch('/clipboard/getPublicEntries', null, null, { outputSchema: schemas.clipboard_getPublicEntries_Output, endpoint: 'clipboard.getPublicEntries' }, { method: 'GET' }, { type: 'none' }) as Promise<Clipboard_GetPublicEntries_Output>,

      /**
       * GET /clipboard/view
       * Auth: none
       */
      view: () =>
        fetch('/clipboard/view', null, null, { outputSchema: schemas.clipboard_view_Output, endpoint: 'clipboard.view' }, { method: 'GET' }, { type: 'none' }) as Promise<Clipboard_View_Output>,

    },

    cookbook: {
      /**
       * POST /cookbook/addRecipe
       * Auth: user2
       */
      addRecipe: (input: Cookbook_AddRecipe_Input) =>
        fetch('/cookbook/addRecipe', input, null, { inputSchema: schemas.cookbook_addRecipe_Input, outputSchema: schemas.cookbook_addRecipe_Output, endpoint: 'cookbook.addRecipe' }, { method: 'POST' }, { type: 'user2' }) as Promise<Cookbook_AddRecipe_Output>,

      /**
       * POST /cookbook/getRecipe
       * Auth: user2
       */
      getRecipe: (input: Cookbook_GetRecipe_Input) =>
        fetch('/cookbook/getRecipe', input, null, { inputSchema: schemas.cookbook_getRecipe_Input, outputSchema: schemas.cookbook_getRecipe_Output, endpoint: 'cookbook.getRecipe' }, { method: 'POST' }, { type: 'user2' }) as Promise<Cookbook_GetRecipe_Output>,

      /**
       * GET /cookbook/listIngredients
       * Auth: user2
       */
      listIngredients: () =>
        fetch('/cookbook/listIngredients', null, null, { outputSchema: schemas.cookbook_listIngredients_Output, endpoint: 'cookbook.listIngredients' }, { method: 'GET' }, { type: 'user2' }) as Promise<Cookbook_ListIngredients_Output>,

      /**
       * GET /cookbook/listRecipes
       * Auth: user2
       */
      listRecipes: () =>
        fetch('/cookbook/listRecipes', null, null, { outputSchema: schemas.cookbook_listRecipes_Output, endpoint: 'cookbook.listRecipes' }, { method: 'GET' }, { type: 'user2' }) as Promise<Cookbook_ListRecipes_Output>,

    },

    ephemerides: {
      /**
       * POST /ephemerides/getRange
       * Auth: none
       */
      getRange: (input: Ephemerides_GetRange_Input) =>
        fetch('/ephemerides/getRange', input, null, { inputSchema: schemas.ephemerides_getRange_Input, outputSchema: schemas.ephemerides_getRange_Output, endpoint: 'ephemerides.getRange' }, { method: 'POST' }, { type: 'none' }) as Promise<Ephemerides_GetRange_Output>,

      /**
       * GET /ephemerides/getToday
       * Auth: none
       */
      getToday: () =>
        fetch('/ephemerides/getToday', null, null, { outputSchema: schemas.ephemerides_getToday_Output, endpoint: 'ephemerides.getToday' }, { method: 'GET' }, { type: 'none' }) as Promise<Ephemerides_GetToday_Output>,

    },

    gravitrips: {
      /**
       * GET /gravitrips/getNewGame
       * Auth: none
       */
      getNewGame: () =>
        fetch('/gravitrips/getNewGame', null, null, { outputSchema: schemas.gravitrips_getNewGame_Output, endpoint: 'gravitrips.getNewGame' }, { method: 'GET' }, { type: 'none' }) as Promise<Gravitrips_GetNewGame_Output>,

    },

    health: {
      /**
       * GET /health/getRemoteTime
       * Auth: none
       */
      getRemoteTime: () =>
        fetch('/health/getRemoteTime', null, null, { outputSchema: schemas.health_getRemoteTime_Output, endpoint: 'health.getRemoteTime' }, { method: 'GET' }, { type: 'none' }) as Promise<Health_GetRemoteTime_Output>,

    },

    homeTracker: {
      /**
       * GET /homeTracker/getSensorsDataForDashboard
       * Auth: none
       */
      getSensorsDataForDashboard: () =>
        fetch('/homeTracker/getSensorsDataForDashboard', null, null, { outputSchema: schemas.homeTracker_getSensorsDataForDashboard_Output, endpoint: 'homeTracker.getSensorsDataForDashboard' }, { method: 'GET' }, { type: 'none' }) as Promise<HomeTracker_GetSensorsDataForDashboard_Output>,

      /**
       * GET /homeTracker/getWeatherForecast
       * Auth: none
       */
      getWeatherForecast: () =>
        fetch('/homeTracker/getWeatherForecast', null, null, { outputSchema: schemas.homeTracker_getWeatherForecast_Output, endpoint: 'homeTracker.getWeatherForecast' }, { method: 'GET' }, { type: 'none' }) as Promise<HomeTracker_GetWeatherForecast_Output>,

      /**
       * POST /homeTracker/histogramData
       * Auth: user2
       */
      histogramData: (input: HomeTracker_HistogramData_Input) =>
        fetch('/homeTracker/histogramData', input, null, { inputSchema: schemas.homeTracker_histogramData_Input, outputSchema: schemas.homeTracker_histogramData_Output, endpoint: 'homeTracker.histogramData' }, { method: 'POST' }, { type: 'user2' }) as Promise<HomeTracker_HistogramData_Output>,

      /**
       * POST /homeTracker/updateSensorMetadata
       * Auth: user2
       */
      updateSensorMetadata: (input: HomeTracker_UpdateSensorMetadata_Input) =>
        fetch('/homeTracker/updateSensorMetadata', input, null, { inputSchema: schemas.homeTracker_updateSensorMetadata_Input, outputSchema: schemas.homeTracker_updateSensorMetadata_Output, endpoint: 'homeTracker.updateSensorMetadata' }, { method: 'POST' }, { type: 'user2' }) as Promise<HomeTracker_UpdateSensorMetadata_Output>,

      /**
       * POST /homeTracker/upload
       * Auth: apikey-iot
       */
      upload: (input: HomeTracker_Upload_Input) =>
        fetch('/homeTracker/upload', input, null, { inputSchema: schemas.homeTracker_upload_Input, outputSchema: schemas.homeTracker_upload_Output, endpoint: 'homeTracker.upload' }, { method: 'POST' }, { type: 'apikey-iot' }) as Promise<HomeTracker_Upload_Output>,

    },

    openapi: {
      /**
       * GET /openapi/definition.json
       * Auth: none
       */
      definitionJson: () =>
        fetch('/openapi/definition.json', null, null, { outputSchema: schemas.openapi_definitionJson_Output, endpoint: 'openapi.definitionJson' }, { method: 'GET' }, { type: 'none' }) as Promise<Openapi_DefinitionJson_Output>,

    },

    personalTracker: {
      /**
       * GET /personalTracker/getAll
       * Auth: user2
       */
      getAll: () =>
        fetch('/personalTracker/getAll', null, null, { outputSchema: schemas.personalTracker_getAll_Output, endpoint: 'personalTracker.getAll' }, { method: 'GET' }, { type: 'user2' }) as Promise<PersonalTracker_GetAll_Output>,

      /**
       * POST /personalTracker/upload
       * Auth: user2
       */
      upload: (input: PersonalTracker_Upload_Input) =>
        fetch('/personalTracker/upload', input, null, { inputSchema: schemas.personalTracker_upload_Input, outputSchema: schemas.personalTracker_upload_Output, endpoint: 'personalTracker.upload' }, { method: 'POST' }, { type: 'user2' }) as Promise<PersonalTracker_Upload_Output>,

    },

    reactor: {
      /**
       * POST /reactor/addEntry
       * Auth: user2
       */
      addEntry: (input: Reactor_AddEntry_Input, file: null | File) =>
        fetch('/reactor/addEntry', input, file, { inputSchema: schemas.reactor_addEntry_Input, outputSchema: schemas.reactor_addEntry_Output, endpoint: 'reactor.addEntry' }, { method: 'POST' }, { type: 'user2' }) as Promise<Reactor_AddEntry_Output>,

      /**
       * GET /reactor/getEntriesForPublic
       * Auth: none
       */
      getEntriesForPublic: () =>
        fetch('/reactor/getEntriesForPublic', null, null, { outputSchema: schemas.reactor_getEntriesForPublic_Output, endpoint: 'reactor.getEntriesForPublic' }, { method: 'GET' }, { type: 'none' }) as Promise<Reactor_GetEntriesForPublic_Output>,

    },

    misc: {
      /**
       * GET /r/:linkId
       * Auth: none
       */
      r: (params: { linkId: string }) =>
        fetch('/r/:linkId'.replace(':linkId', params.linkId), null, null, { outputSchema: schemas.misc_r_Output, endpoint: 'misc.r' }, { method: 'GET' }, { type: 'none' }) as Promise<Misc_R_Output>,

    },

    webReader: {
      /**
       * POST /webReader/getPageTitle
       * Auth: user2
       */
      getPageTitle: (input: WebReader_GetPageTitle_Input) =>
        fetch('/webReader/getPageTitle', input, null, { inputSchema: schemas.webReader_getPageTitle_Input, outputSchema: schemas.webReader_getPageTitle_Output, endpoint: 'webReader.getPageTitle' }, { method: 'POST' }, { type: 'user2' }) as Promise<WebReader_GetPageTitle_Output>,

    },

    webStats: {
      /**
       * POST /web-stats/record
       * Auth: apikey
       */
      record: (input: WebStats_Record_Input) =>
        fetch('/web-stats/record', input, null, { inputSchema: schemas.webStats_record_Input, outputSchema: schemas.webStats_record_Output, endpoint: 'webStats.record' }, { method: 'POST' }, { type: 'apikey' }) as Promise<WebStats_Record_Output>,

    },

    webWatcher: {
      /**
       * POST /webWatcher/createWatcher
       * Auth: user2
       */
      createWatcher: (input: WebWatcher_CreateWatcher_Input) =>
        fetch('/webWatcher/createWatcher', input, null, { inputSchema: schemas.webWatcher_createWatcher_Input, outputSchema: schemas.webWatcher_createWatcher_Output, endpoint: 'webWatcher.createWatcher' }, { method: 'POST' }, { type: 'user2' }) as Promise<WebWatcher_CreateWatcher_Output>,

      /**
       * POST /webWatcher/deleteWatcher
       * Auth: user2
       */
      deleteWatcher: (input: WebWatcher_DeleteWatcher_Input) =>
        fetch('/webWatcher/deleteWatcher', input, null, { inputSchema: schemas.webWatcher_deleteWatcher_Input, outputSchema: schemas.webWatcher_deleteWatcher_Output, endpoint: 'webWatcher.deleteWatcher' }, { method: 'POST' }, { type: 'user2' }) as Promise<WebWatcher_DeleteWatcher_Output>,

      /**
       * GET /webWatcher/getAllWatchers
       * Auth: none
       */
      getAllWatchers: () =>
        fetch('/webWatcher/getAllWatchers', null, null, { outputSchema: schemas.webWatcher_getAllWatchers_Output, endpoint: 'webWatcher.getAllWatchers' }, { method: 'GET' }, { type: 'none' }) as Promise<WebWatcher_GetAllWatchers_Output>,

      /**
       * POST /webWatcher/toggleWatcherEnabled
       * Auth: user2
       */
      toggleWatcherEnabled: (input: WebWatcher_ToggleWatcherEnabled_Input) =>
        fetch('/webWatcher/toggleWatcherEnabled', input, null, { inputSchema: schemas.webWatcher_toggleWatcherEnabled_Input, outputSchema: schemas.webWatcher_toggleWatcherEnabled_Output, endpoint: 'webWatcher.toggleWatcherEnabled' }, { method: 'POST' }, { type: 'user2' }) as Promise<WebWatcher_ToggleWatcherEnabled_Output>,

    },

  };
}
