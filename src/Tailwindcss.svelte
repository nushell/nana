<style global>
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @layer utilities {
        .styled-table {
            @apply min-w-full max-w-full;
        }

        .styled-table tbody tr {
            @apply text-solarized-base03 dark:text-solarized-base3;
            @apply odd:bg-solarized-base3 even:bg-solarized-base2;
            @apply dark:odd:bg-solarized-base03 dark:even:bg-solarized-base02;
            @apply border-b last:border-b-0 border-solarized-base1 dark:border-solarized-base01;
        }

        .styled-table th,
        .styled-table td {
            @apply pl-1 border-r last:border-r-0 border-solarized-base1 dark:border-solarized-base01;
        }
    }
</style>
