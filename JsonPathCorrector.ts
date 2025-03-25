/**
 * Calculates the Levenshtein distance between two strings.
 * Levenshtein distance is a metric for measuring the difference between two sequences.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns The Levenshtein distance.
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	const aLen = a.length;
	const bLen = b.length;

	// If one of the strings is empty
	if (aLen === 0) return bLen;
	if (bLen === 0) return aLen;

	// Initialize the matrix
	for (let i = 0; i <= bLen; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= aLen; j++) {
		matrix[0][j] = j;
	}

	// Compute the Levenshtein distance
	for (let i = 1; i <= bLen; i++) {
		for (let j = 1; j <= aLen; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1, // Deletion
					matrix[i][j - 1] + 1, // Insertion
					matrix[i - 1][j - 1] + 1 // Substitution
				);
			}
		}
	}

	return matrix[bLen][aLen];
}

/**
 * Normalizes a JSON path by ensuring it starts with '$' and has consistent formatting.
 *
 * @param path - The JSON path to normalize.
 * @returns The normalized JSON path.
 */
function normalizePath(path: string): string {
	// Trim whitespace
	path = path.trim();

	// Ensure the path starts with '$'
	if (!path.startsWith("$")) {
		path = "$." + path;
	}

	// Replace multiple dots with a single dot
	path = path.replace(/\.+/g, ".");

	// Remove trailing dots
	path = path.replace(/\.$/, "");

	return path;
}

/**
 * Finds the most similar valid JSON path to an invalid JSON path from a list of valid paths.
 *
 * @param validPaths - An array of valid JSON paths.
 * @param invalidPath - The invalid JSON path to find the closest match for.
 * @returns The most similar valid JSON path. Returns undefined if the validPaths list is empty.
 */
export function findClosestJsonPath(
	validPaths: string[],
	invalidPath: string
): string | undefined {
	// console.log("validPaths", validPaths);
	if (validPaths.length === 0) {
		return undefined;
	}
	// Normalize the invalid path
	const normalizedInvalidPath = normalizePath(invalidPath);
	console.log("🚀 ~ normalizedInvalidPath:", normalizedInvalidPath, ' ', invalidPath)

	let closestPath: string = validPaths[0];
	let smallestDistance: number = levenshteinDistance(
		normalizedInvalidPath,
		normalizePath(validPaths[0])
	);
	console.log("🚀 ~ smallestDistance:", smallestDistance)

	for (let i = 1; i < validPaths.length; i++) {
		const currentPath = validPaths[i];
		const normalizedCurrentPath = normalizePath(currentPath);
		const distance = levenshteinDistance(
			normalizedInvalidPath,
			normalizedCurrentPath
		);

		if (distance < smallestDistance) {
			smallestDistance = distance;
			closestPath = currentPath;
		}
	}

	return closestPath;
}
