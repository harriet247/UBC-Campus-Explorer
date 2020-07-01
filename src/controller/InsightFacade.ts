import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    InternalCourseDataset,
    InternalDataset,
    Lecture,
    NotFoundError,
    ResultTooLargeError,
    InternalRoomDataset,
} from "./IInsightFacade";
import CourseManager from "./CourseManager";
import QueryPolice from "../QueryEngine/QueryPolice";
import QueryPerformer from "../QueryEngine/QueryPerformer";
import * as fs from "fs-extra";
import BuildingManager from "./BuildingManager";
import JSZip = require("jszip");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // private readonly courseDataMap: Map<string, InternalCourseDataset>;
    // private readonly buildingDataMap: Map<string, InternalRoomDataset>;
    private readonly dataMap: Map<string, InternalDataset>;
    private readonly CoursePath: string = "./data/courseDiskData.json";
    private readonly RoomPath: string = "./data/roomDiskData.json";
    private readonly diskPath: string = "./data/diskData.json";

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        // this.courseDataMap = new Map<string, InternalCourseDataset>();
        // this.buildingDataMap = new Map<string, InternalRoomDataset>();
        this.dataMap = new Map<string, InternalDataset>();
        // InsightFacade.loadDatasetFromDisk(this.courseDataMap, this.CoursePath);
        // InsightFacade.loadDatasetFromDisk(this.buildingDataMap, this.RoomPath);
        InsightFacade.loadDatasetFromDisk(this.dataMap, this.diskPath);
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (kind === InsightDatasetKind.Courses) {
            return this.addCourses(id, content, kind);
        } else if (kind === InsightDatasetKind.Rooms) {
            return this.addBuildings(id, content);
        } else {
            return Promise.reject(new InsightError("kind is invalid"));
        }
    }

    private addBuildings(id: string, content: string): Promise<string[]> {
        // let buildingManager: BuildingManager = new BuildingManager(this.buildingDataMap);
        let buildingManager: BuildingManager = new BuildingManager(this.dataMap);
        if (buildingManager.checkIdValidity(id)[0] === false) {
            return Promise.reject(
                new InsightError(buildingManager.checkIdValidity(id)[1]),
            );
        }
        if (content === null) {
            return Promise.reject(new InsightError("content is null"));
        }
        return buildingManager.runAddBuildings(id, content)
            .then((res: string[]) => {
                InsightFacade.saveDatasetToDisk(this.dataMap, this.diskPath);
                return Promise.resolve([...this.dataMap.keys()]);
            });
    }

    private addCourses(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let promises: Array<Promise<string>> = [];
        let courseManager: CourseManager = new CourseManager(this.dataMap);
        if (courseManager.checkIdValidity(id)[0] === false) {
            return Promise.reject(
                new InsightError(courseManager.checkIdValidity(id)[1])
            );
        }
        if (content === null) {
            return Promise.reject(new InsightError("content is null"));
        }
        return JSZip.loadAsync(content, {base64: true})
            .then((res: JSZip) => {
                res.forEach((relativePath: string, file: JSZip.JSZipObject) => {
                    promises.push(file.async("text"));
                });
                return Promise.all(promises);
            })
            .then((texts: string[]) => {
                if (courseManager.parseInternalDatasetToDataMap(id, texts, kind)) {
                    InsightFacade.saveDatasetToDisk(this.dataMap, this.diskPath);
                    return Promise.resolve([...this.dataMap.keys()]);
                } else {
                    return Promise.reject(
                        new InsightError(
                            "no valid course section inside OR kind is not " +
                            "InsightDatasetKind.Course"
                        ),
                    );
                }
            })
            .catch((err: any) => {
                return Promise.reject(
                    new InsightError("Unable to load dataset: not a zip file"),
                );
            });
    }

    public removeDataset(id: string): Promise<string> {
        if (id === null) {
            return Promise.reject(new InsightError("id passed in is null"));
        } else if (id.includes("_")) {
            return Promise.reject(new InsightError("id contains underscore"));
        } else if (id.replace(/\s/g, "").length === 0) {
            return Promise.reject(
                new InsightError("id contains only whitespace"),
            );
        } else if (![...this.dataMap.keys()].includes(id)) {
            return Promise.reject(
                new NotFoundError("id is not found in system"),
            );
        }
        if (this.dataMap.delete(id)) {
            // InsightFacade.saveDatasetToDisk(this.courseDataMap, this.CoursePath);
            // InsightFacade.saveDatasetToDisk(this.buildingDataMap, this.RoomPath);
            InsightFacade.saveDatasetToDisk(this.dataMap, this.diskPath);
            return Promise.resolve(id);
        } else {
            return Promise.reject(
                new InsightError("delete failed for unknown reason"),
            );
        }
    }

    public performQuery(query: any): Promise<any[]> {
        let localMap: Map<string, InternalDataset> = new Map<string,
            InternalCourseDataset>();
        localMap = this.dataMap;
        return new Promise(function (resolve, reject) {
            let retFin: any[] = [];
            try {
                let idSet: string[] = [];
                idSet = [...localMap.keys()];
                let validPolice = new QueryPolice();
                validPolice.validateQuery(query);
                validPolice.validateIDList(idSet); // to see if 1)query on 2 id 2)query on non added
                let queryID: string = validPolice.getQueryID();
                if (!idSet.includes(queryID)) {
                    throw new InsightError(
                        "The query ID is not added to the dataset",
                    );
                }
                let queryInternalSet: InternalDataset = localMap.get(queryID);
                let queryKind: InsightDatasetKind = queryInternalSet.kind;
                validPolice.validateKind(query, queryKind);
                let retRaw: any[] = [];
                let performer: QueryPerformer;
                if (queryKind === InsightDatasetKind.Courses) {
                    performer = new QueryPerformer(queryInternalSet as InternalCourseDataset, queryKind);
                } else if (queryKind === InsightDatasetKind.Rooms) {
                    performer = new QueryPerformer(queryInternalSet as InternalRoomDataset, queryKind);
                }
                retRaw = performer.traversalWhole(query);
                retFin = performer.sortRetRaw(retRaw, query);
            } catch (err) {
                if (err instanceof InsightError) {
                    reject(err);
                }
                if (err instanceof ResultTooLargeError) {
                    reject(err);
                } else {
                    reject(new InsightError());
                }
            }
            resolve(retFin);
        });
        return Promise.resolve([]);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let res: InsightDataset[] = [];
        // this.listDatasetHelper(res, this.courseDataMap, InsightDatasetKind.Courses);
        // this.listDatasetHelper(res, this.buildingDataMap, InsightDatasetKind.Rooms);
        this.listDatasetHelper(res, this.dataMap);
        return Promise.resolve(res);
    }

    private listDatasetHelper(res: InsightDataset[], dataMap: Map<string, any>) {
        for (let internalDataset of dataMap.values()) {
            let oneInsightDataset: InsightDataset = {
                id: "",
                kind: internalDataset.kind,
                numRows: 0,
            };
            oneInsightDataset.id = internalDataset.id;
            oneInsightDataset.kind = internalDataset.kind;
            // oneInsightDataset.numRows = internalDataset.kind === InsightDatasetKind.Courses ?
            // internalDataset.numRows :
            //     internalDataset.bldgList.length;
            if (internalDataset.kind === InsightDatasetKind.Courses) {
                oneInsightDataset.numRows = internalDataset.numRows;
            } else {
                let rows: number = 0;
                for (let building of internalDataset.bldgList) {
                    // console.log("Building Name: " + building.shortName + " "
                    // + "numberRooms: " + building.roomList.length);
                    rows += building.roomList.length;
                }
                oneInsightDataset.numRows = rows;
            }
            res.push(oneInsightDataset);
        }
    }

    private static saveDatasetToDisk(dataMap: Map<string, any>, path: string) {
        let dataMapObj: { [key: string]: any } = {};
        for (const key of dataMap.keys()) {
            dataMapObj[key] = dataMap.get(key);
        }
        fs.writeFileSync(path, JSON.stringify(dataMapObj));
    }

    private static loadDatasetFromDisk(dataMap: Map<string, any>, path: string) {
        let filename: string = path;
        let tempObj: { [key: string]: any } = {};
        let data: string;
        try {
            data = fs.readFileSync(filename).toString();
            if (data !== "") {
                tempObj = JSON.parse(data);
                for (const key of Object.keys(tempObj)) {
                    dataMap.set(key, tempObj[key]);
                }
            }
        } catch (e) {
            Log.trace("cannot locate data on disk");
        }
    }
}
