import yaml from "js-yaml";

export interface SingleTag {
	code: string;
	description: string;
	reference: "<PR/Issue/Discussion Links md format text";
}

export interface TagInfo {
	code: string;
	description: string;
	reference: "<PR/Issue/Discussion Links md format text";
	required: string;
	list: TagInfo[];
}
export interface TagObject {
	path: string;
	tag: TagInfo[];
}

export type RecordOfTagArrays = Record<string, TagObject[]>;

export function mergeTagObjectRecords(
	record1: RecordOfTagArrays,
	record2: RecordOfTagArrays
): RecordOfTagArrays {
	const mergedRecord: RecordOfTagArrays = {};

	const mergeTags = (tags1: TagInfo[], tags2: TagInfo[]): TagInfo[] => {
		const mergedTags: TagInfo[] = [...tags1];
		const tagMap = new Map(tags1.map((tag) => [tag.code, tag]));

		tags2.forEach((tag) => {
			if (tagMap.has(tag.code)) {
				const existingTag = (tagMap.get(tag.code) || {description : "", reference : "", required: "", list : ""});
				// Deep merge logic for TagInfo, adjust according to your needs
				existingTag.description = tag.description
					? tag.description
					: existingTag.description;
				existingTag.reference = tag.reference
					? tag.reference
					: existingTag.reference;
				existingTag.required = tag.required
					? tag.required
					: existingTag.required;
				existingTag.list = tag.list ? tag.list : existingTag.list;
			} else {
				mergedTags.push(tag);
			}
		});

		return mergedTags;
	};

	const addItems = (key: string, items: TagObject[]) => {
		if (!mergedRecord[key]) {
			mergedRecord[key] = [];
		}

		items.forEach((item) => {
			const existingItem = mergedRecord[key].find(
				(existing) => existing.path === item.path
			);
			if (existingItem) {
				existingItem.tag = mergeTags(existingItem.tag, item.tag);
			} else {
				mergedRecord[key].push(item);
			}
		});
	};

	Object.keys(record1).forEach((key) => addItems(key, record1[key]));
	Object.keys(record2).forEach((key) => addItems(key, record2[key]));

	return mergedRecord;
}

export function tagsFromApi(yamlData: string) {
	const obj: any = yaml.load(yamlData);
	return tagsFromApiObj(obj);
}

export function tagsFromApiObj(obj: any) {
	let data: Record<string,any> = {};
	for (const key in obj) {
		data[key] = listDetailedPaths(obj[key]);
	}
	return data;
}

export function tagsToNested(data: Record<string, TagObject[]>) {
	let nestedData: Record<string,any> = {};
	for (const key in data) {
		nestedData[key] = convertDetailedPathsToNestedObjects(data[key]);
	}
	return nestedData;
}

function listDetailedPaths(obj: Record<string, any>) {
	let detailedPaths: TagObject[] = [];
	detailedPaths = explorePaths(obj, "", detailedPaths);
	return detailedPaths;
}

function explorePaths(
	subObj: Record<string, any>,
	currentPath: string,
	detailedPaths: TagObject[]
) {
	for (const key in subObj) {
		const newPath = currentPath ? `${currentPath}.${key}` : key;
		if (
			typeof subObj[key] === "object" &&
			subObj[key] !== null &&
			!Array.isArray(subObj[key])
		) {
			detailedPaths = explorePaths(subObj[key], newPath, detailedPaths);
		}
		if (Array.isArray(subObj[key])) {
			const tags: TagInfo[] = subObj[key].map((element: any) => {
				return {
					code: element.code,
					description: element.description,
					reference: element.reference,
					required: element.required,
					list: element.list,
				};
			});
			detailedPaths.push({ path: newPath, tag: tags });
		}
	}
	return detailedPaths;
}

function convertDetailedPathsToNestedObjects(detailedPaths: TagObject[]) {
	function setPath(obj: any, path: any, value: any) {
		const keys = path.split(".");
		const lastKey = keys.pop();
		const lastObj = keys.reduce((obj:any, key:any) => (obj[key] = obj[key] || {}), obj);
		lastObj[lastKey] = value;
	}
	const nestedObject = {};
	detailedPaths.forEach((element) => {
		setPath(nestedObject, element.path, element.tag);
	});
	return nestedObject;
}
