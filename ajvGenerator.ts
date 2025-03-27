import yaml from "js-yaml";
import { readFileSync, writeFileSync } from "fs";
import { BUID_TYPE } from "./buildTypes";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { enumsFromObj } from "./enumUtils";
import { ConvertAttributeFromBuildToTable } from "./attrUtils";

export async function dereferenceSchema(schema: any) {
	try {
		const dereferencedSchema = await RefParser.dereference(schema);
		return dereferencedSchema;
	} catch (error) {
		console.error("Error dereferencing schema:", error);
	}
}

export const CREATE_FIRST = async () => {
	const yamlData = readFileSync("./build.yaml", "utf8");
	const raw = yaml.load(yamlData);
	const data = (await dereferenceSchema(raw)) as BUID_TYPE;
	const paths = data.paths;
	const apis = Object.keys(paths).map((key) => {
		return key.split("/")[1];
	});
	const output: any = {};
	// const resolvedSchema = resolveAllOf(afterEnums);
	const enums = data["x-enum"];
	const enumData = enumsFromObj(enums);
	const attri = data["x-attributes"];

	const extractedAttr = ConvertAttributeFromBuildToTable(attri);

	for (const targetApi of apis) {
		// const existingSchema =
		// 	paths[`/${targetApi}`].post.requestBody.content["application/json"]
		// 		.schema;

		// const requiredSchema = removeRequiredAndEnum(existingSchema);

		const targetEnum = enumData[targetApi];

		const apiSet = new Set<string>();
		for (const cat in extractedAttr) {
			for (const api in extractedAttr[cat]) {
				apiSet.add(api);
			}
		}
		const reverse: any = {};
		for (const api of apiSet) {
			reverse[api] = {};
			for (const key in extractedAttr) {
				if (extractedAttr[key][api]) {
					reverse[api][key] = extractedAttr[key][api];
				} else {
					reverse[api][key] = [];
				}
			}
		}

		const generatedOutput = {
			l1_attributes: reverse[targetApi],
			l1_enums: targetEnum,
		};
		output[targetApi] = generatedOutput;
	}
	const yml = yaml.dump(output);
	writeFileSync("./validation.yaml", yml);
};

// (async () => {
// 	await run();
// })();

// laod yaml
// convert yaml to json
// dereference json
// remove all enums
// resolve allOf
// add new enums
