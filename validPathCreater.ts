// Import the JSONSchema7 type from the official types package
import { JSONSchema7 } from "json-schema";

/**
 * Extracts all possible JSON paths from a given JSON Schema Draft-07.
 *
 * @param schema - The JSON Schema Draft-07 object.
 * @returns An array of JSON paths as strings.
 */
export function getAllJsonPaths(schema: JSONSchema7): string[] {
	const paths: Set<string> = new Set();

	/**
	 * Recursively traverses the JSON schema to extract paths.
	 *
	 * @param currentSchema - The current schema node being traversed.
	 * @param currentPath - The JSON path accumulated so far.
	 */
	function traverse(currentSchema: JSONSchema7, currentPath: string) {
		if (!currentSchema) return;

		// Normalize the 'type' property to an array for consistent processing
		const schemaTypes = Array.isArray(currentSchema.type)
			? currentSchema.type
			: currentSchema.type
			? [currentSchema.type]
			: [];

		// Handle combinators: allOf, anyOf, oneOf
		const combinators: Array<keyof JSONSchema7> = ["allOf", "anyOf", "oneOf"];
		for (const comb of combinators) {
			if (currentSchema[comb]) {
				// @ts-ignore
				for (const subSchema of currentSchema[comb]!) {
					traverse(subSchema as JSONSchema7, currentPath);
				}
			}
		}

		// Handle 'not' by skipping as it signifies exclusion
		if (currentSchema.not) {
			// Skipping 'not' schemas as they represent negations
		}

		// If the schema is of type 'object', traverse its properties
		if (schemaTypes.includes("object") && currentSchema.properties) {
			for (const [propName, propSchema] of Object.entries(
				currentSchema.properties
			)) {
				const newPath =
					currentPath === "$" ? `$.${propName}` : `${currentPath}.${propName}`;
				traverse(propSchema as JSONSchema7, newPath);
			}

			// Handle 'additionalProperties' if it's a schema
			if (
				currentSchema.additionalProperties &&
				typeof currentSchema.additionalProperties === "object"
			) {
				const newPath = `${currentPath}.*`; // Using '*' to denote any additional property
				traverse(currentSchema.additionalProperties as JSONSchema7, newPath);
			}

			// Handle 'patternProperties'
			if (currentSchema.patternProperties) {
				for (const [pattern, patternSchema] of Object.entries(
					currentSchema.patternProperties
				)) {
					const newPath = `${currentPath}.*`; // Using '*' as a placeholder for any matching pattern
					traverse(patternSchema as JSONSchema7, newPath);
				}
			}
		}

		// If the schema is of type 'array', traverse its items
		if (schemaTypes.includes("array") && currentSchema.items) {
			if (Array.isArray(currentSchema.items)) {
				// Tuple validation: items is an array of schemas
				currentSchema.items.forEach((itemSchema, index) => {
					const newPath = `${currentPath}[*]`; // Using [*] to denote any index
					traverse(itemSchema as JSONSchema7, newPath);
				});
			} else {
				// List validation: items is a single schema
				const newPath = `${currentPath}[*]`;
				traverse(currentSchema.items as JSONSchema7, newPath);
			}
		}

		// Define primitive types considered as leaf nodes
		const primitiveTypes: Array<Extract<JSONSchema7["type"], string>> = [
			"string",
			"number",
			"integer",
			"boolean",
			"null",
		];

		// If the schema defines a primitive type, record the path
		if (schemaTypes.some((type) => primitiveTypes.includes(type))) {
			paths.add(currentPath);
		}

		// If 'enum' is present without a specific type, consider it as a leaf node
		if (currentSchema.enum) {
			paths.add(currentPath);
		}

		// If 'const' is present, consider it as a leaf node
		if (currentSchema.const !== undefined) {
			paths.add(currentPath);
		}

		// Handle cases where 'type' is not specified but 'properties' or 'items' are present
		if (!currentSchema.type) {
			if (currentSchema.properties) {
				for (const [propName, propSchema] of Object.entries(
					currentSchema.properties
				)) {
					const newPath =
						currentPath === "$"
							? `$.${propName}`
							: `${currentPath}.${propName}`;
					traverse(propSchema as JSONSchema7, newPath);
				}
			}
			if (currentSchema.items) {
				const newPath = `${currentPath}[*]`;
				traverse(currentSchema.items as JSONSchema7, newPath);
			}
		}
	}

	// Initialize traversal with the root schema and the root path symbol '$'
	traverse(schema, "$");

	// Convert the Set to an array and return
	return Array.from(paths);
}
