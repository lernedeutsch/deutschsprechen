/* =========================================
   NELE
   Główny moduł nauczycielki języka niemieckiego
========================================= */

const Nele = {
    name: "Nele",
    language: "de-DE",
    level: "A1",
    lesson: null,

    async loadLesson() {
        try {
            const response = await fetch("data/lessons/a1/lesson-01.json");

            if (!response.ok) {
                throw new Error("Nie udało się wczytać lekcji.");
            }

            this.lesson = await response.json();

            console.log("Lekcja została wczytana:");
            console.log(this.lesson);

        } catch (error) {
            console.error("Błąd Nele:", error);
        }
    },

    async init() {
        console.log("Nele ist bereit.");
        await this.loadLesson();
    }
};

Nele.init();
