export const map = function (
    n: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number
) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

export const random = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};
