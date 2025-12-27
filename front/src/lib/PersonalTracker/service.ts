import { ApiError } from '$lib/api';
import { toast } from '$lib/components/Toast';
import { createEvent, getAllEvents } from './api';
import { encryptData, decryptData, getRandomSalt, getUserKey } from '$lib/encryption';
import { DateTime } from 'luxon';

export type PersonalTrackerData =
    | {
          type: 'mood';
          data: number;
      }
    | {
          type: 'weight';
          data: number;
      }
    | {
          type: 'emotionwheel';
          data: {
              emotions: {
                  category: string;
                  subcategory: string;
                  emotion: string;
                  color: string;
              }[];
          };
      };

export const encryptAndUpload = async (data: PersonalTrackerData, password: string) => {
    const saltB64 = getRandomSalt().saltB64;
    const { keyB64 } = getUserKey({ password, saltB64 });
    const { ciphertextB64, nonceB64 } = encryptData({ data: JSON.stringify(data), keyB64 });

    const eventDateUnix = DateTime.now().toUTC().toUnixInteger();
    try {
        await createEvent({
            eventDateUnix,
            saltB64,
            nonceB64,
            ciphertextB64
        });
    } catch (error) {
        let errorMessage = (error as Error).message;
        if (error instanceof ApiError && error.code === 401) {
            errorMessage = 'Invalid logged in user';
        }
        const message = `<strong>Entry not created</strong><br/> ${errorMessage}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
    }
};

export type PersonalTrackerEvent = PersonalTrackerData & {
    eventDateUnix: number;
};

export const getAndDecryptEvents = async (password: string): Promise<PersonalTrackerEvent[]> => {
    const eventsCiphered = await getAllEvents();

    return eventsCiphered
        .map((cipher) => {
            const { keyB64 } = getUserKey({ password, saltB64: cipher.saltB64 });
            const { dataB64 } = decryptData({
                ciphertextB64: cipher.ciphertextB64,
                nonceB64: cipher.nonceB64,
                keyB64
            });

            const event = {
                ...JSON.parse(atob(dataB64)),
                eventDateUnix: cipher.eventDateUnix
            };

            try {
                return event;
            } catch (error) {
                console.log('Error parsing decrypted event');
                console.log(error);
                return;
            }
        })
        .filter((v) => v !== undefined);
};
