"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const CourseManager_1 = require("./CourseManager");
const QueryPolice_1 = require("../QueryEngine/QueryPolice");
const QueryPerformer_1 = require("../QueryEngine/QueryPerformer");
const fs = require("fs-extra");
const BuildingManager_1 = require("./BuildingManager");
const JSZip = require("jszip");
class InsightFacade {
    constructor() {
        this.CoursePath = "./data/courseDiskData.json";
        this.RoomPath = "./data/roomDiskData.json";
        this.diskPath = "./data/diskData.json";
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.dataMap = new Map();
        InsightFacade.loadDatasetFromDisk(this.dataMap, this.diskPath);
    }
    addDataset(id, content, kind) {
        if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
            return this.addCourses(id, content, kind);
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            return this.addBuildings(id, content);
        }
        else {
            return Promise.reject(new IInsightFacade_1.InsightError("kind is invalid"));
        }
    }
    addBuildings(id, content) {
        let buildingManager = new BuildingManager_1.default(this.dataMap);
        if (buildingManager.checkIdValidity(id)[0] === false) {
            return Promise.reject(new IInsightFacade_1.InsightError(buildingManager.checkIdValidity(id)[1]));
        }
        if (content === null) {
            return Promise.reject(new IInsightFacade_1.InsightError("content is null"));
        }
        return buildingManager.runAddBuildings(id, content)
            .then((res) => {
            InsightFacade.saveDatasetToDisk(this.dataMap, this.diskPath);
            return Promise.resolve([...this.dataMap.keys()]);
        });
    }
    addCourses(id, content, kind) {
        let promises = [];
        let courseManager = new CourseManager_1.default(this.dataMap);
        if (courseManager.checkIdValidity(id)[0] === false) {
            return Promise.reject(new IInsightFacade_1.InsightError(courseManager.checkIdValidity(id)[1]));
        }
        if (content === null) {
            return Promise.reject(new IInsightFacade_1.InsightError("content is null"));
        }
        return JSZip.loadAsync(content, { base64: true })
            .then((res) => {
            res.forEach((relativePath, file) => {
                promises.push(file.async("text"));
            });
            return Promise.all(promises);
        })
            .then((texts) => {
            if (courseManager.parseInternalDatasetToDataMap(id, texts, kind)) {
                InsightFacade.saveDatasetToDisk(this.dataMap, this.diskPath);
                return Promise.resolve([...this.dataMap.keys()]);
            }
            else {
                return Promise.reject(new IInsightFacade_1.InsightError("no valid course section inside OR kind is not " +
                    "InsightDatasetKind.Course"));
            }
        })
            .catch((err) => {
            return Promise.reject(new IInsightFacade_1.InsightError("Unable to load dataset: not a zip file"));
        });
    }
    removeDataset(id) {
        if (id === null) {
            return Promise.reject(new IInsightFacade_1.InsightError("id passed in is null"));
        }
        else if (id.includes("_")) {
            return Promise.reject(new IInsightFacade_1.InsightError("id contains underscore"));
        }
        else if (id.replace(/\s/g, "").length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("id contains only whitespace"));
        }
        else if (![...this.dataMap.keys()].includes(id)) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("id is not found in system"));
        }
        if (this.dataMap.delete(id)) {
            InsightFacade.saveDatasetToDisk(this.dataMap, this.diskPath);
            return Promise.resolve(id);
        }
        else {
            return Promise.reject(new IInsightFacade_1.InsightError("delete failed for unknown reason"));
        }
    }
    performQuery(query) {
        let localMap = new Map();
        localMap = this.dataMap;
        return new Promise(function (resolve, reject) {
            let retFin = [];
            try {
                let idSet = [];
                idSet = [...localMap.keys()];
                let validPolice = new QueryPolice_1.default();
                validPolice.validateQuery(query);
                validPolice.validateIDList(idSet);
                let queryID = validPolice.getQueryID();
                if (!idSet.includes(queryID)) {
                    throw new IInsightFacade_1.InsightError("The query ID is not added to the dataset");
                }
                let queryInternalSet = localMap.get(queryID);
                let queryKind = queryInternalSet.kind;
                validPolice.validateKind(query, queryKind);
                let retRaw = [];
                let performer;
                if (queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
                    performer = new QueryPerformer_1.default(queryInternalSet, queryKind);
                }
                else if (queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                    performer = new QueryPerformer_1.default(queryInternalSet, queryKind);
                }
                retRaw = performer.traversalWhole(query);
                retFin = performer.sortRetRaw(retRaw, query);
            }
            catch (err) {
                if (err instanceof IInsightFacade_1.InsightError) {
                    reject(err);
                }
                if (err instanceof IInsightFacade_1.ResultTooLargeError) {
                    reject(err);
                }
                else {
                    reject(new IInsightFacade_1.InsightError());
                }
            }
            resolve(retFin);
        });
        return Promise.resolve([]);
    }
    listDatasets() {
        let res = [];
        this.listDatasetHelper(res, this.dataMap);
        return Promise.resolve(res);
    }
    listDatasetHelper(res, dataMap) {
        for (let internalDataset of dataMap.values()) {
            let oneInsightDataset = {
                id: "",
                kind: internalDataset.kind,
                numRows: 0,
            };
            oneInsightDataset.id = internalDataset.id;
            oneInsightDataset.kind = internalDataset.kind;
            if (internalDataset.kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                oneInsightDataset.numRows = internalDataset.numRows;
            }
            else {
                let rows = 0;
                for (let building of internalDataset.bldgList) {
                    rows += building.roomList.length;
                }
                oneInsightDataset.numRows = rows;
            }
            res.push(oneInsightDataset);
        }
    }
    static saveDatasetToDisk(dataMap, path) {
        let dataMapObj = {};
        for (const key of dataMap.keys()) {
            dataMapObj[key] = dataMap.get(key);
        }
        fs.writeFileSync(path, JSON.stringify(dataMapObj));
    }
    static loadDatasetFromDisk(dataMap, path) {
        let filename = path;
        let tempObj = {};
        let data;
        try {
            data = fs.readFileSync(filename).toString();
            if (data !== "") {
                tempObj = JSON.parse(data);
                for (const key of Object.keys(tempObj)) {
                    dataMap.set(key, tempObj[key]);
                }
            }
        }
        catch (e) {
            Util_1.default.trace("cannot locate data on disk");
        }
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map