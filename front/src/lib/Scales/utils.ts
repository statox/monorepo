export const degreeToRoman = (degree: number) => {
    if (degree < 1 || degree > 7) {
        throw new Error(`Unkown degree ${degree}`);
    }
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    return romans[degree - 1];
};
