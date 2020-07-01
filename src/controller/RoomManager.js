"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
const parse5 = require("parse5");
const NodeManager_1 = require("./NodeManager");
class RoomManager {
    constructor() {
        this.nodeManager = new NodeManager_1.default();
        this.roomLists = [];
        this.roomList = [];
    }
    getRoomList(indexBuilding, content) {
        return JSZip.loadAsync(content, { base64: true })
            .then((res) => {
            return res.file(indexBuilding.ref).async("text");
        })
            .then((text) => {
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
    createRoomLists(text) {
        let document = null;
        let tables = [];
        document = parse5.parse(text);
        tables = this.parseDocumentTables(document);
        this.createRoomListsHelper(tables);
    }
    parseDocumentTables(document) {
        return this.nodeManager.findTableNodes(document);
    }
    createRoomListsHelper(tables) {
        for (let table of tables) {
            let roomList = this.convertTableToList(table);
            if (roomList.length > 0) {
                this.roomLists.push(roomList);
            }
        }
    }
    convertTableToList(table) {
        let headers = this.nodeManager.findTableHeaders(table);
        let tableBody = this.nodeManager.findTableBody(table);
        if (headers.length === 0 || tableBody === null) {
            return [];
        }
        return this.buildRList(headers, tableBody);
    }
    buildRList(headers, tableBody) {
        let rows = [];
        let rooms = [];
        for (let node of tableBody.childNodes) {
            if (node.hasOwnProperty("nodeName") && node.nodeName === "tr") {
                let oneRowData = this.getTableOneRowData(node);
                rows.push(oneRowData);
            }
        }
        for (let row of rows) {
            let room = this.createRoomFromRow(row, headers);
            if (RoomManager.validateRoom(room)) {
                rooms.push(room);
            }
        }
        return rooms;
    }
    createRoomFromRow(row, headers) {
        let room = {
            number: "",
            name: "",
            seats: -1,
            type: "",
            furniture: "",
            href: ""
        };
        let counter = 0;
        for (let i of headers.keys()) {
            if (this.putDataInRoom(row[counter], headers[i], room)) {
                counter++;
            }
        }
        return room;
    }
    putDataInRoom(cell, header, room) {
        switch (true) {
            case header.includes("room-number"):
                room.number = cell;
                room.name = this.indexBuilding.shortName + "_" + cell;
                break;
            case header.includes("room-capacity"):
                try {
                    room.seats = parseInt(cell, 10);
                }
                catch (e) {
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
    getTableOneRowData(rowNode) {
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
    static validateRoom(room) {
        return true;
    }
}
exports.default = RoomManager;
//# sourceMappingURL=RoomManager.js.map