import { readFileSync, writeFileSync } from "fs";
import path from "path";
import yaml from "js-yaml";
import { generateTagsValidations } from "./tag-generator";

interface Val {
	l1_attributes: Record<string, string[]>;
	l1_enums: {
		path: string;
		enums: {
			code: string;
		}[];
	}[];
}

export async function CREATE_BASE_VALIDATIONS(
	// givenTags: any,
	apiListForDifference: Record<string, string>
) {
	console.log("====================================");
	console.log("CREATING BASE VALIDATIONS");
	console.log("====================================");
	const file = readFileSync(
		path.resolve(__dirname, "./validation.yaml"),
		"utf8"
	);
	const data = yaml.load(file) as Record<string, Val>;
	const output: any = {};
	// const tagData = generateTagsValidations(givenTags);
	for (const key in data) {
		const attr = data[key].l1_attributes;
		console.log(key, " " ,data[key])
		let enums = data[key].l1_enums;
		const enum_output: any[] = [];
		if (!attr) {
			continue;
		}
		const attr_output: any[] = [];
		const alreadyUsed: string[] = [];
		let i = 0;
		for (const cat of Object.keys(attr)) {
			console.log("working on", cat);
			console.log(attr[cat]);
			for (const a of attr[cat]) {
				i++;
				const attrName = `Required_${a.split(".")[1]}_${a.split(".").pop()}`;

				const ob: any = {
					_NAME_: removeSpecialChars(attrName.toUpperCase(), alreadyUsed, i),
					attr: a,
					_RETURN_: "attr are present",
				};

				if (enums && enums.map((p) => p.path).includes(a)) {
					const enumData = enums.find((p) => p.path === a);
					const enumList = enumData?.enums.map((e) => e.code);
					ob.enumList = enumList;
					ob._RETURN_ = "attr are present && attr all in enumList";
					// enums = enums.filter((p) => p.path !== a);
				}

				if (Object.keys(apiListForDifference).includes(key)) {
					ob.useCasePath = apiListForDifference[key];
					const code = cat === "metro" ? "BUS" : "METRO";
					ob.useCode = [code];
					ob._CONTINUE_ = `!(useCasePath all in useCode)`;
				}
				attr_output.push(ob);
			}
		}

		if (!enums) {
			continue;
		}
		i = 0;
		for (const enumData of enums) {
			i++;
			const enum_path = enumData.path;
			const enumList = enumData.enums.map((e) => e.code);
			var enumName = `Valid_ENUM_${enum_path.split(".")[1]}_${enum_path
				.split(".")
				.pop()}`;
			enum_output.push({
				_NAME_: removeSpecialChars(enumName.toUpperCase(), alreadyUsed, i),
				enumList: enumList,
				enumPath: enum_path,
				_CONTINUE_: "!(enumPath are present)",
				_RETURN_: "enumPath all in enumList",
			});
		}
		// const tags = tagData[key] ?? [];
		// output[key] = [...attr_output, ...enum_output, ...tags];
		output[key] = [...attr_output, ...enum_output];
	}
	return output;
	// writeFileSync(
	// 	path.resolve(__dirname, "./final.json"),
	// 	JSON.stringify(output, null, 2)
	// );
}

function giveName(name: string, alreadyUsed: string[], index: number) {
	if (alreadyUsed.includes(name)) {
		alreadyUsed.push(`${name}_${index}`);
		return `${name}_${index}`;
	}
	alreadyUsed.push(name);
	return name;
}

function removeSpecialChars(
	input: string,
	alreadyUsed: string[],
	index: number
): string {
	return giveName(input.replace(/[^a-zA-Z0-9_]/g, ""), alreadyUsed, index);
}
