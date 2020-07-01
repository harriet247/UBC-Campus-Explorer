"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DatasetManager {
    checkIdValidity(id, dataMap) {
        if (id === null) {
            return [false, "Invalid id: should not be null"];
        }
        else if (id.includes("_")) {
            return [false, "Invalid id: should not contains underscore"];
        }
        else if (id.replace(/\s/g, "").length === 0) {
            return [false, "Invalid id: should not be only whitespace"];
        }
        else if ([...dataMap.keys()].includes(id)) {
            return [false, "Invalid id: repeated id discovered"];
        }
        return [true, "the id is valid"];
    }
}
exports.default = DatasetManager;
//# sourceMappingURL=DatasetManager.js.map