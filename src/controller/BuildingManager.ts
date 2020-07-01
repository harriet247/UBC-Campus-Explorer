import Log from "../Util";
import {
    Building, IndexBuilding,
    InsightDatasetKind,
    InsightError,
    InternalCourseDataset, InternalDataset,
    InternalRoomDataset,
    Lecture, Room
} from "./IInsightFacade";
import DatasetManager from "./DatasetManager";
import JSZip = require("jszip");
import parse5 = require("parse5");
import NodeManager from "./NodeManager";
import IndexBuildingManager from "./IndexBuildingManager";

export default class BuildingManager extends DatasetManager {
    private readonly roomDataMap: Map<string, InternalDataset>;
    private readonly internalRoomDataset: InternalRoomDataset;
    private buildingList: Building[];
    private indexBuildingLists: IndexBuilding[][];
    private nodeManager: NodeManager;
    private indexBuildingManager: IndexBuildingManager;

    constructor(roomDataMap: Map<string, InternalDataset>) {
        super();
        Log.trace("BuildingManager Class ::init()");
        this.roomDataMap = roomDataMap;
        this.buildingList = [];
        this.nodeManager = new NodeManager();
        this.indexBuildingManager = new IndexBuildingManager();
        this.indexBuildingLists = [];
        this.internalRoomDataset = {
            id: "",
            kind: InsightDatasetKind.Courses,
            bldgList: [],
        };
    }

    public checkIdValidity(id: string): [boolean, string] {
        return super.checkIdValidity(id, this.roomDataMap);
    }

    public runAddBuildings(id: string, content: string): Promise<string[]> {
        return JSZip.loadAsync(content, {base64: true})
            .catch((err: any) => {
                    return Promise.reject(new InsightError("not a valid zip file"));
                }
            )
            .then((res: JSZip) => {
                if (!Object.keys(res.files).includes("rooms/")) {
                    return Promise.reject(new InsightError("does not have base path 'rooms/'"));
                } else {
                    return res.file("rooms/index.htm").async("text");
                }
            })
            .then((text: string) => {
                this.setIndexBuildingsList(text);
                // console.log(this.indexBuildingLists);
                return this.indexBuildingManager.setBuildingList(this.indexBuildingLists, content);
            })
            .then((buildingList: Building[]) => {
                // console.log(buildingList);
                this.buildingList = buildingList;
                if (this.buildingList.length === 0) {
                    return Promise.reject(new InsightError("there is no valid building OR no Internet"));
                }
                return this.injectRoomDataMap(id, this.buildingList, this.roomDataMap);
            })
            .catch((err: any) => {
                return Promise.reject(err);
            });
        // .catch((err: any) => {
        //     if (err === "Bad API Request") {
        //         console.log("caught the API reject");
        //     }
        //     return err;
        // });
    }

    private setIndexBuildingsList(text: string) {
        let document = null;
        let iTables = [];
        document = parse5.parse(text);
        iTables = this.parseIndexFile(document);

        this.createIBldgList(iTables);
    }

    private parseIndexFile(document: object): any[] {
        let tables: any[] = [];
        tables = this.nodeManager.findTableNodes(document);
        return tables;
    }

    private createIBldgList(iTables: any[]) {
        for (let iTable of iTables) {
            let iBldgList: IndexBuilding[] = this.convertITableToIBldgList(iTable);
            if (iBldgList.length > 0) {
                this.indexBuildingLists.push(iBldgList);
            }
        }
    }

    private convertITableToIBldgList(iTable: any): IndexBuilding[] {
        let headers: string[] = this.nodeManager.findTableHeaders(iTable);
        let iTableBody: any = this.nodeManager.findTableBody(iTable);
        if (headers.length === 0 || iTableBody === null) {
            return [];
        }
        return this.buildIBuildingList(headers, iTableBody);
    }

    private buildIBuildingList(headers: string[], tableBody: any): IndexBuilding[] {
        let rows: string[][] = [];
        let indexBuildings: IndexBuilding[] = [];
        for (let node of tableBody.childNodes) {
            if (node.hasOwnProperty("nodeName") && node.nodeName === "tr") {
                let oneRowData: string[] = this.getITableOneRowData(node);
                rows.push(oneRowData);
            }
        }
        for (let row of rows) {
            let indexBuilding: IndexBuilding = this.createIndexBuildingFromRow(row, headers);
            if (BuildingManager.validateIndexBuilding(indexBuilding)) {
                indexBuildings.push(indexBuilding);
            }

        }
        return indexBuildings;
    }


    private createIndexBuildingFromRow(row: string[], headers: string[]) {
        let building: IndexBuilding = {
            fullName: "",
            shortName: "",
            address: "",
            ref: "rooms/",
        };
        let counter: number = 0;
        for (let i of headers.keys()) {
            if (this.putDataInIndexBuilding(row[counter], headers[i], building)) {
                counter++;
            }
        }
        return building;

    }

    private putDataInIndexBuilding(cell: string, header: string, building: IndexBuilding): boolean {
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

    private getITableOneRowData(rowNode: any): string[] {
        let data: string[] = [];
        for (let cell of rowNode.childNodes) {
            if (cell.nodeName === "td") {
                let className: string = "";
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

    private static validateIndexBuilding(indexBuilding: IndexBuilding): boolean {
        return !(indexBuilding.fullName === "" ||
            indexBuilding.shortName === "" ||
            indexBuilding.address === "" ||
            indexBuilding.ref === "rooms/");
    }

    private injectRoomDataMap(id: string, buildingList: Building[],
                              roomDataMap: Map<string, InternalDataset>): string[] {
        let internalRoomDataset: InternalRoomDataset = {
            id: id,
            kind: InsightDatasetKind.Rooms,
            bldgList: buildingList
        };
        roomDataMap.set(id, internalRoomDataset);
        // for(let bldg of internalRoomDataset.bldgList){
        //      console.log(bldg.roomList);
        // }
        // console.log("The length of the bldgList is: " + internalRoomDataset.bldgList.length);
        // console.log(internalRoomDataset.bldgList);

        return [...roomDataMap.keys()];
    }
}
