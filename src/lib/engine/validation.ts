export function inRange(value: number, min: number, max: number): boolean {
	return Number.isFinite(value) && value >= min && value <= max;
}

export function requireRange(value: number, min: number, max: number, label: string): void {
	if (!inRange(value, min, max))
		throw new RangeError(`${label} must be between ${min} and ${max}.`);
}

export function requirePositive(value: number, label: string): void {
	if (!Number.isFinite(value) || value <= 0)
		throw new RangeError(`${label} must be finite and greater than zero.`);
}

export function requireChoice<T extends string>(
	value: T,
	choices: readonly T[],
	label: string
): void {
	if (!choices.includes(value)) throw new RangeError(`Select a supported ${label}.`);
}
