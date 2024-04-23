"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringEmbeddingsAgent = void 0;
const defaultEmbeddingModel = "text-embedding-3-small";
const OpenAI_embedding_API = "https://api.openai.com/v1/embeddings";
// This agent retrieves embedding vectors for an array of strings using OpenAI's API
//
// Parameters:
//   model: Specifies the model (default is "text-embedding-3-small")
//   inputKey: Specifies the property name (default is "contents")
// Inputs:
//   inputs[0].{inputKey}: Array<string>
// Result:
//   contents: Array<Array<number>>
//
const stringEmbeddingsAgent = async ({ params, inputs }) => {
    const input = inputs[0][params?.inputKey ?? "contents"];
    const sources = Array.isArray(input) ? input : [input];
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY key is not set in environment variables.");
    }
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };
    const response = await fetch(OpenAI_embedding_API, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            input: sources,
            model: params?.model ?? defaultEmbeddingModel,
        }),
    });
    const jsonResponse = await response.json();
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const embeddings = jsonResponse.data.map((object) => {
        return object.embedding;
    });
    return { contents: embeddings };
};
exports.stringEmbeddingsAgent = stringEmbeddingsAgent;