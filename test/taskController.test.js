require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const EventEmitter = require("events");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  user1 = await prisma.User.create({
    data: { name: "Bob", email: "bob@sample.com", hashedPassword: "nonsense" },
  });
  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing task creation", () => {
  it("14. cant create a task without a user id", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("15. cant create a task with a bogus user id", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: 999999 };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });

  it("16. creates a task with a valid user id (status 201)", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });

  it("17. returned object has the expected title", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("first task");
  });

  it("18. returned object has the right isCompleted value", () => {
    expect(saveData.isCompleted).toBe(false);
  });

  it("19. returned object does not have a userId", () => {
    expect(saveData.userId).toBeUndefined();
    saveTaskId = saveData.id;
  });
});

describe("test getting created tasks", () => {
  it("20. cant get a list of tasks without a user id", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({ method: "GET" });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    try {
      await waitForRouteHandlerCompletion(index, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("21. using user1 id on index() returns a 200 status", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it("22. returned object has a tasks array of length 1", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.tasks.length).toBe(1);
  });

  it("23. title in the first array object is as expected", () => {
    expect(saveData.tasks[0].title).toBe("first task");
  });

  it("24. first array object does not contain a userId", () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });

  it("25. using user2 id on index() returns a 200 with empty tasks", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user2.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it("26. can retrieve the created task using show()", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it("27. user2 cant retrieve this task entry (404)", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
});

describe("testing update and delete of tasks", () => {
  it("28. user1 can set isCompleted to true", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: true },
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(update, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it("29. user2 cant update this task", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: true },
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(update, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });

  it("30. user2 cant delete this task", async () => {
    const req = httpMocks.createRequest({ method: "DELETE" });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });

  it("31. user1 can delete this task", async () => {
    const req = httpMocks.createRequest({ method: "DELETE" });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it("32. retrieving user1s tasks now returns empty tasks array", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    const data = saveRes._getJSONData();
    expect(data.tasks.length).toBe(0);
  });
});
