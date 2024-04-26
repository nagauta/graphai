import { AgentFunction } from "@/graphai";
import { graphDataTestRunner } from "~/utils/runner";
import { sleeperAgent, mapAgent, bypassAgent } from "@/experimental_agents";

import test from "node:test";
import assert from "node:assert";

const testAgent1: AgentFunction = async ({ debugInfo: { nodeId }, inputs }) => {
  // console.log("executing", nodeId, params, inputs);
  const result = {
    [nodeId]: [nodeId, inputs.map((a) => Object.values(a).flat())]
      .flat()
      .filter((a) => !!a)
      .join(":"),
  };
  // console.log("completing", nodeId, result);
  return result;
};

const testAgent1a: AgentFunction = async ({ debugInfo: { nodeId }, inputs }) => {
  // console.log("executing", nodeId, inputs);
  const result = {
    [nodeId]: [
      nodeId,
      inputs.map((a) => {
        return Object.values(a);
      }),
    ]
      .flat()
      .filter((a) => !!a)
      .join(":"),
  };
  // console.log("completing", nodeId, result);
  return result;
};

const copy2ArrayAgent: AgentFunction = async ({ inputs }) => {
  return new Array(10).fill(undefined).map(() => {
    return inputs[0];
  });
};

test("test fork 1", async () => {
  const forkGraph = {
    nodes: {
      node1: {
        agentId: "testAgent1a",
      },
      node2: {
        agentId: "copy2ArrayAgent",
        inputs: ["node1"],
      },
      nestedNode: {
        agentId: "mapAgent",
        inputs: ["node2"],
        params: {
          injectionTo: "buffer",
          resultFrom: "node3",
        },
        graph: {
          nodes: {
            buffer: {
              value: {},
            },
            node2: {
              agentId: "testAgent1a",
              inputs: ["buffer"],
            },
            node3: {
              agentId: "testAgent1a",
              inputs: ["node2"],
            },
          },
        },
      },
    },
  };

  const result = await graphDataTestRunner(__filename, forkGraph, { testAgent1a, mapAgent, copy2ArrayAgent });
  // console.log(JSON.stringify(result, null, "  "));
  assert.deepStrictEqual(result, {
    node1: {
      node1: "node1",
    },
    node2: [
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
      {
        node1: "node1",
      },
    ],
    nestedNode: {
      contents: [
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
        {
          node3: "node3:node2:node1",
        },
      ],
    },
  });
});

test("test fork 2", async () => {
  const forkGraph = {
    nodes: {
      node1: {
        agentId: "testAgent1",
        params: {},
      },
      node2: {
        agentId: "testAgent1",
        params: {},
        fork: 10,
        inputs: ["node1"],
      },
      node3: {
        agentId: "testAgent1",
        params: {},
        fork: 10,
        inputs: ["node2"],
      },
    },
  };

  const result = await graphDataTestRunner(__filename, forkGraph, { testAgent1 });
  // console.log(result);
  assert.deepStrictEqual(result, {
    node1: { node1: "node1" },
    node2_0: { node2_0: "node2_0:node1" },
    node2_1: { node2_1: "node2_1:node1" },
    node2_2: { node2_2: "node2_2:node1" },
    node2_3: { node2_3: "node2_3:node1" },
    node2_4: { node2_4: "node2_4:node1" },
    node2_5: { node2_5: "node2_5:node1" },
    node2_6: { node2_6: "node2_6:node1" },
    node2_7: { node2_7: "node2_7:node1" },
    node2_8: { node2_8: "node2_8:node1" },
    node2_9: { node2_9: "node2_9:node1" },
    node3_0: { node3_0: "node3_0:node2_0:node1" },
    node3_1: { node3_1: "node3_1:node2_1:node1" },
    node3_2: { node3_2: "node3_2:node2_2:node1" },
    node3_3: { node3_3: "node3_3:node2_3:node1" },
    node3_4: { node3_4: "node3_4:node2_4:node1" },
    node3_5: { node3_5: "node3_5:node2_5:node1" },
    node3_6: { node3_6: "node3_6:node2_6:node1" },
    node3_7: { node3_7: "node3_7:node2_7:node1" },
    node3_8: { node3_8: "node3_8:node2_8:node1" },
    node3_9: { node3_9: "node3_9:node2_9:node1" },
  });
});

test("test fork 2", async () => {
  const forkGraph = {
    nodes: {
      source: {
        value: { content: [{ level1: { level2: "hello1" } }, { level1: { level2: "hello2" } }] },
      },
      nestedNode: {
        agentId: "mapAgent",
        inputs: ["source.content"],
        params: {
          injectionTo: "workingMemory",
          resultFrom: "forked2",
        },
        graph: {
          nodes: {
            workingMemory: {
              value: {},
            },
            forked: {
              agentId: "sleeperAgent",
              inputs: ["workingMemory.level1"],
            },
            forked2: {
              agentId: "sleeperAgent",
              inputs: ["forked"],
            },
          },
        },
      },
      bypassAgent: {
        agentId: "bypassAgent",
        inputs: ["nestedNode"],
      },
    },
  };

  const result = await graphDataTestRunner(__filename, forkGraph, { sleeperAgent, mapAgent, bypassAgent });
  console.log(JSON.stringify(result, null, "  "));
  assert.deepStrictEqual(result, {
    source: { content: [{ level1: { level2: "hello1" } }, { level1: { level2: "hello2" } }] },
    nestedNode: { contents: [{ level2: "hello1" }, { level2: "hello2" }] },
    bypassAgent: { contents: [{ level2: "hello1" }, { level2: "hello2" }] },
  });
});
