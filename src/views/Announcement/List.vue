<template>
    <section class="relative w-full bg-white">
        <div
            class="
                relative
                w-full
                px-5
                py-10
                mx-auto
                sm:py-12
                md:py-6 md:px-10
                max-w-7xl
            "
        >
           
                    <div
                        class="
                            flex flex-col
                            md:flex-row md:space-x-4
                            space-y-4
                            md:space-y-0 md:items-center
                        "
                    >
                        <multiselect
                            id="city"
                            v-model="city"
                            :searchable="true"
                            :close-on-select="true"
                            :options="cities"
                            label="name"
                            track-by="name"
                            name="city"
                            :select-label="'Clique Entrer pour selectionner'"
                            :deselect-label="'Clique Entrer pour retirer'"
                            :selected-label="'Selectionner'"
                            placeholder="Trouver la piscine la plus proche"
                            @select="filterByCity"
                        >
                            <template #noResult>
                                Oups! Aucun élément trouvé. Pensez à modifier la
                                requête de recherche.
                            </template>
                        </multiselect>
                        <div class="flex flex-row space-x-4 items-center">
                            <TSecondaryButton
                                class="
                                    w-40
                                    text-sm
                                    sm:text-md
                                    flex
                                    justify-center
                                "
                                @click.native="orderByPrice"
                            >
                                <span v-if="orderByPriceActive">
                                    🗓️ Filtrer par date
                                </span>
                                <span v-else> 💰 Filtrer par prix </span>
                            </TSecondaryButton>
                            <TSecondaryButton
                                class="text-sm sm:text-md"
                                @click="resetList"
                            >
                                <div
                                    class="flex flex-row space-x-2 items-center"
                                >
                                    <svg
                                        :class="
                                            no_data_found ? 'animate-pulse' : ''
                                        "
                                        class="w-4 h-4 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        ></path>
                                    </svg>
                                    <span> Réinitialiser</span>
                                </div>
                            </TSecondaryButton>
                        </div>
                    </div>
                    
                    <div
                        v-if="no_data_found"
                        class="
                            p-5
                            flex
                            items-center
                            justify-center
                            transform
                            scale-75
                            md:scale-100
                        "
                    >
                        <p
                            class="
                                text-6xl
                                font-semibold
                                text-center
                                leading-normal
                            "
                        >
                            😖 Oups, Votre recherche n'a pas aboutie
                        </p>
                    </div>
                    <AnnouncementCard v-else :page="page" />
               
        </div>
    </section>
</template>

<script>
import cities from '@/assets/js/cities'
import Multiselect from 'vue-multiselect'
import { ref } from '@vue/reactivity'
import { useStore } from 'vuex'
export default {
    components: { Multiselect },
    props: {
        page: {
            type: Number,
            default: 1,
        },
    },
    setup() {
        const store = useStore()
        const city = ref(null)
        const no_data_found = ref(false)
        const orderByPriceActive = ref(false)
        
        const filterByCity = (_) => {
            no_data_found.value = false
            setTimeout(function () {
                store
                    .dispatch('filterAnnoucementsByCity', city.value.name)
                    .then((response) => {
                        if (!response.success && response.empty) {
                            no_data_found.value = true
                        }
                    })
            }, 0)
        }

        const resetList = (_) => {
            no_data_found.value = false
            city.value = false
            store.dispatch('fetchAnnouncementsAction')
        }

        const orderByPrice = (_) => {
            let announcements = store.getters.getAnnouncements
            orderByPriceActive.value = !orderByPriceActive.value
            if (orderByPriceActive.value)
                announcements.sort(
                    (a, b) => a.half_day_price - b.half_day_price
                )
            else
                announcements.sort(
                    (a, b) => a.created_at.seconds - b.created_at.seconds
                )
        }

        return {
            cities,
            city,
            filterByCity,
            resetList,
            orderByPrice,
            orderByPriceActive,
            no_data_found,
        }
    },
}
</script>

<style></style>
