import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface TaskDoc extends BaseDoc {
  requester: ObjectId;
  title: string;
  description: string;
  deadline: Date; // array of json objects. json has `start` and `end` dates
  files: string[];
  assisters: ObjectId[];
  viewed: ObjectId[];
  completed: boolean;
  completionDate: Date | null;
  completer: ObjectId | null;
}

export default class TaskConcept {
  public readonly tasks = new DocCollection<TaskDoc>("tasks");

  async create(requester: ObjectId, title: string, description: string, deadline: Date, files: string[] = []) {
    const _id = await this.tasks.createOne({
      requester,
      title,
      description,
      deadline,
      files,
      assisters: [],
      viewed: [],
      completed: false,
      completionDate: null,
      completer: null,
    });
    return { msg: "Task successfully created!", id: _id, task: await this.tasks.readOne({ _id }) };
  }

  async getTasks(query: Filter<TaskDoc>) {
    const tasks = await this.tasks.readMany(query, {
      sort: { deadline: 1 },
    });
    return tasks;
  }

  async getTaskById(_id: ObjectId) {
    const task = await this.tasks.readOne({ _id });
    if (!task) throw new NotFoundError("Task not found!");
    return task;
  }

  async getTasksByRequester(requester: ObjectId) {
    return await this.getTasks({ requester, completed: false });
  }

  async update(_id: ObjectId, update: Partial<TaskDoc>) {
    this.sanitizeUpdate(update);
    await this.tasks.updateOne({ _id }, update);
    return { msg: "Task successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.tasks.deleteOne({ _id });
    return { msg: "Task deleted successfully!" };
  }

  /**
   * Assister offers to help with task.
   *
   * @param assister id of assister
   * @param _id id of task
   */
  async offerHelp(assister: ObjectId, _id: ObjectId) {
    await this.isNotRequester(assister, _id);
    await this.isNotAssister(assister, _id);

    const task = await this.tasks.readOne({ _id });
    if (!task) throw new NotFoundError(`Task ${_id} does not exist!`);

    const assisters = task.assisters;
    assisters.push(assister);
    this.tasks.updateOne({ _id }, { assisters: assisters });
    return { msg: "Successfully offered help." };
  }

  /**
   * Assister reacts help offer for task.
   *
   * @param assister id of assister
   * @param _id id of task
   */
  async retractHelp(assister: ObjectId, _id: ObjectId) {
    await this.isNotRequester(assister, _id);
    await this.isAssister(assister, _id);

    const task = await this.tasks.readOne({ _id });
    if (!task) throw new NotFoundError(`Task ${_id} does not exist!`);

    const assisters = task.assisters;
    const index = assisters.map((e) => e.toString()).indexOf(assister.toString());
    if (index !== -1) assisters.splice(index, 1);
    this.tasks.updateOne({ _id }, { assisters: assisters });
    return { msg: "Successfully retracted help offer." };
  }

  /**
   * Marks task as completed.
   *
   * @param assiter id of assister
   * @param _id id of task
   */
  async complete(_id: ObjectId, assister?: ObjectId) {
    const task = await this.tasks.readOne({ _id });
    if (!task) throw new NotFoundError(`Task ${_id} does not exist!`);
    await this.tasks.updateOne({ _id }, { completed: true, completionDate: new Date(), completer: assister });
    return { msg: "Successfully completed task." };
  }

  /**
   * Adds viewer to the viewed set.
   *
   * @param viewer id of viewer
   * @param _id id of task
   */
  async view(viewer: ObjectId, _id: ObjectId) {
    const task = await this.tasks.readOne({ _id });
    if (!task) throw new NotFoundError(`Task ${_id} does not exist!`);

    const viewed = task.viewed;

    // if viewer has not viewed task yet
    if (!viewed.map((e) => e.toString()).includes(viewer.toString())) {
      viewed.push(viewer);
      await this.tasks.updateOne({ _id }, { viewed: viewed });
    }

    return { msg: "Successfully viewed task." };
  }

  async isRequester(requester: ObjectId, _id: ObjectId) {
    const task = await this.tasks.readOne({ _id });
    if (!task) {
      throw new NotFoundError(`Task ${_id} does not exist!`);
    }
    if (task.requester.toString() !== requester.toString()) {
      throw new TaskRequesterNotMatchError(requester, _id);
    }
  }

  async isNotRequester(requester: ObjectId, _id: ObjectId) {
    const task = await this.tasks.readOne({ _id });
    if (!task) {
      throw new NotFoundError(`Task ${_id} does not exist!`);
    }
    if (task.requester.toString() === requester.toString()) {
      throw new NotAllowedError("Person is the requester.");
    }
  }

  async isNotAssister(assister: ObjectId, _id: ObjectId) {
    const task = await this.tasks.readOne({ _id });
    if (!task) {
      throw new NotFoundError(`Task ${_id} does not exist!`);
    }
    const assisters = task.assisters.map((e) => e.toString());
    if (assisters.map((assister) => assister.toString()).includes(assister.toString())) {
      throw new NotAllowedError("Person is already an assister.");
    }
  }

  async isAssister(assister: ObjectId, _id: ObjectId) {
    const task = await this.tasks.readOne({ _id });
    if (!task) {
      throw new NotFoundError(`Task ${_id} does not exist!`);
    }
    const assisters = task.assisters.map((e) => e.toString());
    if (!assisters.map((assister) => assister.toString()).includes(assister.toString())) {
      throw new NotAllowedError("Person is not an assister.");
    }
  }

  private sanitizeUpdate(update: Partial<TaskDoc>) {
    // Make sure the update cannot change the host, interested people, or attendees
    const prohibitedUpdates = ["requester"];
    for (const key in update) {
      if (prohibitedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class TaskRequesterNotMatchError extends NotAllowedError {
  constructor(
    public readonly requester: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the host of Task {1}!", requester, _id);
  }
}
