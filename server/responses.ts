import { User } from "./app";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friend";
import { MessageDoc } from "./concepts/message";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { TaskDoc } from "./concepts/task";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }

  /**
   * Convert MessageDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async messages(messages: MessageDoc[]) {
    const from = messages.map((message) => message.from);
    const to = messages.map((message) => message.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return messages.map((message, i) => ({ ...message, from: usernames[i], to: usernames[i + messages.length] }));
  }

  /**
   * Convert TaskDoc into more readable format for the frontend
   * by converting the host, attendees, and interested ids into usernames.
   */
  static async task(task: TaskDoc | null) {
    if (!task) return task;
    const requester = await User.getUserById(task.requester);
    const assisters = await User.idsToUsernames(task.assisters);
    const viewers = await User.idsToUsernames(task.viewed);
    return { ...task, requester: requester.username, assisters: assisters, viewed: viewers };
  }

  /**
   * Convert many TaskDocs into more readable format for the frontend
   * by converting the host, attendees, and interested ids into usernames.
   */
  static async tasks(tasks: TaskDoc[], isMatched?: boolean[]) {
    const requesters = await User.idsToUsernames(tasks.map((task) => task.requester));
    const assisters = await Promise.all(tasks.map((task) => User.idsToUsernames(task.assisters)));
    const viewers = await Promise.all(tasks.map((task) => User.idsToUsernames(task.viewed)));
    if (isMatched) {
      return tasks.map((task, i) => ({ ...task, requester: requesters[i], assisters: assisters[i], viewed: viewers[i], matched: isMatched[i] }));
    }
    return tasks.map((task, i) => ({ ...task, requester: requesters[i], assisters: assisters[i], viewed: viewers[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});
