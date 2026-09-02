/* =========================================
   NELE
   Główny moduł inteligentnej nauczycielki
========================================= */

const Nele = {

    name: "Nele",
    language: "de-DE",

    messagesElement: null,
    inputElement: null,
    sendButton: null,
    micButton: null,

    init() {

        console.log("Nele ist bereit.");

        this.messagesElement =
            document.getElementById("messages");

        this.inputElement =
            document.getElementById("message-input");

        this.sendButton =
            document.getElementById("send-btn");

        this.micButton =
            document.getElementById("mic-btn");


        /* SENDEN */

        if (this.sendButton) {

            this.sendButton.addEventListener(
                "click",
                () => this.sendMessage()
            );

        }


        /* ENTER */

        if (this.inputElement) {

            this.inputElement.addEventListener(
                "keydown",
                (event) => {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        this.sendMessage();

                    }

                }
            );

        }


        /* SZYBKIE PRZYCISKI */

        const quickActions =
            document.querySelectorAll(
                ".quick-action"
            );

        quickActions.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const text =
                        button.dataset.text;

                    if (!text) return;

                    this.inputElement.value =
                        text;

                    this.inputElement.focus();

                }
            );

        });

    },


    async sendMessage() {

        if (!this.inputElement) return;

        const text =
            this.inputElement.value.trim();

        if (!text) return;


        /* pokaż wiadomość użytkownika */

        this.addMessage(
            "Du",
            text,
            "user"
        );


        /* wyczyść pole */

        this.inputElement.value = "";


        /*
        =====================================
        TUTAJ PÓŹNIEJ PODŁĄCZYMY BACKEND NELE
        =====================================
        */

        this.addMessage(
            "Nele",
            "Ich habe deine Nachricht bekommen. Meine Intelligenz wird jetzt angeschlossen.",
            "nele"
        );

    },


    addMessage(
        speaker,
        text,
        type
    ) {

        if (!this.messagesElement) return;


        const message =
            document.createElement("div");


        message.classList.add(
            "message"
        );


        if (type === "user") {

            message.classList.add(
                "message-user"
            );

        } else {

            message.classList.add(
                "message-nele"
            );

        }


        const speakerElement =
            document.createElement("span");

        speakerElement.className =
            "speaker";

        speakerElement.textContent =
            speaker;


        const textNode =
            document.createTextNode(
                text
            );


        message.appendChild(
            speakerElement
        );

        message.appendChild(
            textNode
        );


        this.messagesElement.appendChild(
            message
        );


        this.messagesElement.scrollTop =
            this.messagesElement.scrollHeight;

    }

};


document.addEventListener(
    "DOMContentLoaded",
    () => Nele.init()
);
