const testMode = false;

export function fromUndefined<A>(value: A | undefined, fallback: A): A {
    if (value === undefined) {
        return fallback;
    } else {
        return value;
    }
}

export function logTest(message: string) {
    if (testMode) {
        console.log(message);
    }
}
