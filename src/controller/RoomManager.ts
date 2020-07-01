import {IndexBuilding, Room} from "./IInsightFacade";
import JSZip = require("jszip");
import parse5 = require("parse5");
import NodeManager from "./NodeManager";

export default class RoomManager {
    private nodeManager: NodeManager;
    private roomLists: Room[][];
    private roomList: Room[];
    private indexBuilding: IndexBuilding;

    constructor() {
        this.nodeManager = new NodeManager();
        this.roomLists = [];
        this.roomList = [];
    }

    public getRoomList(indexBuilding: IndexBuilding, content: string): Promise<Room[]> {
        return JSZip.loadAsync(content, {base64: true})
            .then((res: JSZip) => {
                return res.file(indexBuilding.ref).async("text");
            })
            .then((text: string) => {
                this.indexBuilding = indexBuilding;
                this.createRoomLists(text);
                for (let roomList of this.roomLists) {
                    if (roomList.length > 0) {
                        this.roomList = roomList;
                        return Promise.resolve(this.roomList);
                    }
                }
                return Promise.resolve([]);
            });
    }

    // refactor
    private createRoomLists(text: string) {
        let document = null;
        let tables = [];
        document = parse5.parse(text);
        tables = this.parseDocumentTables(document);
        // console.log("each room has tables: "+ tables);
        // console.log(tables);
        this.createRoomListsHelper(tables);
    }

    private parseDocumentTables(document: object): any[] {
        return this.nodeManager.findTableNodes(document);
    }

    private createRoomListsHelper(tables: any[]) {
        for (let table of tables) {
            let roomList: Room[] = this.convertTableToList(table);
            if (roomList.length > 0) {
                this.roomLists.push(roomList);
            }
        }
        // console.log(this.indexBuilding.shortName+" has roomLists"+ this.roomLists);
    }

    private convertTableToList(table: any) {
        let headers: string[] = this.nodeManager.findTableHeaders(table);
        let tableBody: any = this.nodeManager.findTableBody(table);
        if (headers.length === 0 || tableBody === null) {
            return [];
        }
        return this.buildRList(headers, tableBody);
    }

    private buildRList(headers: string[], tableBody: any) {
        let rows: string[][] = [];
        let rooms: Room[] = [];
        for (let node of tableBody.childNodes) {
            if (node.hasOwnProperty("nodeName") && node.nodeName === "tr") {
                let oneRowData: string[] = this.getTableOneRowData(node);
                rows.push(oneRowData);
            }
        }
        for (let row of rows) {
            let room: Room = this.createRoomFromRow(row, headers);
            if (RoomManager.validateRoom(room)) {
                rooms.push(room);
            }

        }
        return rooms;
    }

    private createRoomFromRow(row: string[], headers: string[]) {
        let room: Room = {
            number: "",
            name: "",
            seats: -1,
            type: "",
            furniture: "",
            href: ""
        };
        let counter: number = 0;
        for (let i of headers.keys()) {
            if (this.putDataInRoom(row[counter], headers[i], room)) {
                counter++;
            }
        }
        // console.log(room);
        return room;
    }

    private putDataInRoom(cell: string, header: string, room: Room) {
        switch (true) {
            case header.includes("room-number"):
                room.number = cell;
                room.name = this.indexBuilding.shortName + "_" + cell;
                break;
            case header.includes("room-capacity"):
                try {
                    room.seats = parseInt(cell, 10);
                } catch (e) {
                    room.seats = -1;
                }
                break;
            case header.includes("room-type"):
                room.type = cell;
                break;
            case header.includes("room-furniture"):
                room.furniture = cell;
                break;
            case header.includes("nothing"):
                room.href = cell;
                break;
            default:
                return false;
        }
        return true;
    }

    private getTableOneRowData(rowNode: any): string[] {
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
                    case className.includes("room-number"):
                        data.push(this.nodeManager.getRoomNumber(cell));
                        break;
                    case className.includes("room-capacity"):
                        data.push(this.nodeManager.getRoomCapacity(cell));
                        break;
                    case className.includes("room-type"):
                        data.push(this.nodeManager.getRoomType(cell));
                        break;
                    case className.includes("room-furniture"):
                        data.push(this.nodeManager.getRoomFurniture(cell));
                        break;
                    case className.includes("nothing"):
                        data.push(this.nodeManager.getRoomHref(cell));
                        break;
                    default:
                        break;
                }

            }
        }
        return data;
    }

    private static validateRoom(room: Room): boolean {
        //     return !(room.name === "" ||
        //         room.type === "" ||
        //         room.furniture === "" ||
        //         room.seats === -1 ||
        //         room.number === "" ||
        //         room.href === "");
        // }
        return true;
    }
}
