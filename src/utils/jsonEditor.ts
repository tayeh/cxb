export function jsonEditorContentParser(jeContent: any){
    return jeContent.json ? jeContent.json : JSON.parse(jeContent.text)
}