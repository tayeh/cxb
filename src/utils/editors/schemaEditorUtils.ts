// FORM -> JSON
import {generateUUID} from "@/utils/uuid";

export function transformToProperBodyRequest(obj: any) {
    delete obj.id;
    if (typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(transformToProperBodyRequest);
    }

    for (const key in obj) {
        if (key !== "id") {
            obj[key] = transformToProperBodyRequest(obj[key]);
        }
        if (key === "properties") {
            obj.properties = convertArrayToObject(obj.properties);
        }
    }

    // Convert type to prop_type
    if (obj.type) {
        obj.prop_type = obj.type;

        // For object types, ensure additionalProperties is set
        if (obj.prop_type === "object" && obj.additionalProperties === undefined) {
            obj.additionalProperties = false;
        }

        // Remove the type property as we're using prop_type instead
        delete obj.type;
    }

    // Process array items before removing the type property
    if (obj.type === "array" || obj.prop_type === "array"){
        if (obj.items) {
            if (Object.keys(obj?.items?.properties ?? []).length === 1) {
                obj.items.type = obj.items.properties[Object.keys(obj.items.properties)[0]].type;
                // Also set prop_type for items
                obj.items.prop_type = obj.items.type;
            } else {
                obj.items.type = "object";
                obj.items.prop_type = "object";
                // For object types, ensure additionalProperties is set
                if (obj.items.additionalProperties === undefined) {
                    obj.items.additionalProperties = false;
                }
            }

            // Remove type from items as well
            if (obj.items.type) {
                delete obj.items.type;
            }
        }
    }

    return obj;
}

export function convertArrayToObject(arr) {
    if (!Array.isArray(arr)) {
        return arr;
    }
    const obj = {};

    for (const item of arr) {
        const key = item["name"];
        delete item.name;
        obj[key] = item;
    }
    return obj;
}

// JSON -> FORM
export function transformFromProperBodyRequest(obj: any) {
    if (!obj || typeof obj !== "object") {
        return obj;
    }
    if (obj.id === undefined){
        obj.id = generateUUID();
    }
    if (Array.isArray(obj)) {
        return obj.map(transformFromProperBodyRequest);
    }

    const result = { ...obj };

    // Convert prop_type to type for the form
    if (result.prop_type && !result.type) {
        result.type = result.prop_type;
    }

    for (const key in result) {
        if (key !== "id") {
            result[key] = transformFromProperBodyRequest(result[key]);
        }
        if (key === "properties") {
            result.properties = convertObjectToArray(result.properties);
        }
    }

    return result;
}

export function convertObjectToArray(obj) {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    const arr = [];

    for (const key in obj) {
        if (key !== "id" && obj.hasOwnProperty(key)) {
            const item = { name: key, ...obj[key] };
            if (item.title === undefined){
                item.title = "";
            }
            if (item.description === undefined){
                item.description = "";
            }
            arr.push(item);
        }
    }

    return arr;
}
