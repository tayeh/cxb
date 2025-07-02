<script>
    import { Card } from 'flowbite-svelte';
    import {
        InfoCircleOutline,
        CalendarMonthOutline,
        SearchOutline
    } from 'flowbite-svelte-icons';
    import {goto} from "@roxi/routify";
    $goto
</script>

<div class="container mx-auto p-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card class="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onclick={()=>$goto('/management/tools/info')}
        >
            <div class="flex flex-col items-center text-center">
                <div class="p-3 bg-primary-100 rounded-full mb-4">
                    <InfoCircleOutline class="w-12 h-12 text-primary-600" />
                </div>
                <h3 class="text-xl font-bold mb-2">INFORMATION</h3>
                <p class="text-gray-600">Get information about connected instance of Dmart.</p>
            </div>
        </Card>

        <Card class="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onclick={()=>$goto('/management/tools/events')}
        >
            <div class="flex flex-col items-center text-center">
                <div class="p-3 bg-secondary-100 rounded-full mb-4">
                    <CalendarMonthOutline class="w-12 h-12 text-secondary-600" />
                </div>
                <h3 class="text-xl font-bold mb-2">Events</h3>
                <p class="text-gray-600">Check all Dmart instance events.</p>
            </div>
        </Card>

        <Card class="p-4 hover:shadow-lg transition-shadow  cursor-pointer"
              onclick={()=>$goto('/management/tools/query')}>
            <div class="flex flex-col items-center text-center">
                <div class="p-3 bg-tertiary-100 rounded-full mb-4">
                    <SearchOutline class="w-12 h-12 text-tertiary-600" />
                </div>
                <h3 class="text-xl font-bold mb-2">Query</h3>
                <p class="text-gray-600">Perform queries agains connected dmart instance.</p>
            </div>
        </Card>
    </div>
</div>
