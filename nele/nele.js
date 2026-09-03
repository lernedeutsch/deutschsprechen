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

    recognition: null,
    isListening: false,


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
        ========================= */

        this.setupMicrophone();

    },


    /* =========================================
       KONFIGURACJA MIKROFONU
    ========================================= */

    setupMicrophone() {

        if (!this.micButton) {
            return;
        }


        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            console.warn(
                "Rozpoznawanie mowy nie jest obsługiwane przez tę przeglądarkę."
            );

            this.micButton.disabled = true;
            this.micButton.title =
                "Spracherkennung wird von diesem Browser nicht unterstützt.";

            return;
        }


        this.recognition =
            new SpeechRecognition();


        this.recognition.lang =
            this.language;

        this.recognition.continuous =
            false;

        this.recognition.interimResults =
            false;

        this.recognition.maxAlternatives =
            1;


        /* -------------------------
           START NASŁUCHIWANIA
        ------------------------- */

        this.recognition.onstart = () => {

            this.isListening = true;

            console.log(
                "Nele hört zu..."
            );

            this.micButton.textContent =
                "🔴";

            this.micButton.title =
                "Ich höre zu...";

        };


        /* -------------------------
           ROZPOZNANY TEKST
        ------------------------- */

        this.recognition.onresult =
            (event) => {

                const transcript =
                    event.results[0][0]
                        .transcript
                        .trim();


                console.log(
                    "Rozpoznano:",
                    transcript
                );


                if (
                    this.inputElement
                    && transcript
                ) {

                    this.inputElement.value =
                        transcript;

                }

            };


        /* -------------------------
           KONIEC NASŁUCHIWANIA
        ------------------------- */

        this.recognition.onend = () => {

            this.isListening = false;

            this.micButton.textContent =
                "🎤";

            this.micButton.title =
                "Sprechen";


            /*
              Jeżeli rozpoznano tekst,
              automatycznie wysyłamy go do Nele.
            */

            if (
                this.inputElement
                && this.inputElement.value.trim()
            ) {

                this.sendMessage();

            }

        };


        /* -------------------------
           BŁĘDY
        ------------------------- */

        this.recognition.onerror =
            (event) => {

                console.error(
                    "Mikrofon Fehler:",
                    event.error
                );


                this.isListening = false;

                this.micButton.textContent =
                    "🎤";


                if (
                    event.error ===
                    "not-allowed"
                ) {

                    this.addMessage(
                        "Nele",
                        "Bitte erlaube den Zugriff auf das Mikrofon.",
                        "nele"
                    );

                }

                else if (
                    event.error ===
                    "no-speech"
                ) {

                    console.log(
                        "Keine Sprache erkannt."
                    );

                }

                else {

                    this.addMessage(
                        "Nele",
                        "Ich konnte dich leider nicht verstehen. Versuch es bitte noch einmal.",
                        "nele"
                    );

                }

            };


        /* -------------------------
           KLIKNIĘCIE MIKROFONU
        ------------------------- */

        this.micButton.addEventListener(
            "click",
            () => {

                if (!this.recognition) {
                    return;
                }


                if (this.isListening) {

                    this.recognition.stop();

                    return;

                }


                /*
                  Zatrzymujemy głos Nele,
                  żeby mikrofon nie słuchał
                  jej własnej odpowiedzi.
                */

                if (
                    "speechSynthesis" in window
                ) {

                    window.speechSynthesis.cancel();

                }


                try {

                    this.recognition.start();

                } catch (error) {

                    console.error(
                        "Nie można uruchomić mikrofonu:",
                        error
                    );

                }

            }
        );

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


            /* przeczytaj odpowiedź głosem */

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
