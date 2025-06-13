<script lang="ts">
  import {Card} from "flowbite-svelte";
  import { createEventDispatcher } from "svelte";
  import { marked } from "marked";
  import { mangle } from "marked-mangle";
  import { gfmHeadingId } from "marked-gfm-heading-id";

  const dispatch = createEventDispatcher();
  marked.use(mangle());
  marked.use(gfmHeadingId({
      prefix: "my-prefix-",
  }));


  let activeTab = 0;

  let {
      content = $bindable(""),
      handleSave = $bindable(() => {})
  } : {
      content: string,
      handleSave?: () => void
  } = $props();


  if (typeof(content) !== "string"){
      content = "";
  }

  let textarea;
  let start = 0, end = 0;
  function handleSelect() {
    start = textarea.selectionStart;
    end = textarea.selectionEnd;
  }

  const listViewInsert = "{% ListView \n" +
      "   type=\"subpath\"\n" +
      "   space_name=\"\" \n" +
      "   subpath=\"/\" \n" +
      "   is_clickable=false %}\n" +
      "{% /ListView %}\n";
  const tableInsert = `| Header 1 | Header 2 |
|----------|----------|
|  Cell1   |  Cell2   |`

  function handleKeyDown(event) {
      if (event.ctrlKey) {
          if (['b','i','t'].includes(event.key)) {
              event.preventDefault();
              switch (event.key) {
                  case 'b':
                      handleFormatting("**")
                      break;
                  case 'i':
                      handleFormatting("_")
                      break;
                  case 't':
                      handleFormatting("~~")
                      break;
              }
          }
      }

  }

  function handleFormatting(format: any, isWrap = true, isPerLine = false){
    if (isWrap && start === 0 && end === 0) {
      return
    }
    if (isWrap) {
        textarea.value = textarea.value.substring(0, start) + format + textarea.value.substring(start, end) + format + textarea.value.substring(end);
    }
    else {
        start = textarea.selectionStart;
        end = textarea.selectionEnd;
        if (isPerLine){

            const lines = textarea.value.split('\n');

            let lineStart = textarea.value.substring(0, start).split('\n').length - 1;
            let lineEnd = textarea.value.substring(0, end).split('\n').length - 1;

            if (textarea.value[end] === '\n') {
                lineEnd--;
            }

            for (let i = lineStart; i <= lineEnd; i++) {
                lines[i] = `${format} ` + lines[i];
            }

            textarea.value = lines.join('\n');
        }
        else {
            let lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = textarea.value.indexOf('\n', end);
            if (lineEnd === -1) {
                lineEnd = textarea.value.length;
            }
            textarea.value = textarea.value.substring(0, lineStart) + `${format} ` + textarea.value.substring(lineStart, lineEnd) + textarea.value.substring(lineEnd);
        }
    }

    start = 0;
    end = 0;
    content = structuredClone(textarea.value);
  }
</script>

<Card class="h-100 pt-1">
  <!-- Tab navigation -->
  <div class="border-b border-gray-200">
    <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
      <li class="mr-2" role="presentation">
        <button
                class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === 0 ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                type="button"
                role="tab"
                aria-selected={activeTab === 0}
                onclick={() => activeTab = 0}
        >
          Editor
        </button>
      </li>
      <li class="mr-2" role="presentation">
        <button
          class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === 1 ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
          type="button"
          role="tab"
          aria-selected={activeTab === 1}
          onclick={() => activeTab = 1}
        >
          Preview
        </button>
      </li>
    </ul>
  </div>

  <!-- Tab content -->
  <div class="mt-2">
    <div class={activeTab === 0 ? '' : 'hidden'} role="tabpanel">
            <textarea
                    onblur={(e)=>{
                    e.preventDefault();
                    textarea.focus();
                }}
                    onkeydown={handleKeyDown}
                    bind:this={textarea}
                    onselect={handleSelect}
                    rows="22"
                    maxlength="4096"
                    class="w-full h-full m-0 font-mono form-control"
                    bind:value={content}
                    oninput={() => dispatch("changed")}
            ></textarea>
    </div>

    <div class={activeTab === 1 ? '' : 'hidden'} role="tabpanel">
      <div class="h-full w-full p-3 overflow-auto">
        {@html marked(content)}
      </div>
    </div>
  </div>

  <!-- Formatting toolbar -->
  <div class="flex justify-end mt-2 border-t pt-2">
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("**")}>
      <strong>B</strong>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("_")}>
      <i>I</i>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("~~")}>
      <del>S</del>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("*", false, true)}>
      <span class="fa fa-list-ul"></span>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("1.", false, true)}>
      <span class="fa fa-list-ol"></span>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("#", false)}>
      <span>H1</span>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("##", false)}>
      <span>H2</span>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting("###", false)}>
      <span>H3</span>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting(tableInsert, false)}>
      <span class="fa fa-table"></span>
    </button>
    <button class="p-1 mx-1 text-gray-700 hover:bg-gray-100 rounded" onclick={() => handleFormatting(listViewInsert, false)}>
      <span class="fa fa-newspaper"></span>
    </button>
    <button class="p-1 mx-1 text-green-600 hover:bg-gray-100 rounded" onclick={handleSave}>
      <span class="fa fa-save"></span>
    </button>
  </div>
</Card>
