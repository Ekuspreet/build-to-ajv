import yaml from "js-yaml";
import { readFileSync, writeFileSync } from "fs";
import { BUID_TYPE } from "./buildTypes";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { enumsFromObj } from "./enumUtils";
import { ConvertAttributeFromBuildToTable, getActionCall } from "./attrUtils";

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
	console.log("ALL APIS", apis)
	for (const targetApi of apis) {
		// const existingSchema =
		// 	paths[`/${targetApi}`].post.requestBody.content["application/json"]
		// 		.schema;

		// const requiredSchema = removeRequiredAndEnum(existingSchema);
		// console.log("Current Api", targetApi)
		const targetEnum = enumData[targetApi];
		// console.log(targetEnum, " FOR API", targetApi)
		const apiSet = new Set<string>();
		for (const cat in extractedAttr) {
			for (const api in extractedAttr[cat]) {
				apiSet.add(api);
			}
		}
		console.log(apiSet, "SET FOR API", targetApi)
		
		const reverse: any = {};
		for (const api of apiSet) {
			reverse[getActionCall(api)] = {};
			for (const key in extractedAttr) {
				if (extractedAttr[key][api]) {
					// console.log("LOOKING FOR KEY",key,api, extractedAttr[key][api])
				console.log("MY_FUNCTION - FOR", api, getActionCall(api))	
					reverse[getActionCall(api)][key] = extractedAttr[key][api];
				} else {
					reverse[getActionCall(api)][key] = [];
				}
			}
		}
		
		console.log( "REVERSE FOR API", targetApi,  reverse[targetApi])

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
