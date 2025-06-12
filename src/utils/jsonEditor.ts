export function jsonEditorContentParser(jeContent: any){
    return jeContent.json ? structuredClone(jeContent.json) : JSON.parse(jeContent.text)
}