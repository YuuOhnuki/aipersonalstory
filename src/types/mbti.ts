export type MBTIAxis = 'E/I' | 'S/N' | 'T/F' | 'J/P';
export type MBTIValue = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
export type MBTIMap = Record<MBTIAxis, MBTIValue>;
export type MBTIType = string;

export type MBTIResult = {
    axes: MBTIMap;
    type: MBTIType;
    title: string;
    summary: string;
    story: string;
    features?: string; // common features of the type
    reasons?: string; // reasoning from the user's answers
    advice?: string; // counseling-like suggestions
};
