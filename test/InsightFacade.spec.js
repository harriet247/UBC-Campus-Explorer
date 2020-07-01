"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs-extra");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
describe("InsightFacade Add/Remove Dataset", function () {
    const datasetsToLoad = {
        courses: "./test/data/courses.zip",
        coursesA2: "./test/data/coursesA2.zip",
        courses_A3: "./test/data/courses.zip",
        coursesNotZip: "./test/data/coursesNotZip.pdf",
        coursesNotJson: "./test/data/coursesNotJson.zip",
        coursesNoSection: "./test/data/coursesNoSection.zip",
        smallSet: "./test/data/smallSet.zip",
        smallSetCPSC: "./test/data/smallSetCPSC.zip",
        containsValidAndPDF: "./test/data/containsValidandPDF.zip",
        rooms: "./test/data/rooms.zip",
        smallRooms: "./test/data/smallRooms.zip",
        smallRoomsLoc: "./test/data/smallRooms_loc.zip",
        noRoomsPath: "./test/data/noRoomsPath.zip",
        roomsNoHTMLIndex: "./test/data/roomsNoHTMLIndex.zip",
        roomsThree: "./test/data/roomsThreeValidTwoInvalid.zip"
    };
    let datasets = {};
    let insightFacade;
    const cacheDir = __dirname + "/../data";
    before(function () {
        Util_1.default.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    function verifyOneDataset(result, id) {
        chai_1.expect(result.length).to.equal(1);
        chai_1.expect(result[0].id).to.deep.equal(id);
        chai_1.expect(result[0].kind).to.deep.equal(IInsightFacade_1.InsightDatasetKind.Courses);
        chai_1.expect(result[0].numRows).to.equal(64612);
    }
    function rejectInvalidDataSet(id) {
        const expected = [id];
        return insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            chai_1.expect.fail(result, "null", "Should have rejected");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    }
    function checkPassOneDataset(id, expected) {
        return insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            chai_1.expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            verifyOneDataset(result, id);
        })
            .catch((err) => {
            chai_1.expect.fail(err, expected, "Should not have rejected");
        });
    }
    it("Should add a room", function () {
        const id = "rooms";
        const expected = [id];
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms)
            .then((result) => {
            chai_1.expect(result).to.deep.equal(expected);
        });
    });
    it("Should add a valid dataset", function () {
        const id = "courses";
        const expected = [id];
        checkPassOneDataset(id, expected);
    });
    it("Should add a partial valid dataset which contains pdf and valid data", function () {
        const id = "containsValidAndPDF";
        const expected = [id];
        return checkPassOneDataset(id, expected);
    });
    it("Should add two valid dataset", function () {
        const id1 = "courses";
        const id2 = "coursesA2";
        const expected = [id1, id2];
        return insightFacade
            .addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            return insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        })
            .then((result) => {
            chai_1.expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(2);
            chai_1.expect(result[0].id).to.deep.equal(id1);
            chai_1.expect(result[0].kind).to.deep.equal(IInsightFacade_1.InsightDatasetKind.Courses);
            chai_1.expect(result[0].numRows).to.equal(64612);
            chai_1.expect(result[1].id).to.deep.equal(id2);
            chai_1.expect(result[1].kind).to.deep.equal(IInsightFacade_1.InsightDatasetKind.Courses);
            chai_1.expect(result[1].numRows).to.equal(64612);
        })
            .catch((err) => {
            chai_1.expect.fail(err, expected, "Should not have rejected");
        });
    });
    it("Should reject id with underscore", function () {
        const id = "courses_A3";
        return rejectInvalidDataSet(id);
    });
    it("Should reject null id", function () {
        const id = null;
        return rejectInvalidDataSet(id);
    });
    it("Should reject null contents", function () {
        const id = "courses";
        const expected = [id];
        return insightFacade
            .addDataset(id, null, IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            chai_1.expect.fail(result, "null", "Should have rejected");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    });
    it("Should reject null kind", function () {
        const id = "courses";
        const expected = [id];
        return insightFacade
            .addDataset(id, datasets["courses"], null)
            .then((result) => {
            chai_1.expect.fail(result, "null", "Should have rejected");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    });
    it("Should reject id with ONLY white space", function () {
        const id = " ";
        const expected = [id];
        return insightFacade
            .addDataset(id, datasets["courses"], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            chai_1.expect.fail(result, "null", "Should have rejected");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    });
    it("Should reject duplicate id and not save", function () {
        const id = "courses";
        const expected = [id];
        return insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            chai_1.expect(result).to.deep.equal(expected);
            return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        })
            .then((result) => {
            chai_1.expect.fail(result, "null", "Should have rejected");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            verifyOneDataset(result, id);
        });
    });
    it("Should reject invalid Kind", function () {
        const id = "courses";
        const expected = [id];
        return insightFacade
            .addDataset(id, datasets[id], "silly")
            .then((result) => {
            chai_1.expect.fail(result, "null", "Should have rejected");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    });
    it("Should reject not zip file", function () {
        const id = "coursesNotZip";
        return rejectInvalidDataSet(id);
    });
    it("Data not in Json format", function () {
        const id = "coursesNotJson";
        return rejectInvalidDataSet(id);
    });
    it("Data doesn't have valid course section", function () {
        const id = "coursesNoSection";
        return rejectInvalidDataSet(id);
    });
    it("Should remove a dataSet", function () {
        const id = "smallSetCPSC";
        return insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            return insightFacade.removeDataset(id);
        })
            .then((result) => {
            chai_1.expect(result).to.deep.equal(id);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        })
            .catch((err) => {
            chai_1.expect.fail(err, id, "Should not have rejected");
        });
    });
    it("Should remove two dataSet", function () {
        const id1 = "courses";
        const id2 = "coursesA2";
        return insightFacade
            .addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            return insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        })
            .then((result) => {
            return insightFacade.removeDataset(id1);
        })
            .then((result) => {
            chai_1.expect(result).to.deep.equal(id1);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(1);
            return insightFacade.removeDataset(id2);
        })
            .then((result) => {
            chai_1.expect(result).to.deep.equal(id2);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        })
            .catch((err) => {
            chai_1.expect.fail(err, id1 + " " + id2, "Should not have rejected");
        });
    });
    it("When I remove a dataSet that is not added yet, it should throw NotFoundError", function () {
        const id = "courses";
        return insightFacade
            .removeDataset(id)
            .then((result) => {
            chai_1.expect.fail(result, "null", "it should throw NotFoundError");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.NotFoundError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    });
    it("When I remove a dataSet with an id that contains an underscore, it should throw InsightError", function () {
        const id = "courses_B4";
        return insightFacade
            .removeDataset(id)
            .then((result) => {
            chai_1.expect.fail(result, "null", "it should throw InsightError because of underscore");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    });
    it("When I remove a dataSet with an id that contains only whitespace, it should throw InsightError", function () {
        const id = "   ";
        return insightFacade
            .removeDataset(id)
            .then((result) => {
            chai_1.expect.fail(result, "null", "it should throw InsightError because of whitespace");
            return insightFacade.listDatasets();
        })
            .catch((err) => {
            chai_1.expect(err).to.be.an.instanceOf(IInsightFacade_1.InsightError);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(0);
        });
    });
    it("test listDataset() for rooms and courses", function () {
        const id1 = "courses";
        const id2 = "rooms";
        const id3 = "coursesA2";
        const expected = [id1, id2, id3];
        return insightFacade
            .addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            return insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Rooms);
        })
            .then((result) => {
            return insightFacade.addDataset(id3, datasets[id3], IInsightFacade_1.InsightDatasetKind.Courses);
        })
            .then((result) => {
            chai_1.expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        })
            .then((result) => {
            chai_1.expect(result.length).to.equal(3);
            chai_1.expect(result[0].id).to.deep.equal(id1);
            chai_1.expect(result[0].kind).to.deep.equal(IInsightFacade_1.InsightDatasetKind.Courses);
            chai_1.expect(result[0].numRows).to.equal(64612);
            chai_1.expect(result[1].id).to.deep.equal(id2);
            chai_1.expect(result[1].kind).to.deep.equal(IInsightFacade_1.InsightDatasetKind.Rooms);
            chai_1.expect(result[1].numRows).to.equal(364);
            chai_1.expect(result[2].id).to.deep.equal(id3);
            chai_1.expect(result[2].kind).to.deep.equal(IInsightFacade_1.InsightDatasetKind.Courses);
            chai_1.expect(result[2].numRows).to.equal(64612);
        })
            .catch((err) => {
            chai_1.expect.fail(err, expected, "Should not have rejected");
        });
    });
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: {
            path: "./test/data/courses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        courses2: {
            path: "./test/data/courses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        smallSet: {
            path: "./test/data/smallSetCPSC.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        rooms: {
            path: "./test/data/rooms.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Rooms,
        },
        smallRooms: {
            path: "./test/data/smallRooms_loc.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Rooms,
        }
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        Util_1.default.test(`Before: ${this.test.parent.title}`);
        try {
            testQueries = TestUtil_1.default.readTestQueries();
        }
        catch (err) {
            chai_1.expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }
        const loadDatasetPromises = [];
        insightFacade = new InsightFacade_1.default();
        const cacheDir = __dirname + "/../data";
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            chai_1.expect.fail("Failed to add dataSets");
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    const resultChecker = TestUtil_1.default.getQueryChecker(test, done);
                    insightFacade.performQuery(test.query)
                        .then(resultChecker)
                        .catch(resultChecker);
                });
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map