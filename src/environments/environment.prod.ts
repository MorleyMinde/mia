export const environment = {
    production: true,
    useEmulators: false,
    firebase: {
        apiKey: "AIzaSyBKqLQnnRGw6lEqenHuCoqRGpAhjmAiTwg",
        authDomain: "mtuniafya-cc8fb.firebaseapp.com",
        projectId: "mtuniafya-cc8fb",
        storageBucket: "mtuniafya-cc8fb.firebasestorage.app",
        messagingSenderId: "1040749273984",
        appId: "1:1040749273984:web:7e532fa7a351f2338c1765",
        measurementId: "G-R1VXGE1B4W"
    },
    emulators: {
        auth: {
            host: "localhost",
            port: 9099
        },
        functions: {
            host: "localhost",
            port: 5004
        },
        firestore: {
            host: "localhost",
            port: 8080
        }
    }
};

