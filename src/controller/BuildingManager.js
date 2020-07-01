"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const DatasetManager_1 = require("./DatasetManager");
const JSZip = require("jszip");
const parse5 = require("parse5");
const NodeManager_1 = require("./NodeManager");
const IndexBuildingManager_1 = require("./IndexBuildingManager");
class BuildingManager extends DatasetManager_1.default {
    constructor(roomDataMap) {
        super();
        Util_1.default.trace("BuildingManager Class ::init()");
        this.roomDataMap = roomDataMap;
        this.buildingList = [];
        this.nodeManager = new NodeManager_1.default();
        this.indexBuildingManager = new IndexBuildingManager_1.default();
        this.indexBuildingLists = [];
        this.internalRoomDataset = {
            id: "",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            bldgList: [],
        };
    }
    checkIdValidity(id) {
        return super.checkIdValidity(id, this.roomDataMap);
    }
    runAddBuildings(id, content) {
        return JSZip.loadAsync(content, { base64: true })
            .catch((err) => {
            return Promise.reject(new IInsightFacade_1.InsightError("not a valid zip file"));
        })
            .then((res) => {
            if (!Object.keys(res.files).includes("rooms/")) {
                return Promise.reject(new IInsightFacade_1.InsightError("does not have base path 'rooms/'"));
            }
            else {
                return res.file("rooms/index.htm").async("text");
            }
        })
            .then((text) => {
            this.setIndexBuildingsList(text);
            return this.indexBuildingManager.setBuildingList(this.indexBuildingLists, content);
        })
            .then((buildingList) => {
            this.buildingList = buildingList;
            if (this.buildingList.length === 0) {
                return Promise.reject(new IInsightFacade_1.InsightError("there is no valid building OR no Internet"));
            }
            return this.injectRoomDataMap(id, this.buildingList, this.roomDataMap);
        })
            .catch((err) => {
            return Promise.reject(err);
        });
    }
    setIndexBuildingsList(text) {
        let document = null;
        let iTables = [];
        document = parse5.parse(text);
        iTables = this.parseIndexFile(document);
        this.createIBldgList(iTables);
    }
    parseIndexFile(document) {
        let tables = [];
        tables = this.nodeManager.findTableNodes(document);
        return tables;
    }
    createIBldgList(iTables) {
        for (let iTable of iTables) {
            let iBldgList = this.convertITableToIBldgList(iTable);
            if (iBldgList.length > 0) {
                this.indexBuildingLists.push(iBldgList);
            }
        }
    }
    convertITableToIBldgList(iTable) {
        let headers = this.nodeManager.findTableHeaders(iTable);
        let iTableBody = this.nodeManager.findTableBody(iTable);
        if (headers.length === 0 || iTableBody === null) {
            return [];
        }
        return this.buildIBuildingList(headers, iTableBody);
    }
    buildIBuildingList(headers, tableBody) {
        let rows = [];
        let indexBuildings = [];
        for (let node of tableBody.childNodes) {
            if (node.hasOwnProperty("nodeName") && node.nodeName === "tr") {
                let oneRowData = this.getITableOneRowData(node);
                rows.push(oneRowData);
            }
        }
        for (let row of rows) {
            let indexBuilding = this.createIndexBuildingFromRow(row, headers);
            if (BuildingManager.validateIndexBuilding(indexBuilding)) {
                indexBuildings.push(indexBuilding);
            }
        }
        return indexBuildings;
    }
    createIndexBuildingFromRow(row, headers) {
        let building = {
            fullName: "",
            shortName: "",
            address: "",
            ref: "rooms/",
        };
        let counter = 0;
        for (let i of headers.keys()) {
            if (this.putDataInIndexBuilding(row[counter], headers[i], building)) {
                counter++;
            }
        }
        return building;
    }
    putDataInIndexBuilding(cell, header, building) {
        switch (true) {
            case header.includes("code"):
                building.shortName = cell;
                break;
            case header.includes("title"):
                building.fullName = cell;
                break;
            case header.includes("address"):
                building.address = cell;
                break;
            case header.includes("nothing"):
                building.ref = building.ref.concat(cell.substring(2));
                break;
            default:
                return false;
        }
        return true;
    }
    getITableOneRowData(rowNode) {
        let data = [];
        for (let cell of rowNode.childNodes) {
            if (cell.nodeName === "td") {
                let className = "";
                for (let attr of cell.attrs) {
                    if (attr.name === "class") {
                        className = attr.value;
                    }
                }
                switch (true) {
                    case className.includes("code"):
                        data.push(this.nodeManager.getBuildingCode(cell));
                        break;
                    case className.includes("title"):
                        data.push(this.nodeManager.getBuildingTitle(cell));
                        break;
                    case className.includes("address"):
                        data.push(this.nodeManager.getBuildingAddress(cell));
                        break;
                    case className.includes("nothing"):
                        data.push(this.nodeManager.getBuildingRef(cell));
                        break;
                    default:
                        break;
                }
            }
        }
        return data;
    }
    static validateIndexBuilding(indexBuilding) {
        return !(indexBuilding.fullName === "" ||
            indexBuilding.shortName === "" ||
            indexBuilding.address === "" ||
            indexBuilding.ref === "rooms/");
    }
    injectRoomDataMap(id, buildingList, roomDataMap) {
        let internalRoomDataset = {
            id: id,
            kind: IInsightFacade_1.InsightDatasetKind.Rooms,
            bldgList: buildingList
        };
        roomDataMap.set(id, internalRoomDataset);
        return [...roomDataMap.keys()];
    }
}
exports.default = BuildingManager;
//# sourceMappingURL=BuildingManager.js.map