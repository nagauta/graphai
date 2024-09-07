#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const readTemplate = (file) => {
    return fs_1.default.readFileSync(path_1.default.resolve(__dirname) + "/../templates/" + file, "utf8");
};
const main = async () => {
    const npmRootPath = process.cwd();
    const packagePath = npmRootPath + "/package.json";
    if (!fs_1.default.existsSync(packagePath)) {
        console.log("No package.json. Run this script in root of npm repository directory.");
        return;
    }
    const packageJson = JSON.parse(fs_1.default.readFileSync(packagePath, "utf8"));
    const agents = await Promise.resolve(`${npmRootPath + "/lib/index"}`).then(s => __importStar(require(s)));
    const agentAttribute = (key) => {
        if (key === "packageName") {
            return packageJson.name;
        }
        if (key === "description") {
            return packageJson.description;
        }
        if (key === "agents") {
            const keys = Object.keys(agents);
            if (keys.length > 0) {
                if (keys.length > 5) {
                    return [
                        "\n  ",
                        Object.keys(agents).join(",\n  "),
                        "\n",
                    ].join("");
                }
                return Object.keys(agents).join(", ");
            }
        }
    };
    const temp = readTemplate(packageJson.name === "@graphai/agents" ? "readme-agent.md" : "readme.md");
    const md = ["packageName", "description", "agents"].reduce((tmp, key) => {
        tmp = tmp.replaceAll("{" + key + "}", agentAttribute(key));
        return tmp;
    }, temp);
    const readDocIfExist = (key) => {
        const docPath = npmRootPath + "/docs/" + key + ".md";
        if (fs_1.default.existsSync(docPath)) {
            return fs_1.default.readFileSync(docPath, "utf8");
        }
        return "";
    };
    const md2 = ["GraphDataJSON", "READMEBefore", "READMEAfter"].reduce((tmp, key) => {
        tmp = tmp.replaceAll("{" + key + "}", readDocIfExist(key));
        return tmp;
    }, md);
    fs_1.default.writeFileSync(npmRootPath + "/README.md", md2);
};
main();
