import { DateTime } from 'luxon';

// Temporary hack because some records were created with a timestamp as
// an iso string. In the future we want to update these records or just delete them
const parseRecordTimestamp = (ts: number | string) => {
    if (typeof ts === 'number') {
        return DateTime.fromMillis(ts);
    }
    if (typeof ts === 'string') {
        return DateTime.fromISO(ts);
    }
    throw new Error('Cant parse record timestamp');
};

export const formatRecordTimestampToMillis = (ts: number) => {
    const time = parseRecordTimestamp(ts);
    return time.toMillis();
};

export const formatRecordTimestampToHuman = (ts: number) => {
    const time = parseRecordTimestamp(ts);
    if (time.diffNow('hours').hours > -12) {
        return time.toFormat('HH:mm');
    } else {
        return time.toFormat('dd/MM HH:mm');
    }
};

export const formatRecordTimestampToRelative = (ts: number) => {
    const time = parseRecordTimestamp(ts);
    return time.toRelative();
};
