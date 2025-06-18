export function jsonEditorContentParser(jeContent: any){
    if(jeContent === undefined || jeContent === null){
        return {};
    }
    return jeContent.json ? structuredClone(jeContent.json) : JSON.parse(jeContent.text)
}