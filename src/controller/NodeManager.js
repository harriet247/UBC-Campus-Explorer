"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NodeManager {
    findTableNodes(node) {
        let results = [];
        if (!node.hasOwnProperty("nodeName") && !node.hasOwnProperty("childNodes")) {
            return results;
        }
        if (node.nodeName === "table") {
            results.push(node);
            return results;
        }
        else {
            if (node.hasOwnProperty("childNodes")) {
                for (let element of node.childNodes) {
                    let temp = this.findTableNodes(element);
                    if (temp.length > 0) {
                        results = results.concat(temp);
                    }
                }
                return results;
            }
            else {
                return results;
            }
        }
    }
    findTableBody(node) {
        let result = null;
        if (node.hasOwnProperty("nodeName") && node.nodeName === "tbody") {
            result = node;
        }
        else {
            if (node.hasOwnProperty("childNodes")) {
                for (let cNode of node.childNodes) {
                    let temp = this.findTableBody(cNode);
                    if (temp !== null) {
                        result = temp;
                        break;
                    }
                }
            }
        }
        return result;
    }
    findTableHeaders(node) {
        let results = [];
        if (node.hasOwnProperty("nodeName") && node.nodeName === "th") {
            for (let attr of node.attrs) {
                if (attr.name === "class") {
                    results.push(attr.value);
                }
            }
        }
        else {
            if (node.hasOwnProperty("childNodes")) {
                for (let cNode of node.childNodes) {
                    results = results.concat(this.findTableHeaders(cNode));
                }
            }
        }
        return results;
    }
    getBuildingCode(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "#text") {
                result = node.value;
                break;
            }
        }
        result = result.replace(/\s/g, "");
        result = result.replace(/(\r\n|\n|\r)/gm, "");
        return result;
    }
    getBuildingTitle(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "a") {
                for (let aNode of node.childNodes) {
                    if (aNode.nodeName === "#text") {
                        result = aNode.value;
                        break;
                    }
                }
                break;
            }
        }
        result = result.replace(/(\r\n|\n|\r)/gm, "");
        result = result.replace(/(\s)+/gm, " ");
        return result;
    }
    getBuildingAddress(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "#text") {
                result = node.value;
                break;
            }
        }
        result = result.replace(/(\r\n|\n|\r)/gm, "");
        result = result.trim();
        return result;
    }
    getBuildingRef(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "a") {
                for (let attr of node.attrs) {
                    if (attr.name === "href") {
                        result = attr.value;
                        break;
                    }
                }
                break;
            }
        }
        return result;
    }
    getRoomNumber(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "a") {
                for (let cNode of node.childNodes) {
                    if (cNode.nodeName === "#text") {
                        result = cNode.value;
                        break;
                    }
                }
                break;
            }
        }
        return result;
    }
    getRoomCapacity(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "#text") {
                result = node.value;
                break;
            }
        }
        result = result.replace(/(\r\n|\n|\r)/gm, "");
        result = result.trim();
        return result;
    }
    getRoomType(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "#text") {
                result = node.value;
                break;
            }
        }
        result = result.replace(/(\r\n|\n|\r)/gm, "");
        result = result.trim();
        return result;
    }
    getRoomFurniture(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "#text") {
                result = node.value;
                break;
            }
        }
        result = result.replace(/(\r\n|\n|\r)/gm, "");
        result = result.trim();
        return result;
    }
    getRoomHref(td) {
        let result = "";
        for (let node of td.childNodes) {
            if (node.nodeName === "a") {
                for (let attr of node.attrs) {
                    if (attr.name === "href") {
                        result = attr.value;
                        break;
                    }
                }
                break;
            }
        }
        return result;
    }
}
exports.default = NodeManager;
//# sourceMappingURL=NodeManager.js.map