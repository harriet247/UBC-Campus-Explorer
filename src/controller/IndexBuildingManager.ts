import {
    Building,
    IndexBuilding,
    Room,
    GeoLocation,
    InsightError,
    InternalRoomDataset,
    InsightDatasetKind
} from "./IInsightFacade";
import http = require("http");
import RoomManager from "./RoomManager";
import Log from "../Util";
import NodeManager from "./NodeManager";

export default class IndexBuildingManager {
    private roomManager: RoomManager;
    private content: string;

    public setBuildingList(indexBuildingsLists: IndexBuilding[][], content: string): Promise<Building[]> {
        let promises: Array<Promise<Building[]>> = [];
        this.content = content;
        for (let indexBuildingList of indexBuildingsLists) {
            promises.push(this.createBuildingList(indexBuildingList));
        }
        return Promise.all(promises).then((buildingLists: Building[][]) => {
            for (let buildingList of buildingLists) {
                if (buildingList.length > 0) {
                    return buildingList;
                }
            }
            return [];
        });
    }

    private createBuildingList(indexBuildings: IndexBuilding[]): Promise<Building[]> {
        let promises: Array<Promise<Building>> = [];
        let buildingList: Building[] = [];
        for (let indexBuilding of indexBuildings) {
            promises.push(this.convertIndexBuildingToBuilding(indexBuilding));
        }
        return Promise.all(promises)
            .then((pBuildings: Building[]) => {
                // console.log(pBuildings);
                for (let pBuilding of pBuildings) {
                    if (pBuilding !== null && pBuilding !== undefined) {
                        buildingList.push(pBuilding);
                    }
                }
                return buildingList;
            });
    }

    public getGeoLocation(address: string): Promise<GeoLocation> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: "cs310.students.cs.ubc.ca",
                port: 11316,
                path: "/api/v1/project_team051/" + address,
                method: "GET"
            };

            const req = http.request(options, (res) => {
                // console.log(`STATUS: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    res.on("data", (body) => {
                        // console.log(`BODY: ${body}`);
                        let response = JSON.parse(body);
                        let geoLocation: GeoLocation = {
                            lat: response.lat,
                            lon: response.lon
                        };
                        resolve(geoLocation);
                    });
                } else {
                    resolve(null);
                }

            });
            req.on("error", (e) => {
                // console.error(`problem with request: ${e.message}`);
                resolve(null);
            });
            req.end();
        });
    }

    private convertIndexBuildingToBuilding(indexBuilding: IndexBuilding): Promise<Building> {
        let result: Building = null;
        let requestAddress = this.getURLAddress(indexBuilding);
        let geoLocation: GeoLocation = null;
        return this.getGeoLocation(requestAddress)
            .then((geo: GeoLocation) => {
                geoLocation = geo;
                // console.log(indexBuilding.address);
                // console.log(geoLocation);
                if (geoLocation === null) {
                    return Promise.reject("No GeoLocation");
                }
                this.roomManager = new RoomManager();
                return this.roomManager.getRoomList(indexBuilding, this.content);
            })
            .then((roomList: Room[]) => {
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
            .catch((err: any) => {
                return Promise.resolve(null);
            });
    }

    private getURLAddress(indexBuilding: IndexBuilding) {
        let requestAddress: string = indexBuilding.address;
        let i = 0;
        while (i < requestAddress.length) {
            requestAddress = requestAddress.replace(" ", "%20");
            i++;
        }
        return requestAddress;
    }
}
