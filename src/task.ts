import { ComputedNode } from "@/node";
import { assert } from "@/utils/utils";

type TaskEntry = {
  node: ComputedNode;
  callback: (node: ComputedNode) => void;
};

export class TaskManager {
  private concurrency: number;
  private taskQueue: Array<TaskEntry> = [];
  private runningNodes = new Set<ComputedNode>();

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  private dequeueTaskIfPossible() {
    if (this.runningNodes.size < this.concurrency) {
      const task = this.taskQueue.shift();
      if (task) {
        this.runningNodes.add(task.node);
        task.callback(task.node);
      }
    }
  }

  public addTask(node: ComputedNode, callback: (node: ComputedNode) => void) {
    this.taskQueue.push({ node, callback });
    this.dequeueTaskIfPossible();
  }

  public onComplete(node: ComputedNode) {
    assert(this.runningNodes.has(node), `TaskManager.onComplete node(${node.nodeId}) is not in list`);
    this.runningNodes.delete(node);
    this.dequeueTaskIfPossible();
  }
}