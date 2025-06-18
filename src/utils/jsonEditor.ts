export function jsonEditorContentParser(jeContent: any){
    console.log({jeContent})
    if(jeContent === undefined || jeContent === null){
        return {};
    }
    return jeContent.json ? structuredClone(jeContent.json) : JSON.parse(jeContent.text)
}