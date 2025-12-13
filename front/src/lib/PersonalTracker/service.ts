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
              emotion: {
                  category: string;
                  subcategory: string;
                  emotion: string;
                  color: string;
              };
          };
      };

export const encryptAndUpload = (data: PersonalTrackerData, password: string) => {
    const saltB64 = getRandomSalt().saltB64;
    const { keyB64 } = getUserKey({ password, saltB64 });
    const encrypted = encryptData({ data, keyB64 });

    const timestampUTC = DateTime.now().toUTC().toUnixInteger();
    try {
        await createEvent({
            event: {
                timestampUTC,
                type: 'weight',
                value: Math.floor(value * 100)
            }
        });
        onUpload();
    } catch (error) {
        let errorMessage = (error as Error).message;
        if (error instanceof ApiError && error.code === 401) {
            errorMessage = 'Invalid logged in user';
        } else if (error instanceof UserLoggedOutError) {
            errorMessage = 'User is logged out';
        }
        const message = `<strong>Entry not created</strong><br/> ${errorMessage}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
    }
};
