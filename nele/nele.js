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

            this.showLesson();

        } catch (error) {
            console.error("Błąd Nele:", error);
        }
    },

    showLesson() {
        if (!this.lesson) {
            return;
        }

        const title = document.getElementById("lesson-title");
        const description = document.getElementById("lesson-description");

        if (title) {
            title.textContent =
                `${this.lesson.level} · Lektion ${this.lesson.lesson} · ${this.lesson.title}`;
        }

        if (description) {
            description.textContent = this.lesson.description;
        }
    },

    async init() {
        console.log("Nele ist bereit.");
        await this.loadLesson();
    }
};

Nele.init();
