/* =========================================
   NELE
   Główny moduł inteligentnej nauczycielki
========================================= */

const Nele = {

    name: "Nele",
    language: "de-DE",

    backendUrl:
        "https://nele-backend.onrender.com",

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


        /* =========================
           SENDEN
        ========================= */

        if (this.sendButton) {

            this.sendButton.addEventListener(
                "click",
                () => this.sendMessage()
            );

        }


        /* =========================
           ENTER
        ========================= */

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


        /* =========================
           SZYBKIE PRZYCISKI
        ========================= */

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


        /* =========================
           MIKROFON
           na razie jeszcze nieaktywny
        ========================= */

        if (this.micButton) {

            this.micButton.addEventListener(
                "click",
                () => {

                    console.log(
                        "Mikrofon zostanie podłączony później."
                    );

                }
            );

        }

    },


    /* =========================================
       WYSYŁANIE WIADOMOŚCI
    ========================================= */

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


        /* zablokuj przycisk na czas odpowiedzi */

        if (this.sendButton) {

            this.sendButton.disabled = true;

            this.sendButton.textContent =
                "...";

        }


        try {

            const response =
                await fetch(
                    `${this.backendUrl}/chat`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: text
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Backend error: ${response.status}`
                );

            }


            const data =
                await response.json();


            const reply =
                data.reply ||
                "Ich weiß gerade nicht, was ich antworten soll.";


            /* pokaż odpowiedź Nele */

            this.addMessage(
                "Nele",
                reply,
                "nele"
            );


            /* przeczytaj odpowiedź głosem przeglądarki */

            this.speak(
                reply
            );


        } catch (error) {

            console.error(
                "Nele Backend Fehler:",
                error
            );


            this.addMessage(
                "Nele",
                "Entschuldigung. Ich kann den Server gerade nicht erreichen.",
                "nele"
            );

        } finally {

            if (this.sendButton) {

                this.sendButton.disabled =
                    false;

                this.sendButton.textContent =
                    "Senden";

            }


            if (this.inputElement) {

                this.inputElement.focus();

            }

        }

    },


    /* =========================================
       GŁOS NELE
       SpeechSynthesis przeglądarki
    ========================================= */

    speak(text) {

        if (
            !("speechSynthesis" in window)
        ) {

            console.warn(
                "SpeechSynthesis nie jest obsługiwany przez tę przeglądarkę."
            );

            return;

        }


        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.lang =
            this.language;

        utterance.rate =
            0.95;

        utterance.pitch =
            1.0;

        utterance.volume =
            1.0;


        const voices =
            window.speechSynthesis.getVoices();


        const germanVoices =
            voices.filter(
                voice =>
                    voice.lang &&
                    voice.lang
                        .toLowerCase()
                        .startsWith("de")
            );


        const preferredVoice =
            germanVoices.find(
                voice =>
                    voice.name
                        .toLowerCase()
                        .includes("google")
            )
            ||
            germanVoices.find(
                voice =>
                    voice.lang === "de-DE"
            )
            ||
            germanVoices[0];


        if (preferredVoice) {

            utterance.voice =
                preferredVoice;

        }


        window.speechSynthesis.speak(
            utterance
        );

    },


    /* =========================================
       DODAWANIE WIADOMOŚCI DO CZATU
    ========================================= */

    addMessage(
        speaker,
        text,
        type
    ) {

        if (!this.messagesElement) {
            return;
        }


        const message =
            document.createElement(
                "div"
            );


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
            document.createElement(
                "span"
            );


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


/* =========================================
   START NELE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => Nele.init()
);
