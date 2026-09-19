/* =========================================
   NELE – PRONUNCIATION RECORDER

   Nagrywanie prawdziwego głosu użytkownika.

   Ten moduł:

   1. nagrywa głos użytkownika,
   2. tworzy plik audio,
   3. wysyła go do backendu,
   4. backend rozpoznaje mowę przez Whisper,
   5. pokazuje rozpoznany tekst użytkownika,
   6. pokazuje odpowiedź Nele,
   7. Nele wypowiada odpowiedź.

   WAŻNE:

   Ten moduł NIE używa SpeechRecognition
   i NIE zmienia zwykłego mikrofonu 🎤.
========================================= */


const NelePronunciationRecorder = {

    backendUrl:
        (
            window.NELE_BACKEND_URL
            ||
            "https://nele-backend.onrender.com"
        ),

    pronunciationButton: null,
    normalMicButton: null,

    mediaRecorder: null,
    audioStream: null,

    audioChunks: [],

    audioBlob: null,
    audioMimeType: null,

    isRecording: false,
    isUploading: false,
    pronunciationTaskReady: false,
    pronunciationTaskStarting: false,

    normalMicWasDisabled: false,

    buttonResetTimer: null,


    /* =====================================
       START MODUŁU
    ===================================== */

    init() {

        this.pronunciationButton =
            document.getElementById(
                "pronunciation-btn"
            );

        this.normalMicButton =
            document.getElementById(
                "mic-btn"
            );


        if (!this.pronunciationButton) {

            console.warn(
                "Pronunciation button not found."
            );

            return;
        }


        if (!this.isSupported()) {

            this.pronunciationButton.disabled =
                true;

            this.pronunciationButton.textContent =
                "🗣️ Nicht unterstützt";

            this.pronunciationButton.title =
                (
                    "Audioaufnahme wird von "
                    + "diesem Browser nicht unterstützt."
                );

            console.warn(
                "MediaRecorder wird von diesem "
                + "Browser nicht unterstützt."
            );

            return;
        }


        this.pronunciationButton.addEventListener(
            "click",
            () => {

                this.handleButtonClick();

            }
        );

        window.addEventListener(
            "nele:new-conversation",
            () => {
                this.resetPronunciationTask();
            }
        );


        this.setButtonIdle();


        console.log(
            "Nele pronunciation recorder ready."
        );

    },


    /* =====================================
       SESSION ID
    ===================================== */

    getSessionId() {

        const sessionId =
            localStorage.getItem(
                "nele_session_id"
            );


        if (sessionId) {

            return sessionId;

        }


        return null;

    },


    /* =====================================
       DOSTĘP DO GŁÓWNEJ NELE
    ===================================== */

    getNeleApp() {

        try {

            if (
                typeof Nele !==
                "undefined"
                &&
                Nele
            ) {

                return Nele;

            }

        } catch (error) {

            console.warn(
                "Nele app not available:",
                error
            );

        }


        return null;

    },


    /* =====================================
       POKAZANIE ODPOWIEDZI BACKENDU
       W NORMALNYM CZACIE
    ===================================== */

    showConversationResult(
        data
    ) {

        if (!data) {
            return;
        }


        const neleApp =
            this.getNeleApp();


        if (!neleApp) {

            console.warn(
                "Cannot display pronunciation "
                + "result because Nele is unavailable."
            );

            return;

        }


        const transcript =
            String(
                data.transcript
                ||
                ""
            ).trim();


        const reply =
            String(
                data.reply
                ||
                ""
            ).trim();


        /*
          Pokazujemy to, co Whisper
          rozpoznał jako wypowiedź użytkownika.
        */

        if (
            transcript
            &&
            typeof neleApp.addMessage
            === "function"
        ) {

            neleApp.addMessage(
                "Du",
                transcript,
                "user"
            );

        }


        /*
          Pokazujemy normalną
          odpowiedź Nele.
        */

        if (
            reply
            &&
            typeof neleApp.addMessage
            === "function"
        ) {

            neleApp.addMessage(
                "Nele",
                reply,
                "nele"
            );

        }


        /*
          Nele wypowiada odpowiedź.
        */

        if (
            reply
            &&
            typeof neleApp.speak
            === "function"
        ) {

            neleApp.speak(
                reply
            );

        }

    },


    /* =====================================
       CZY NAGRYWANIE JEST OBSŁUGIWANE
    ===================================== */

    isSupported() {

        return Boolean(
            window.MediaRecorder
            &&
            navigator.mediaDevices
            &&
            navigator.mediaDevices.getUserMedia
        );

    },


    /* =====================================
       OBSŁUGIWANY FORMAT AUDIO
    ===================================== */

    getSupportedMimeType() {

        if (!window.MediaRecorder) {

            return "";

        }


        const mimeTypes = [

            "audio/webm;codecs=opus",

            "audio/webm",

            "audio/mp4",

            "audio/ogg;codecs=opus"

        ];


        for (
            const mimeType
            of mimeTypes
        ) {

            try {

                if (
                    typeof MediaRecorder
                        .isTypeSupported
                    === "function"
                    &&
                    MediaRecorder
                        .isTypeSupported(
                            mimeType
                        )
                ) {

                    return mimeType;

                }

            } catch (error) {

                console.warn(
                    "MIME type check error:",
                    error
                );

            }

        }


        return "";

    },


    /* =====================================
       ROZSZERZENIE PLIKU
    ===================================== */

    getFileExtension(
        blob
    ) {

        const type =
            String(
                blob?.type
                ||
                ""
            ).toLowerCase();


        if (type.includes("mp4")) {

            return "m4a";

        }


        if (type.includes("ogg")) {

            return "ogg";

        }


        if (type.includes("wav")) {

            return "wav";

        }


        return "webm";

    },


    /* =====================================
       KLIKNIĘCIE PRZYCISKU
    ===================================== */

    async handleButtonClick() {

        if (
            this.isUploading
            ||
            this.pronunciationTaskStarting
        ) {

            return;

        }


        if (this.isRecording) {

            await this.stopFromButton();

            return;

        }


        if (!this.pronunciationTaskReady) {

            await this.preparePronunciationTask();

            return;

        }


        await this.startFromButton();

    },


    /* =====================================
       PRZYGOTOWANIE PRAWDZIWEGO ZADANIA
       WYMOWY W BACKENDZIE
    ===================================== */

    async preparePronunciationTask() {

        const sessionId =
            this.getSessionId();

        if (!sessionId) {

            this.showTemporaryButtonMessage(
                "⚠️ Sitzung neu laden"
            );

            return false;

        }


        this.pronunciationTaskStarting =
            true;

        this.setButtonStarting();


        try {

            const response =
                await fetch(
                    `${this.backendUrl}/api/activity/start`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                session_id:
                                    sessionId,

                                type:
                                    "pronunciation"
                            })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok
                ||
                !data
                ||
                !data.task
                ||
                data.task.type !==
                    "pronunciation"
            ) {

                console.warn(
                    "Pronunciation task start failed.",
                    data
                );

                this.showTemporaryButtonMessage(
                    "⚠️ Aufgabe nicht gestartet"
                );

                return false;

            }


            this.pronunciationTaskReady =
                true;


            const neleApp =
                this.getNeleApp();

            const reply =
                String(
                    data.reply
                    ||
                    ""
                ).trim();

            const speakText =
                String(
                    data.speak_text
                    ||
                    data.task.target
                    ||
                    ""
                ).trim();


            if (
                reply
                &&
                neleApp
                &&
                typeof neleApp.addMessage
                    === "function"
            ) {

                neleApp.addMessage(
                    "Nele",
                    reply,
                    "nele"
                );

            }


            if (
                speakText
                &&
                neleApp
                &&
                typeof neleApp.speak
                    === "function"
            ) {

                neleApp.speak(
                    speakText
                );

            }


            this.setButtonTaskReady();

            return true;


        } catch (error) {

            console.error(
                "Pronunciation task start error:",
                error
            );

            this.showTemporaryButtonMessage(
                "⚠️ Aufgabe nicht gestartet"
            );

            return false;


        } finally {

            this.pronunciationTaskStarting =
                false;

        }

    },


    resetPronunciationTask() {

        this.pronunciationTaskReady =
            false;

        this.pronunciationTaskStarting =
            false;

        this.clearRecording();
        this.restoreNormalMicrophone();
        this.setButtonIdle();

    },


    /* =====================================
       CZY NORMALNY MIKROFON
       WŁAŚNIE SŁUCHA
    ===================================== */

    isNormalMicrophoneListening() {

        if (!this.normalMicButton) {

            return false;

        }


        const buttonText =
            String(
                this.normalMicButton
                    .textContent
                || ""
            ).trim();


        const buttonTitle =
            String(
                this.normalMicButton
                    .title
                || ""
            ).toLowerCase();


        return (
            buttonText === "🔴"
            ||
            buttonTitle.includes(
                "höre zu"
            )
        );

    },


    /* =====================================
       START Z PRZYCISKU
    ===================================== */

    async startFromButton() {

        if (
            this.isNormalMicrophoneListening()
        ) {

            this.showTemporaryButtonMessage(
                "🎤 Erst Mikrofon stoppen"
            );

            return false;

        }


        /*
          Zatrzymujemy głos Nele,
          żeby nie nagrywać jej odpowiedzi.
        */

        if (
            "speechSynthesis"
            in window
        ) {

            window
                .speechSynthesis
                .cancel();

        }


        /*
          Na czas nagrywania wyłączamy
          zwykły mikrofon.
        */

        this.disableNormalMicrophone();


        this.setButtonStarting();


        const started =
            await this.start();


        if (!started) {

            this.restoreNormalMicrophone();


            this.showTemporaryButtonMessage(
                "⚠️ Aufnahme nicht möglich"
            );


            return false;

        }


        this.setButtonRecording();


        return true;

    },


    /* =====================================
       STOP Z PRZYCISKU
    ===================================== */

    async stopFromButton() {

        this.setButtonStopping();


        const audioBlob =
            await this.stop();


        this.restoreNormalMicrophone();


        if (
            !audioBlob
            ||
            audioBlob.size <= 0
        ) {

            console.warn(
                "Pronunciation recording is empty."
            );


            this.showTemporaryButtonMessage(
                "⚠️ Keine Aufnahme"
            );


            return null;

        }


        console.log(
            "Pronunciation recording saved:",
            {
                size:
                    audioBlob.size,

                type:
                    audioBlob.type
            }
        );


        /*
          WYSYŁAMY AUDIO DO BACKENDU.
        */

        const uploaded =
            await this.uploadRecording(
                audioBlob
            );


        if (uploaded) {

            this.showTemporaryButtonMessage(
                "✅ Verstanden"
            );

        } else {

            this.showTemporaryButtonMessage(
                "⚠️ Senden fehlgeschlagen"
            );

        }


        return audioBlob;

    },


    /* =====================================
       WYSŁANIE AUDIO DO BACKENDU
    ===================================== */

    async uploadRecording(
        audioBlob
    ) {

        if (
            !audioBlob
            ||
            audioBlob.size <= 0
        ) {

            return false;

        }


        if (this.isUploading) {

            return false;

        }


        this.isUploading =
            true;


        this.setButtonUploading();


        try {

            const formData =
                new FormData();


            const extension =
                this.getFileExtension(
                    audioBlob
                );


            const filename =
                (
                    "nele-pronunciation-"
                    + Date.now()
                    + "."
                    + extension
                );


            /*
              SESSION ID
            */

            const sessionId =
                this.getSessionId();

            if (!sessionId) {
                return false;
            }

            formData.append(
                "session_id",
                sessionId
            );

            formData.append(
                "input_mode",
                "voice"
            );


            /*
              Nie wysyłamy message.

              Whisper ma sam rozpoznać,
              co użytkownik powiedział.
            */


            /*
              AUDIO
            */

            formData.append(
                "audio",
                audioBlob,
                filename
            );


            console.log(
                "Sending pronunciation audio:",
                {
                    filename:
                        filename,

                    size:
                        audioBlob.size,

                    type:
                        audioBlob.type
                }
            );


            /*
              NIE ustawiamy ręcznie
              Content-Type.

              Przeglądarka sama ustawia
              multipart/form-data
              razem z boundary.
            */

            const response =
                await fetch(
                    `${this.backendUrl}/chat`,
                    {
                        method:
                            "POST",

                        body:
                            formData
                    }
                );


            let data;


            try {

                data =
                    await response.json();

            } catch (error) {

                console.error(
                    "Backend response is not JSON:",
                    error
                );


                return false;

            }


            console.log(
                "Pronunciation backend response:",
                data
            );


            /*
              NOWE:

              Pokazujemy transkrypcję
              oraz odpowiedź Nele
              w normalnym czacie.
            */

            this.showConversationResult(
                data
            );


            if (
                data
                &&
                data.meta
                &&
                data.meta.activity ===
                    "pronunciation"
            ) {

                this.pronunciationTaskReady =
                    Boolean(
                        data.meta.retry
                    );

            }


            /*
              Sukces oznacza:

              - serwer odpowiedział 2xx
              - audio dotarło
              - jeżeli była transkrypcja,
                została przetworzona.
            */

            if (
                response.ok
                &&
                data
                &&
                data.audio_received === true
            ) {

                console.log(
                    "✅ Backend processed real audio."
                );


                if (
                    data.transcript
                ) {

                    console.log(
                        "Whisper transcript:",
                        data.transcript
                    );

                }


                return true;

            }


            console.warn(
                "Backend could not process audio.",
                data
            );


            return false;


        } catch (error) {

            console.error(
                "Pronunciation upload error:",
                error
            );


            return false;


        } finally {

            this.isUploading =
                false;

        }

    },


    /* =====================================
       BLOKOWANIE NORMALNEGO MIKROFONU
    ===================================== */

    disableNormalMicrophone() {

        if (!this.normalMicButton) {

            return;

        }


        this.normalMicWasDisabled =
            Boolean(
                this.normalMicButton.disabled
            );


        this.normalMicButton.disabled =
            true;


        this.normalMicButton.title =
            "Ausspracheaufnahme läuft.";

    },


    /* =====================================
       PRZYWRÓCENIE NORMALNEGO MIKROFONU
    ===================================== */

    restoreNormalMicrophone() {

        if (!this.normalMicButton) {

            return;

        }


        this.normalMicButton.disabled =
            this.normalMicWasDisabled;


        if (
            !this.normalMicWasDisabled
        ) {

            this.normalMicButton.title =
                "Sprechen";

        }


        this.normalMicWasDisabled =
            false;

    },


    /* =====================================
       PRZYCISK – STAN NORMALNY
    ===================================== */

    setButtonIdle() {

        if (!this.pronunciationButton) {

            return;

        }


        this.clearButtonResetTimer();


        this.pronunciationButton.disabled =
            false;

        this.pronunciationButton.textContent =
            "🗣️ Aussprache üben";

        this.pronunciationButton.title =
            "Aussprache aufnehmen";


        this.pronunciationButton.setAttribute(
            "aria-label",
            "Aussprache üben"
        );

    },


    setButtonTaskReady() {

        if (!this.pronunciationButton) {

            return;

        }


        this.clearButtonResetTimer();

        this.pronunciationButton.disabled =
            false;

        this.pronunciationButton.textContent =
            "🎙️ Jetzt aufnehmen";

        this.pronunciationButton.title =
            "Aussprache jetzt aufnehmen";

        this.pronunciationButton.setAttribute(
            "aria-label",
            "Aussprache jetzt aufnehmen"
        );

    },


    /* =====================================
       PRZYCISK – START
    ===================================== */

    setButtonStarting() {

        if (!this.pronunciationButton) {

            return;

        }


        this.pronunciationButton.disabled =
            true;

        this.pronunciationButton.textContent =
            "⏳ Mikrofon...";

    },


    /* =====================================
       PRZYCISK – NAGRYWANIE
    ===================================== */

    setButtonRecording() {

        if (!this.pronunciationButton) {

            return;

        }


        this.pronunciationButton.disabled =
            false;

        this.pronunciationButton.textContent =
            "🔴 Aufnahme stoppen";

        this.pronunciationButton.title =
            "Aufnahme stoppen";


        this.pronunciationButton.setAttribute(
            "aria-label",
            "Aufnahme stoppen"
        );

    },


    /* =====================================
       PRZYCISK – ZATRZYMYWANIE
    ===================================== */

    setButtonStopping() {

        if (!this.pronunciationButton) {

            return;

        }


        this.pronunciationButton.disabled =
            true;

        this.pronunciationButton.textContent =
            "⏳ Aufnahme...";

    },


    /* =====================================
       PRZYCISK – WYSYŁANIE
    ===================================== */

    setButtonUploading() {

        if (!this.pronunciationButton) {

            return;

        }


        this.pronunciationButton.disabled =
            true;

        this.pronunciationButton.textContent =
            "⏳ Wird gesendet...";

    },


    /* =====================================
       TYMCZASOWY KOMUNIKAT
    ===================================== */

    showTemporaryButtonMessage(
        message
    ) {

        if (!this.pronunciationButton) {

            return;

        }


        this.clearButtonResetTimer();


        this.pronunciationButton.disabled =
            false;

        this.pronunciationButton.textContent =
            message;


        this.buttonResetTimer =
            window.setTimeout(
                () => {

                    this.setButtonIdle();

                },
                1800
            );

    },


    /* =====================================
       TIMER PRZYCISKU
    ===================================== */

    clearButtonResetTimer() {

        if (!this.buttonResetTimer) {

            return;

        }


        window.clearTimeout(
            this.buttonResetTimer
        );


        this.buttonResetTimer =
            null;

    },


    /* =====================================
       CZYSZCZENIE NAGRANIA
    ===================================== */

    clearRecording() {

        this.audioChunks =
            [];

        this.audioBlob =
            null;

        this.audioMimeType =
            null;

    },


    /* =====================================
       ZWOLNIENIE MIKROFONU
    ===================================== */

    releaseStream() {

        if (!this.audioStream) {

            return;

        }


        const tracks =
            this.audioStream
                .getTracks();


        tracks.forEach(
            track => {

                try {

                    track.stop();

                } catch (error) {

                    console.warn(
                        "Audio track stop error:",
                        error
                    );

                }

            }
        );


        this.audioStream =
            null;

    },


    /* =====================================
       ROZPOCZĘCIE NAGRYWANIA
    ===================================== */

    async start() {

        if (this.isRecording) {

            return false;

        }


        if (!this.isSupported()) {

            return false;

        }


        this.clearRecording();

        this.releaseStream();


        try {

            const stream =
                await navigator
                    .mediaDevices
                    .getUserMedia({

                        audio: {
                            echoCancellation:
                                true,

                            noiseSuppression:
                                true,

                            autoGainControl:
                                true
                        }

                    });


            this.audioStream =
                stream;


            const mimeType =
                this.getSupportedMimeType();


            let recorder;


            if (mimeType) {

                recorder =
                    new MediaRecorder(
                        stream,
                        {
                            mimeType:
                                mimeType
                        }
                    );

            } else {

                recorder =
                    new MediaRecorder(
                        stream
                    );

            }


            this.mediaRecorder =
                recorder;


            this.audioChunks =
                [];


            recorder.ondataavailable =
                event => {

                    if (
                        event.data
                        &&
                        event.data.size > 0
                    ) {

                        this.audioChunks.push(
                            event.data
                        );

                    }

                };


            recorder.onerror =
                event => {

                    console.error(
                        "Pronunciation recorder error:",
                        event.error
                        ||
                        event
                    );

                };


            recorder.start();


            this.isRecording =
                true;


            console.log(
                "Pronunciation recording started.",
                recorder.mimeType
            );


            return true;


        } catch (error) {

            console.error(
                "Nie można uruchomić "
                + "nagrywania wymowy:",
                error
            );


            this.mediaRecorder =
                null;

            this.isRecording =
                false;


            this.releaseStream();


            return false;

        }

    },


    /* =====================================
       ZATRZYMANIE NAGRYWANIA
    ===================================== */

    async stop() {

        const recorder =
            this.mediaRecorder;


        if (!recorder) {

            this.isRecording =
                false;


            this.releaseStream();


            return this.audioBlob;

        }


        if (
            recorder.state ===
            "inactive"
        ) {

            this.mediaRecorder =
                null;

            this.isRecording =
                false;


            this.releaseStream();


            return this.audioBlob;

        }


        return new Promise(
            resolve => {


                recorder.addEventListener(
                    "stop",
                    () => {

                        const mimeType =
                            recorder.mimeType
                            ||
                            this.getSupportedMimeType()
                            ||
                            "audio/webm";


                        if (
                            this.audioChunks.length
                            > 0
                        ) {

                            this.audioBlob =
                                new Blob(
                                    this.audioChunks,
                                    {
                                        type:
                                            mimeType
                                    }
                                );


                            this.audioMimeType =
                                mimeType;


                            console.log(
                                "Pronunciation audio ready:",
                                {
                                    size:
                                        this.audioBlob.size,

                                    type:
                                        this.audioBlob.type
                                }
                            );

                        } else {

                            this.audioBlob =
                                null;

                            this.audioMimeType =
                                null;

                        }


                        this.audioChunks =
                            [];


                        this.mediaRecorder =
                            null;

                        this.isRecording =
                            false;


                        this.releaseStream();


                        resolve(
                            this.audioBlob
                        );

                    },
                    {
                        once: true
                    }
                );


                try {

                    recorder.stop();

                } catch (error) {

                    console.error(
                        "Nie można zatrzymać "
                        + "nagrywania:",
                        error
                    );


                    this.mediaRecorder =
                        null;

                    this.isRecording =
                        false;


                    this.releaseStream();


                    resolve(
                        null
                    );

                }

            }
        );

    },


    /* =====================================
       ANULOWANIE NAGRYWANIA
    ===================================== */

    async cancel() {

        if (
            this.mediaRecorder
            &&
            this.mediaRecorder.state
            !== "inactive"
        ) {

            try {

                this.mediaRecorder.stop();

            } catch (error) {

                console.warn(
                    "Pronunciation cancel error:",
                    error
                );

            }

        }


        this.mediaRecorder =
            null;

        this.isRecording =
            false;

        this.isUploading =
            false;


        this.releaseStream();

        this.clearRecording();

        this.restoreNormalMicrophone();

        this.resetPronunciationTask();


        return true;

    },


    /* =====================================
       POBRANIE NAGRANIA
    ===================================== */

    getAudioBlob() {

        return this.audioBlob;

    },


    /* =====================================
       INFORMACJE O NAGRANIU
    ===================================== */

    getRecordingInfo() {

        if (!this.audioBlob) {

            return null;

        }


        return {

            size:
                this.audioBlob.size,

            type:
                this.audioBlob.type
                ||
                this.audioMimeType,

            ready:
                this.audioBlob.size > 0

        };

    }

};


/* =========================================
   UDOSTĘPNIENIE MODUŁU
========================================= */

window.NelePronunciationRecorder =
    NelePronunciationRecorder;


/* =========================================
   AUTOMATYCZNY START
========================================= */

function initNelePronunciationRecorder() {

    NelePronunciationRecorder.init();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initNelePronunciationRecorder,
        {
            once: true
        }
    );

} else {

    initNelePronunciationRecorder();

    }
