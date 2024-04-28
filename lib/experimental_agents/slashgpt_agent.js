"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slashGPTAgent = void 0;
const path_1 = __importDefault(require("path"));
const slashgpt_1 = require("slashgpt");
const config = new slashgpt_1.ChatConfig(path_1.default.resolve(__dirname));
const slashGPTAgent = async ({ params, inputs, debugInfo: { verbose, nodeId } }) => {
    if (verbose) {
        console.log("executing", nodeId, params);
    }
    const session = new slashgpt_1.ChatSession(config, params.manifest ?? {});
    const query = params?.query ? [params.query] : [];
    const contents = query.concat(inputs);
    session.append_user_question(contents.join("\n"));
    await session.call_loop(() => { });
    const message = (() => {
        if (params?.function_result) {
            return session.history.messages().find((m) => m.role === "function_result");
        }
        return session.history.last_message();
    })();
    if (message === undefined) {
        throw new Error("No message in the history");
    }
    return message;
};
exports.slashGPTAgent = slashGPTAgent;
const slashGPTAgentInfo = {
    name: "slashGPTAgent",
    agent: exports.slashGPTAgent,
    mock: exports.slashGPTAgent,
    samples: [],
    description: "Slash GPT Agent",
    author: "Receptron team",
    repository: "https://github.com/receptron/graphai",
    license: "MIT",
};
exports.default = slashGPTAgentInfo;