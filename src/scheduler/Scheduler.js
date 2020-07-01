"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Scheduler {
    schedule(sections, rooms) {
        let retSchedule = new Array();
        const timeTable = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
            "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
            "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
            "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
            "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
        sections = this.pplCounterHelper(sections);
        sections = sections.sort(function (cur, next) {
            return (cur.courses_pNum < next.courses_pNum) ? 1 :
                (cur.courses_pNum > next.courses_pNum) ? -1 : 0;
        });
        rooms = rooms.sort(function (cur, next) {
            return (cur.rooms_seats < next.rooms_seats ? 1 : cur.rooms_seats > next.rooms_seats ? -1 : 0);
        });
        rooms = this.setDistance(rooms);
        retSchedule = this.matchEnrol(rooms, sections, timeTable, retSchedule);
        return retSchedule;
    }
    matchEnrol(rooms, sections, timeTable, retSchedule) {
        let ret = retSchedule;
        let rawSections = [];
        for (let timeslot of timeTable) {
            let tempRoom = [];
            let tempID = [];
            for (let section of sections) {
                for (let room of rooms) {
                    if (!this.checkSec(rawSections, section)) {
                        if (!this.checkRoom(tempRoom, room)) {
                            if (!this.checkCourse(tempID, section.courses_dept + section.courses_id)) {
                                if (section.courses_pNum <= room.rooms_seats) {
                                    let tempMatch = [room, section, timeslot];
                                    ret.push(tempMatch);
                                    rawSections.push(section);
                                    tempRoom.push(room);
                                    tempID.push(section.courses_dept + section.courses_id);
                                }
                            }
                        }
                    }
                }
            }
        }
        return ret;
    }
    checkSec(rawSections, section) {
        return rawSections.some(function (raw) {
            return raw.courses_uuid === section.courses_uuid;
        });
    }
    checkRoom(rawRoom, room) {
        return rawRoom.some(function (raw) {
            return raw.rooms_shortname + raw.rooms_number === room.rooms_shortname + room.rooms_number;
        });
    }
    checkCourse(tempID, sectionID) {
        return tempID.some(function (temp) {
            return temp === sectionID;
        });
    }
    pplCounterHelper(sections) {
        for (let section of sections) {
            section.courses_pNum = section.courses_fail + section.courses_pass + section.courses_audit;
        }
        return sections;
    }
    setDistance(rooms) {
        let sumLat = 0;
        let sumLon = 0;
        let centerLat = 0;
        let centerLon = 0;
        for (let room of rooms) {
            sumLat += room.rooms_lat;
            sumLon += room.rooms_lon;
        }
        centerLat = sumLat / rooms.length;
        centerLon = sumLon / rooms.length;
        let distance = 0;
        for (let room of rooms) {
            distance = this.findDistanceHelper(room.rooms_lat, room.rooms_lon, centerLat, centerLon);
            room.rooms_dist = distance;
        }
        return rooms;
    }
    findDistanceHelper(lat, lon, centerLat, centerLon) {
        let R = 6371e3;
        let φ1 = this.toRadians(lat);
        let φ2 = this.toRadians(centerLat);
        let Δφ = this.toRadians(centerLat - lat);
        let Δλ = this.toRadians(centerLon - lon);
        let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degree) {
        return degree * (Math.PI / 180);
    }
}
exports.default = Scheduler;
//# sourceMappingURL=Scheduler.js.map