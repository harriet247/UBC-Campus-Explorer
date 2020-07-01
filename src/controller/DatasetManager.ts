import {InsightDatasetKind, InternalCourseDataset, InternalDataset, InternalRoomDataset} from "./IInsightFacade";
import Log from "../Util";

export default abstract class DatasetManager {

    public checkIdValidity(id: string, dataMap: Map<string,
        InternalDataset>): [boolean, string] {
        if (id === null) {
            return [false, "Invalid id: should not be null"];
        } else if (id.includes("_")) {
            return [false, "Invalid id: should not contains underscore"];
        } else if (id.replace(/\s/g, "").length === 0) {
            return [false, "Invalid id: should not be only whitespace"];
        } else if ([...dataMap.keys()].includes(id)) {
            return [false, "Invalid id: repeated id discovered"];
        }
        return [true, "the id is valid"];
    }

    // public abstract parseInternalDatasetToDataMap(
    //     id: string,
    //     texts: string[],
    //     kind: InsightDatasetKind,
    // ): boolean;
}
