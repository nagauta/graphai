import { AgentFunctionInfo } from "graphai";
import { debugResultKey } from "graphai/lib/utils/utils";

import jsonSchemaGenerator from "json-schema-generator";

import * as packages from "@graphai/agents";

import fs from "fs";
import path from "path";

const agentAttribute = (agentInfo: AgentFunctionInfo, key: string) => {
  if (key === "samples") {
    return Array.from(agentInfo.samples.keys()).map((key) => {
      const sample = agentInfo.samples[key];
      return [
          `### Sample${key}`,
          "#### inputs",
          "```json",
          JSON.stringify(sample.inputs, null, 2),
          "````",
          "#### params",
          "```json",
          JSON.stringify(sample.params),
          "````",
          "#### result",
          "```json",
          JSON.stringify(sample.result, null, 2),
          "````",
        ].join("\n\n");
        // return JSON.stringify(agentInfo.samples, null, 2);
      })
      .join("\n");
  }
  if (key === "schemas") {
    if (agentInfo.inputs && agentInfo.output) {
      return [
        "#### inputs",
        "```json",
        JSON.stringify(agentInfo.inputs, null, 2),
        "````",
        "#### output",
        "```json",
        JSON.stringify(agentInfo.output, null, 2),
        "````",
      ].join("\n\n");
    }
    return agentInfo.samples
      .map((sample) => {
        return ["#### inputs", "```json", JSON.stringify(jsonSchemaGenerator(sample.inputs), null, 2), "````"].join("\n\n");
        // return JSON.stringify(agentInfo.samples, null, 2);
      })
      .join("\n");
  }
  if (key === "resultKey") {
    return agentInfo.samples
      .map((sample) => {
        return ["```json", JSON.stringify(debugResultKey("agentId", sample.result), null, 2), "````"].join("\n\n");
      })
      .join("\n");
  }
  return agentInfo[key as keyof AgentFunctionInfo] as string;
};

const readTemplate = (file: string) => {
  return fs.readFileSync(path.resolve(__dirname) + "/../templates/" + file, "utf8");
};

const agentMd = (agentInfo: AgentFunctionInfo) => {
  const template = readTemplate("agent.md");
  const md = ["name", "description", "author", "repository", "license", "samples", "schemas", "resultKey"].reduce((tmp, key) => {
    tmp = tmp.replace("{" + key + "}", agentAttribute(agentInfo, key));
    return tmp;
  }, template);
  return md;
};
const IndexMd = (ret: Record<string, Record<string, string>>) => {
  const templates = [];
  for (const cat of Object.keys(ret)) {
    templates.push("## " + cat);
    for (const agentName of Object.keys(ret[cat])) {
      templates.push("### [" + agentName + "](./" + cat + "/" + agentName + ".md)");
    }
    templates.push("");
  }
  return templates.join("\n");
};
const main = () => {
  const ret: Record<string, Record<string, string>> = {};
  const base_path = __dirname + "/../../../docs/agentDocs/";
  Object.values(packages).map((agent) => {
    const md = agentMd(agent);
    agent.category.map(async (cat: string) => {
      if (!ret[cat]) {
        ret[cat] = {};
      }
      ret[cat][agent.name] = agent.name;
      const catDir = path.resolve(base_path + cat);
      await fs.promises.mkdir(catDir, { recursive: true });
      fs.writeFileSync(catDir + "/" + agent.name + ".md", md);
    });
  });
  // console.log(ret);
  const index = IndexMd(ret);
  fs.writeFileSync(base_path + "/README.md", index);
};

main();
