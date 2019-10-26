const testMode = false;

export function fromUndefined<T>(value: T | undefined, fallback: T): T {
    if (value === undefined) {
        return fallback;
    } else {
        return value;
    }
}

export function logTest(message: string): void {
    if (testMode) {
        console.log(message);
    }
}
