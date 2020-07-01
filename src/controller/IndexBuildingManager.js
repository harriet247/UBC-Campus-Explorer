"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const RoomManager_1 = require("./RoomManager");
class IndexBuildingManager {
    setBuildingList(indexBuildingsLists, content) {
        let promises = [];
        this.content = content;
        for (let indexBuildingList of indexBuildingsLists) {
            promises.push(this.createBuildingList(indexBuildingList));
        }
        return Promise.all(promises).then((buildingLists) => {
            for (let buildingList of buildingLists) {
                if (buildingList.length > 0) {
                    return buildingList;
                }
            }
            return [];
        });
    }
    createBuildingList(indexBuildings) {
        let promises = [];
        let buildingList = [];
        for (let indexBuilding of indexBuildings) {
            promises.push(this.convertIndexBuildingToBuilding(indexBuilding));
        }
        return Promise.all(promises)
            .then((pBuildings) => {
            for (let pBuilding of pBuildings) {
                if (pBuilding !== null && pBuilding !== undefined) {
                    buildingList.push(pBuilding);
                }
            }
            return buildingList;
        });
    }
    getGeoLocation(address) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: "cs310.students.cs.ubc.ca",
                port: 11316,
                path: "/api/v1/project_team051/" + address,
                method: "GET"
            };
            const req = http.request(options, (res) => {
                if (res.statusCode === 200) {
                    res.on("data", (body) => {
                        let response = JSON.parse(body);
                        let geoLocation = {
                            lat: response.lat,
                            lon: response.lon
                        };
                        resolve(geoLocation);
                    });
                }
                else {
                    resolve(null);
                }
            });
            req.on("error", (e) => {
                resolve(null);
            });
            req.end();
        });
    }
    convertIndexBuildingToBuilding(indexBuilding) {
        let result = null;
        let requestAddress = this.getURLAddress(indexBuilding);
        let geoLocation = null;
        return this.getGeoLocation(requestAddress)
            .then((geo) => {
            geoLocation = geo;
            if (geoLocation === null) {
                return Promise.reject("No GeoLocation");
            }
            this.roomManager = new RoomManager_1.default();
            return this.roomManager.getRoomList(indexBuilding, this.content);
        })
            .then((roomList) => {
            if (roomList.length > 0) {
                result = {
                    fullname: indexBuilding.fullName,
                    shortname: indexBuilding.shortName,
                    address: indexBuilding.address,
                    lat: geoLocation.lat,
                    lon: geoLocation.lon,
                    roomList: roomList
                };
                return Promise.resolve(result);
            }
        })
            .catch((err) => {
            return Promise.resolve(null);
        });
    }
    getURLAddress(indexBuilding) {
        let requestAddress = indexBuilding.address;
        let i = 0;
        while (i < requestAddress.length) {
            requestAddress = requestAddress.replace(" ", "%20");
            i++;
        }
        return requestAddress;
    }
}
exports.default = IndexBuildingManager;
//# sourceMappingURL=IndexBuildingManager.js.map