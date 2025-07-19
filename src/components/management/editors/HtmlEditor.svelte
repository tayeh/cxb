<script lang="ts">
    import {mount, onMount} from "svelte";
    import { createEventDispatcher } from "svelte";
    import Editor from "cl-editor";
    import {marked} from "marked";
    import {Card} from "flowbite-svelte";

    const dispatch = createEventDispatcher();

    let {
        uid = "",
        content = $bindable(""),
    } : {
        uid?: string,
        content: string
    } = $props();


    let maindiv;
    let editor = null;

    onMount(async () => {
        editor = mount(Editor, {
            target: maindiv,
            props: {
                actions: [
                    "undo",
                    "redo",
                    "b",
                    "i",
                    'u',
                    'strike',
                    'sup',
                    "sub",
                    "h1",
                    "h2",
                    "p",
                    "blockquote",
                    "ol",
                    "ul",
                    "hr",
                    "left",
                    "right",
                    "center",
                    "justify",
                    "a",
                    "image",
                    //'forecolor',
                    //'backcolor',
                    "removeFormat",
                    /*{
                                      name: 'save', // required
                                      icon: '<svg class="icon blink"><use xlink:href="/symbol-defs.svg#floppy-disk" /></svg>', // string or html string (ex. <svg>...</svg>)
                                      title: 'Save',
                                      result: () => {
                                          if(changed) {
                                              let html = editor.getHtml(true);
                                              data.attributes.payload.embedded = html;
                                              update(html);
                                              //console.log("Hi there: ", html);
                                              changed = false;
                                          }
                                      }
                      }*/
                ],
            }
        });

        // Add event listeners manually
        const editorElement = maindiv.querySelector('.cl-content');
        if (editorElement) {
            editorElement.addEventListener('input', (event) => {
                // This matches how the Editor component dispatches the 'change' event
                if (editor && typeof editor.getHtml === 'function') {
                    content = editor.getHtml(true);
                    dispatch("changed");
                }
            });
        }
        editor.setHtml(content, true);
    });

    $effect(() => {
        if (editor && typeof editor.getHtml === 'function') {
            const currentHtml = editor.getHtml(true);
            if (content !== currentHtml) {
                editor.setHtml(content, true);
            }
        }
    });
</script>
<Card class="h-full max-w-full pt-1">
<article class="prose max-w-full">
    <div class="h-100 pt-1" bind:this="{maindiv}" id="htmleditor-{uid}"></div>
</article>
</Card>


<style>
    :global(.cl) {
        height: 100%;
        padding: 20px;
    }
    :global(.cl-content) {
        font-family: "uthmantn";
        font-size: 1rem !important;
    }
</style>

