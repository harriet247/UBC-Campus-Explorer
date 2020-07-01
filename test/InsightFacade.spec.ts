import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
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
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Helper Method to test against one Dataset: "courses.zip"
    function verifyOneDataset(result: InsightDataset[], id: string) {
        expect(result.length).to.equal(1);
        expect(result[0].id).to.deep.equal(id);
        expect(result[0].kind).to.deep.equal(InsightDatasetKind.Courses);
        expect(result[0].numRows).to.equal(64612);
    }

    // Helper Method
    function rejectInvalidDataSet(id: string) {
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "null", "Should have rejected");
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    }


    function checkPassOneDataset(id: string, expected: string[]) {

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                verifyOneDataset(result, id);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    }

    // This is a unit test. You should create more like this!
    // Base

    /*
     * Tests on CourseManager()
     */
    it("Should add a room", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                // console.log(insightFacade.buildingDataMap);
                expect(result).to.deep.equal(expected);
            });
        // .catch((err:any)=>{
        //     // expect.fail(err, expected, err.toString());
        //     expect(err).to.be.an.instanceOf(InsightError);
        // });
    });

    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        checkPassOneDataset(id, expected);
    });

    it("Should add a partial valid dataset which contains pdf and valid data", function () {
        const id: string = "containsValidAndPDF";
        const expected: string[] = [id];
        return checkPassOneDataset(id, expected);
    });

    it("Should add two valid dataset", function () {
        const id1: string = "courses";
        const id2: string = "coursesA2";
        const expected: string[] = [id1, id2];
        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(2);
                expect(result[0].id).to.deep.equal(id1);
                expect(result[0].kind).to.deep.equal(
                    InsightDatasetKind.Courses,
                );
                expect(result[0].numRows).to.equal(64612);
                expect(result[1].id).to.deep.equal(id2);
                expect(result[1].kind).to.deep.equal(
                    InsightDatasetKind.Courses,
                );
                expect(result[1].numRows).to.equal(64612);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should reject id with underscore", function () {
        const id: string = "courses_A3";
        return rejectInvalidDataSet(id);
    });

    it("Should reject null id", function () {
        const id: string = null;
        return rejectInvalidDataSet(id);
    });

    it("Should reject null contents", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, null, InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "null", "Should have rejected");
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    });

    it("Should reject null kind", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets["courses"], null)
            .then((result: string[]) => {
                expect.fail(result, "null", "Should have rejected");
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    });

    it("Should reject id with ONLY white space", function () {
        const id: string = " ";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "null", "Should have rejected");
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    });

    it("Should reject duplicate id and not save", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
                return insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result: string[]) => {
                expect.fail(result, "null", "Should have rejected");
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                verifyOneDataset(result, id);
            });
    });

    // it("Should reject Kind.Rooms", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     return insightFacade
    //         .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
    //         .then((result: string[]) => {
    //             expect.fail(result, "null", "Should have rejected");
    //             return insightFacade.listDatasets();
    //         })
    //         .catch((err: any) => {
    //             expect(err).to.be.an.instanceOf(InsightError);
    //             return insightFacade.listDatasets();
    //         })
    //         .then((result: InsightDataset[]) => {
    //             expect(result.length).to.equal(0);
    //         });
    // });

    it("Should reject invalid Kind", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], "silly" as InsightDatasetKind)
            .then((result: string[]) => {
                expect.fail(result, "null", "Should have rejected");
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    });

    it("Should reject not zip file", function () {
        const id: string = "coursesNotZip";
        return rejectInvalidDataSet(id);
    });

    it("Data not in Json format", function () {
        const id: string = "coursesNotJson";
        return rejectInvalidDataSet(id);
    });

    it("Data doesn't have valid course section", function () {
        const id: string = "coursesNoSection";
        return rejectInvalidDataSet(id);
    });

    /*
     * Tests on removeDataset()
     */
    it("Should remove a dataSet", function () {
        const id: string = "smallSetCPSC";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.removeDataset(id);
            })
            .then((result: string) => {
                expect(result).to.deep.equal(id);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            })
            .catch((err: any) => {
                expect.fail(err, id, "Should not have rejected");
            });
    });

    it("Should remove two dataSet", function () {
        const id1: string = "courses";
        const id2: string = "coursesA2";
        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result: string[]) => {
                return insightFacade.removeDataset(id1);
            })
            .then((result: string) => {
                expect(result).to.deep.equal(id1);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(1);
                return insightFacade.removeDataset(id2);
            })
            .then((result: string) => {
                expect(result).to.deep.equal(id2);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            })
            .catch((err: any) => {
                expect.fail(err, id1 + " " + id2, "Should not have rejected");
            });
    });

    it("When I remove a dataSet that is not added yet, it should throw NotFoundError", function () {
        const id: string = "courses";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, "null", "it should throw NotFoundError");
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(NotFoundError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    });

    it("When I remove a dataSet with an id that contains an underscore, it should throw InsightError", function () {
        const id: string = "courses_B4";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(
                    result,
                    "null",
                    "it should throw InsightError because of underscore",
                );
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    });

    it("When I remove a dataSet with an id that contains only whitespace, it should throw InsightError", function () {
        const id: string = "   ";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(
                    result,
                    "null",
                    "it should throw InsightError because of whitespace",
                );
                return insightFacade.listDatasets();
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result.length).to.equal(0);
            });
    });


    it("test listDataset() for rooms and courses", function () {
        const id1: string = "courses";
        const id2: string = "rooms";
        const id3: string = "coursesA2";
        const expected: string[] = [id1, id2, id3];
        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
            })
            .then((result: string[]) => {
                return insightFacade.addDataset(id3, datasets[id3], InsightDatasetKind.Courses);
            })
            .then((result: string[]) => {
                // console.log(result);
                expect(result).to.deep.equal(expected);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                // console.log(result);
                expect(result.length).to.equal(3);
                expect(result[0].id).to.deep.equal(id1);
                expect(result[0].kind).to.deep.equal(InsightDatasetKind.Courses);
                expect(result[0].numRows).to.equal(64612);
                expect(result[1].id).to.deep.equal(id2);
                expect(result[1].kind).to.deep.equal(InsightDatasetKind.Rooms);
                expect(result[1].numRows).to.equal(364);
                expect(result[2].id).to.deep.equal(id3);
                expect(result[2].kind).to.deep.equal(InsightDatasetKind.Courses);
                expect(result[2].numRows).to.equal(64612);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        courses2: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        smallSet: {
            path: "./test/data/smallSetCPSC.zip",
            kind: InsightDatasetKind.Courses,
        },
        rooms: {
            path: "./test/data/rooms.zip",
            kind: InsightDatasetKind.Rooms,
        },
        smallRooms: {
            path: "./test/data/smallRooms_loc.zip",
            kind: InsightDatasetKind.Rooms,
        }
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        const cacheDir = __dirname + "/../data";
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            // return Promise.resolve("HACK TO LET QUERIES RUN");
            expect.fail("Failed to add dataSets");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });


    // Dynamically create and run a test for each query in testQueries.
    // Creates an extra "test" called "Should run test queries" as a byproduct.
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    const resultChecker = TestUtil.getQueryChecker(test, done);
                    insightFacade.performQuery(test.query)
                        .then(resultChecker)
                        .catch(resultChecker);
                });
            }
        });
    });
});
