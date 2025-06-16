import { writable } from "svelte/store";
import {ResourceType} from "@edraj/tsdmart";
export const currentEntry = writable(null);
export const currentListView = writable(null);

export const resourceTypeWithNoPayload = [
    ResourceType.role,
    ResourceType.permission,
];
export const subpathInManagementNoAction = [
    "/users",
    "/roles",
    "/permissions",
    "/groups",
];
