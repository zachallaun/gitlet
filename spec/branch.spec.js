var fs = require("fs");
var g = require("../src/gitlet");
var testUtil = require("./test-util");

describe("branch", function() {
  beforeEach(testUtil.initTestDataDir);
  beforeEach(testUtil.pinDate);
  afterEach(testUtil.unpinDate);

  it("should throw if not in repo", function() {
    expect(function() { g.branch(); })
      .toThrow("not a Gitlet repository");
  });

  it("should throw if master has not been created", function() {
    g.init();
    expect(function() { g.branch("woo"); })
      .toThrow("master not a valid object name");
  });

  it("should create new branch pointed at HEAD when call branch w branch name", function() {
    g.init();
    testUtil.createFilesFromTree({ "1": { "filea": "filea"}});
    g.add("1/filea");
    g.commit({ m: "first" });
    g.branch("woo");
    testUtil.expectFile(".gitlet/refs/heads/woo", "3606c2bf");
  });

  it("should should leave master pointed at orig hash after branching", function() {
    g.init();
    testUtil.createFilesFromTree({ "1": { "filea": "filea"}});
    g.add("1/filea");
    g.commit({ m: "first" });
    testUtil.expectFile(".gitlet/refs/heads/master", "3606c2bf");
    g.branch("woo");
    testUtil.expectFile(".gitlet/refs/heads/master", "3606c2bf");
  });

  it("should return list of branches when called with no args", function() {
    g.init();
    testUtil.createFilesFromTree({ "1": { "filea": "filea"}});
    g.add("1/filea");
    g.commit({ m: "first" });
    g.branch("woo");
    g.branch("boo");
    expect(g.branch()).toEqual("  boo\n* master\n  woo\n");
  });

  it("should prevent branching if branch already exists", function() {
    g.init();
    testUtil.createFilesFromTree({ "1": { "filea": "filea"}});
    g.add("1/filea");
    g.commit({ m: "first" });
    g.branch("woo");
    expect(function() { g.branch("woo") })
      .toThrow("A branch named woo already exists");
  });

  it("should throw if -u passed but no commits", function() {
    g.init();
    expect(function() { g.branch(undefined, { u: "notthere/whatever" }) })
      .toThrow("master not a valid object name");
  });

  it("should throw if -u passed, there are commits, but remote does not exist", function() {
    g.init();
    testUtil.createFilesFromTree({ "1": { "filea": "filea"}});
    g.add("1/filea");
    g.commit({ m: "first" });

    expect(function() { g.branch(undefined, { u: "notthere/whatever" }) })
      .toThrow("the requested upstream branch notthere/whatever does not exist");
  });

  it("should throw if -u and detached head", function() {
    g.init();
    testUtil.createStandardFileStructure();
    g.add("1a/filea");
    g.commit({ m: "first" });
    g.checkout("17a11ad4");

    expect(function() { g.branch(undefined, { u: "origin/master" }) })
      .toThrow("HEAD is detached so could not set upstream to origin/master");
  });

  it("should throw if -u, there are commits, remote exists, rem branch doesn't", function() {
    g.init();
    testUtil.createFilesFromTree({ "1": { "filea": "filea"}});
    g.add("1/filea");
    g.commit({ m: "first" });
    g.remote("add", "origin", "file://a/b/c/d");

    expect(function() { g.branch(undefined, { u: "origin/etuteuh" }) })
      .toThrow("the requested upstream branch origin/etuteuh does not exist");
  });

  it("should set branch to tracking if remote exists", function() {
    var gl = g, gr = g;
    var localRepo = process.cwd();
    var remoteRepo = testUtil.makeRemoteRepo();

    gr.init();
    testUtil.createStandardFileStructure();

    gr.add("1a/filea");
    gr.commit({ m: "first" });

    process.chdir(localRepo);
    gl.init();
    testUtil.createStandardFileStructure();
    gr.add("1a/filea");
    gr.commit({ m: "first" });
    gl.remote("add", "origin", remoteRepo);
    gl.fetch("origin");

    g.branch(undefined, { u: "origin/master" })
    var configFileLines = fs.readFileSync(".gitlet/config", "utf8").split("\n");
    expect(configFileLines[2]).toEqual("[branch \"master\"]");
    expect(configFileLines[3]).toEqual("  remote = origin");
  });

  it("should report branch set to track", function() {
    var gl = g, gr = g;
    var localRepo = process.cwd();
    var remoteRepo = testUtil.makeRemoteRepo();

    gr.init();
    testUtil.createStandardFileStructure();

    gr.add("1a/filea");
    gr.commit({ m: "first" });

    process.chdir(localRepo);
    gl.init();
    testUtil.createStandardFileStructure();
    gr.add("1a/filea");
    gr.commit({ m: "first" });
    gl.remote("add", "origin", remoteRepo);
    gl.fetch("origin");

    expect(g.branch(undefined, { u: "origin/master" }))
      .toEqual("master tracking remote branch origin/master");
  });

  it("should be able to branch on bare repo", function() {
    g.init();
    testUtil.createStandardFileStructure();
    g.add("1a/filea");
    g.commit({ m: "first" });

    process.chdir("../");
    g.clone("repo1", "repo2");
    process.chdir("repo2");
    g.branch("other");
    testUtil.expectFile(".gitlet/refs/heads/other", "17a11ad4");
  });
});
