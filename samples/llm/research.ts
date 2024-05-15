import "dotenv/config";
import { graphDataTestRunner } from "~/utils/runner";
import { groqAgent, openAIAgent, nestedAgent, copyAgent, propertyFilterAgent, wikipediaAgent } from "@/experimental_agents";
import input from "@inquirer/input";

const tools = [
  {
    type: "function",
    function: {
      name: "translated",
      description: "Report the langauge of the input and its English translation.",
      parameters: {
        type: "object",
        properties: {
          englishTranslation: {
            type: "string",
            description: "English translation of the input",
          },
          language: {
            type: "string",
            description: "Identified language",
            values: ["English", "Japanese", "French", "Spenish", "Italian"],
          },
        },
        required: ["result"],
      },
    },
  },
];

const translation_graph = {
  nodes: {
    identifier: {
      // This node sends those messages to Llama3 on groq to get the answer.
      agent: "openAIAgent",
      params: {
        model: "gpt-4o",
        system: "You are responsible in identifying the language of the input and translate it into English. " +
              "Call the 'translated' function with 'language' and 'englishTranslation'. " +
              "If the input is already in English, call the 'translated' function with 'englishTranslate=the input text', and 'langage=English'." ,
        tools,
        tool_choice: { type: "function", function: { name: "translated" } },
      },
      inputs: [":$0"],
    },
    parser: {
      agent: (args: string) => JSON.parse(args),
      inputs: [":identifier.choices.$0.message.tool_calls.$0.function.arguments"],
    },
    extractor: {
      agent: "propertyFilterAgent",
      params: {
        inject: [{
          propId: 'language',
          from: 1,
        },{
          propId: 'text',
          from: 2,
        }]
      },
      inputs: [{}, ":parser.language", ":parser.englishTranslation"],
    },
    result: {
      agent: (data: Record<string, any>) => ({
        isEnglish: data.language === "English",
        isNonEnglish: data.langage !== "English",
        ...data
      }),
      inputs: [":extractor"],
      isResult: true
    },
  }
};

const graph_data = {
  version: 0.3,
  nodes: {
    topic: {
      agent: () => input({ message: "Type the topic you want to research:" }),
    },
    translator: {
      agent: "nestedAgent",
      inputs: [":topic"],
      graph: translation_graph,
    },
    wikipedia: {
      agent: "wikipediaAgent",
      params: {
        lang: "en",
      },
      inputs: [":translator.result.text"],
    },
    summary: {
      agent: "openAIAgent",
      params: {
        model: "gpt-4o",
        system: "Summarize the text below in 400 words" ,
      },
      inputs: [":wikipedia.content"],
    },
    result: {
      agent: "copyAgent",
      isResult: true,
      inputs: [":summary.choices.$0.message.content"]
    }
  },
};

export const main = async () => {
  const result: any = await graphDataTestRunner(
    __filename,
    graph_data,
    {
      groqAgent,
      nestedAgent,
      copyAgent,
      openAIAgent,
      propertyFilterAgent,
      wikipediaAgent,
    },
    () => {},
    false,
  );
  console.log(JSON.stringify(result, null, 2));
};

if (process.argv[1] === __filename) {
  main();
}
