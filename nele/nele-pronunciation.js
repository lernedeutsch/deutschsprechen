/* =========================================
   NELE – PRONUNCIATION RECORDER

   Osobne nagrywanie głosu
   do ćwiczeń wymowy.

   WAŻNE:

   Ten moduł NIE używa SpeechRecognition.

   Dzięki temu nie konkuruje
   z normalnym mikrofonem Nele.
========================================= */


const NelePronunciationRecorder = {

    mediaRecorder: null,
    audioStream: null,

    audioChunks: [],

    audioBlob: null,
    audioMimeType: null,

    isRecording: false,


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

        if (
            !window.MediaRecorder
        ) {

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
       CZYSZCZENIE OSTATNIEGO NAGRANIA
    ===================================== */

    clearRecording() {

        this.audioChunks = [];

        this.audioBlob = null;

        this.audioMimeType = null;

    },


    /* =====================================
       ZWOLNIENIE MIKROFONU
    ===================================== */

    releaseStream() {

        if (
            !this.audioStream
        ) {

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


        this.audioStream = null;

    },


    /* =====================================
       ROZPOCZĘCIE NAGRYWANIA
    ===================================== */

    async start() {

        if (
            this.isRecording
        ) {

            return false;

        }


        if (
            !this.isSupported()
        ) {

            console.warn(
                "Nagrywanie wymowy nie jest "
                + "obsługiwane przez tę przeglądarkę."
            );

            return false;

        }


        /*
          Usuwamy poprzednie nagranie.
        */

        this.clearRecording();


        /*
          Zwalniamy ewentualny
          poprzedni stream.
        */

        this.releaseStream();


        try {

            const stream =
                await navigator
                    .mediaDevices
                    .getUserMedia({

                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }

                    });


            this.audioStream =
                stream;


            const mimeType =
                this.getSupportedMimeType();


            let recorder;


            if (
                mimeType
            ) {

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


            /* =============================
               FRAGMENTY AUDIO
            ============================= */

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


            /* =============================
               BŁĄD RECORDINGU
            ============================= */

            recorder.onerror =
                event => {

                    console.error(
                        "Pronunciation recorder error:",
                        event.error || event
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


        if (
            !recorder
        ) {

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


                            console.warn(
                                "Pronunciation recording "
                                + "is empty."
                            );

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
                        + "nagrywania wymowy:",
                        error
                    );


                    this.mediaRecorder =
                        null;

                    this.isRecording =
                        false;


                    this.releaseStream();


                    resolve(
                        this.audioBlob
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


        this.releaseStream();

        this.clearRecording();


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

        if (
            !this.audioBlob
        ) {

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
