// ! USE "tsx COMPLETE.ts" to run this

import { CREATE_FIRST } from "./ajvGenerator";

import { readFileSync, writeFileSync } from "fs";
import yaml from "js-yaml";
import { CREATE_BASE_VALIDATIONS } from "./config-creater";
import { tagsFromApiObj } from "./convertRawTags";
const run = async () => {
	const { ConfigCompiler } = await import("ondc-code-generator");
	const { SupportedLanguages } = await import(
		"ondc-code-generator/dist/types/compiler-types"
	);
	var compiler = new ConfigCompiler(SupportedLanguages.Typescript);
	const build = readFileSync("./build.yaml", "utf8");
	await compiler.initialize(build);
	const paths = await compiler.generateValidPaths();
	console.log(paths)
	writeFileSync("./validPaths.json", JSON.stringify(paths, null, 2));
	console.log("VALID PATHS GENERATED");
	await CREATE_FIRST();

	const t = yaml.load(build) as any;
	// const tags = tagsFromApiObj(t["x-tags"]);
	const apiListForDifference = {
		// search: "$.message.intent.fulfillment.vehicle.category",
		// on_search:
		// 	"$.message.catalog.providers[*].fulfillments[*].vehicle.category",
		// on_select: "$.message.order.fulfillments[*].vehicle.category",
		// on_init: "$.message.order.fulfillments[*].vehicle.category",
		// on_confirm: "$.message.order.fulfillments[*].vehicle.category",
		// on_cancel: "$.message.order.fulfillments[*].vehicle.category",
		// on_status: "$.message.order.fulfillments[*].vehicle.category",
	};
	const generated1 = await CREATE_BASE_VALIDATIONS(apiListForDifference);
	// const final = await mergeAttr({ _TESTS_: generated1 });
	writeFileSync(
		"./COMPLETE.json",
		JSON.stringify({ _TESTS_: generated1, _SESSION_DATA_: {} }, null, 2)
	);
};

(async () => {
	await run();
})();
