export default class NodeManager {
    public findTableNodes(node: any): object[] {
        let results: object[] = [];
        if (!node.hasOwnProperty("nodeName") && !node.hasOwnProperty("childNodes")) {
            return results;
        }
        if (node.nodeName === "table") {
            results.push(node);
            return results;
        } else {
            if (node.hasOwnProperty("childNodes")) {
                for (let element of node.childNodes) {
                    let temp: object[] = this.findTableNodes(element);
                    if (temp.length > 0) {
                        results = results.concat(temp);
                    }
                }
                return results;
            } else {
                return results;
            }
        }
    }

    public findTableBody(node: any): any {
        let result: any = null;
        if (node.hasOwnProperty("nodeName") && node.nodeName === "tbody") {
            result = node;
        } else {
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


    public findTableHeaders(node: any): string[] {
        let results: string[] = [];
        if (node.hasOwnProperty("nodeName") && node.nodeName === "th") {
            for (let attr of node.attrs) {
                if (attr.name === "class") {
                    results.push(attr.value);
                }
            }
        } else {
            if (node.hasOwnProperty("childNodes")) {
                for (let cNode of node.childNodes) {
                    results = results.concat(this.findTableHeaders(cNode));
                }
            }
        }
        return results;
    }

    public getBuildingCode(td: any): string {
        let result: string = "";
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

    public getBuildingTitle(td: any): string {
        let result: string = "";
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

    public getBuildingAddress(td: any): string {
        let result: string = "";
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

    public getBuildingRef(td: any): string {
        let result: string = "";
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

    public getRoomNumber(td: any): string {
        let result: string = "";
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

    public getRoomCapacity(td: any): string {
        let result: string = "";
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


    public getRoomType(td: any): string {
        let result: string = "";
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


    public getRoomFurniture(td: any): string {
        let result: string = "";
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


    public getRoomHref(td: any): string {
        let result: string = "";
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
