import { readFileSync } from "fs";
import { findClosestJsonPath } from "./JsonPathCorrector";

// const givenTags = tags;

type TagData = {
	path: string;
	tag: {
		code: string;
		description: string;
		reference: string;
		list: {
			code: string;
			description: string;
			reference: string;
		}[];
	}[];
}[];

function formatJsonPathWithValue(path: string, value: string): string {
	// Match the last occurrence of `[*]` and capture the preceding path

	const match = path.match(/^(.*)\[\*\](.*)$/);
	if (!match) {
		console.log("paths", path , value);
		return "HelloLittleJohny"
		// throw new Error("Invalid path format. Path must contain '[*]'.");
	}
	// console.log(path);
	const basePath = match[1]; // Path before the last [*]
	const remainingPath = match[2]; // Path after the last [*]

	// Construct the query
	const query = `${basePath}[?(@${remainingPath}=='${value}')]`;
	return query;
}

export function generateTagsValidations(givenTags: Record<string, TagData>) {
	type keyOfTags = keyof typeof givenTags;
	const validPaths = JSON.parse(readFileSync("./validPaths.json", "utf8"));
	const finalValidations: Record<string, any[]> = {};
	for (const api in givenTags) {
		finalValidations[api] = [];
		const apiData: TagData = givenTags[api as keyOfTags];
		let i = 0;
		for (const tagsWithSameBase of apiData) {
			console.log("tagsWithSameBase", tagsWithSameBase);
			const basePath = tagsWithSameBase.path;
			const appendPath = basePath + "[*].code";
			const mostSimilarPath = findClosestJsonPath(
				validPaths[api as keyof typeof validPaths],
				appendPath
			) as string;
			console.log("most similar finding", mostSimilarPath, appendPath);
			const allCodes = tagsWithSameBase.tag.map((tag) => tag.code);
			const newConfig = {
				_NAME_: `validate_tag_${i}`,
				validTags: allCodes,
				tagPath: mostSimilarPath,
				_CONTINUE_: "!(tagPath are present)",
				_RETURN_: "tagPath all in validTags",
			};
			finalValidations[api].push(newConfig);
			for (const tag of tagsWithSameBase.tag) {
				const newPath = formatJsonPathWithValue(mostSimilarPath, tag.code);
				// console.log("TAG : ",tag.list?.allOf)
				console.dir(tag.list, {depth : null})
				const newConfig = {
					_NAME_: `validate_tag_${i}_${tag.code}`,
					_SCOPE_: newPath,
					subTags: "$.list[*].code",
					validValues: tag.list.map((l) => l.code),
					_RETURN_: "subTags all in validValues",
				};
				finalValidations[api].push(newConfig);
			}
			i += 1;
		}
	}
	return finalValidations;
}

// generateTagsValidations();
