const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const path = require("path");
const fs = require("fs");

//..............GRACIAS.............//
// Palabras clave de agradecimiento
const palabrasAgradecimiento = ['gracias', 'muchas gracias', 'gracias a ti', 'mil gracias'];
// Flujo de agradecimiento
const flowGracias = addKeyword(palabrasAgradecimiento)
    .addAnswer('😊 ¡Gracias a ti! Nos alegra haber podido ayudarte. ¡Que tengas un excelente día!', null, async (_, { flowDynamic }) => {
        await flowDynamic(['👋 ¡Hasta pronto!']);
    });

//...............VALIDAR HORARIO.........//
const obtenerHoraColombia = () => {
    const fechaActual = new Date();
    const opciones = { timeZone: 'America/Bogota' };
    const fechaColombia = new Date(fechaActual.toLocaleString('en-US', opciones));

    const diaSemana = fechaColombia.getDay(); // 0 = Domingo, ..., 6 = Sábado
    const hora = fechaColombia.getHours();   // Hora en Colombia
    return { diaSemana, hora };
};

const validarHorarioLaboral = () => {
    const { diaSemana, hora } = obtenerHoraColombia();
    console.log(`Día: ${diaSemana}, Hora: ${hora}`); // Log para depurar

    // Horarios laborales según el día
    const horarios = {
        1: { inicio: 7, fin: 18 }, // Lunes
        2: { inicio: 7, fin: 18 }, // Martes
        3: { inicio: 7, fin: 18 }, // Miércoles
        4: { inicio: 7, fin: 17 }, // Jueves
        5: { inicio: 7, fin: 17 }, // Viernes
        6: { inicio: 8, fin: 11.75 }, // Sábado (11.75 representa 11:45 a.m.)
        7: { inicio: 0, fin: 0 } // Domingo (cerrado)
    };

    // Validar si el día está dentro de los horarios definidos
    const horarioDia = horarios[diaSemana];
    if (!horarioDia) {
        console.log('Día fuera del horario laboral.');
        return false;
    }

    // Validar si la hora está dentro del rango definido
    const esHorarioLaboral = hora >= horarioDia.inicio && hora < horarioDia.fin;
    console.log(`Es día laboral: ${!!horarioDia}, Es horario laboral: ${esHorarioLaboral}`);
    return esHorarioLaboral;
};

//...................OPCIONES DEL MENU................//

// Flujo de Asesor
const flowAsesor = addKeyword(EVENTS.ACTION)
    .addAnswer("Escribe *volver* para regresar al menú principal.")
    .addAnswer(['📞 *Hablar con un Asesor*',
        'Sabemos que a veces necesitas atención personalizada.',
        'Haz clic en el siguiente enlace para comunicarte directamente con uno de nuestros asesores:',
        '👉 *[Llamar]*: tel:3126610564',
        '💬 ¡Estamos aquí para ayudarte!'
    ],
        null, async (_, { flowDynamic, gotoFlow }) => {
            manejarRedireccion(_, gotoFlow);
            if (validarHorarioLaboral()) {
                await flowDynamic('✅ Estamos en horario laboral. Contacte al asesor y revisará tu solicitud pronto.');
            } else {
                await flowDynamic([
                    'Actualmente estamos fuera de servicio' +
                    '🕒 Nuestro horario de atención es el siguiente: \n' +
                    '• Lunes a Viernes: de 7:00 AM a 6:00 PM\n' +
                    '• Jueves y Viernes (horario especial): de 7:00 AM a 5:00 PM\n' +
                    '• Sábado: de 8:00 AM a 11:45 AM\n' +
                    '• Domingo: Cerrado\n' +
                    'Deja tu consulta en el enlace anterior y un asesor te atenderá en el siguiente día hábil según este horario.',
                ]);
            }
        })

// Flujo de Quejas
const flowQuejas = addKeyword(EVENTS.ACTION)
    .addAnswer("Escribe *volver* para regresar al menú principal.")
    .addAnswer([
        '📋 PQRSF',
        'Queremos mejorar nuestro servicio. Por favor, completa el formulario en el siguiente enlace para registrar tu PQRSF:',
        '\n👉(peticiones, quejas, reclamos, felicitaciones)(https://forms.gle/CdPQLxnKbotv4twY8)',
        '\n✅ Una vez completado, nuestro equipo lo revisará y se pondrá en contacto contigo. ¡Gracias por ayudarnos a mejorar!']
    );


// Flujo de Cuenta
const flowCuenta = addKeyword(EVENTS.ACTION)
    .addAnswer("Escribe *volver* para regresar al menú principal.")
    .addAnswer([
        '🔍 Para consultar tu Estado de Cuenta, necesito que envíes un mensaje al siguiente link con los siguientes datos:',
        '*Nombre:*',
        '*Identificación:*',
        '⚠️ Todo en un solo mensaje.',
        '\nlink : https://wa.me/3217273896',
    ],
        null, async (_, { flowDynamic, gotoFlow }) => {
            manejarRedireccion(_, gotoFlow);
            if (validarHorarioLaboral()) {
                await flowDynamic('✅ Estamos en horario laboral. Contacte al asesor y revisará tu solicitud pronto.');
            } else {
                await flowDynamic([
                    'Actualmente estamos fuera de servicio' +
                    '🕒 Nuestro horario de atención es el siguiente: \n' +
                    '• Lunes a Viernes: de 7:00 AM a 6:00 PM\n' +
                    '• Jueves y Viernes (horario especial): de 7:00 AM a 5:00 PM\n' +
                    '• Sábado: de 8:00 AM a 11:45 AM\n' +
                    '• Domingo: Cerrado\n' +
                    'Deja tu consulta en el anterior link y un asesor te atenderá en el siguiente día hábil según este horario.',
                ]);
            }
        });

// Flujo de Ventas
const flowVenta = addKeyword(EVENTS.ACTION)
    .addAnswer("Escribe *volver* para regresar al menú principal.")
    .addAnswer(
        [
            '🏗 Interesado en un Proyecto',
            'Por favor, cuéntanos el nombre del proyecto que te interesa.'
        ],
        { capture: true },
        async (ctx, { flowDynamic }) => {


            const proyectoInteresado = ctx.body;

            if (['volver', 'menu', 'menú'].includes(proyectoInteresado.toLowerCase())) {
                await flowDynamic(['🔙 Regresando al menú principal...']);
                return;
            }

            try {
                if (validarHorarioLaboral()) {
                    await flowDynamic([
                        `✅ ¡Gracias por tu interés en el proyecto *${proyectoInteresado}*!`,
                        'Haz click sobre el siguiente link para comunicarte instantáneamente con nuestro asesor de ventas',
                        'https://wa.me/3126610564'
                    ]);
                } else {
                    await flowDynamic([
                        `✅ ¡Gracias por tu interés en el proyecto *${proyectoInteresado}*!`,
                        'Actualmente estamos fuera de servicio' +
                        '🕒 Nuestro horario de atención es el siguiente: \n' +
                        '• Lunes a Viernes: de 7:00 AM a 6:00 PM\n' +
                        '• Jueves y Viernes (horario especial): de 7:00 AM a 5:00 PM\n' +
                        '• Sábado: de 8:00 AM a 11:45 AM\n' +
                        '• Domingo: Cerrado',
                        'Deja tu consulta en el siguiente enlace y un asesor te atenderá en el siguiente día hábil según este horario.' +
                        '\nhttps://wa.me/3126610564'
                    ]);
                }
            } catch (error) {
                console.error('Error en el flujo de ventas:', error);
                await flowDynamic([
                    '❌ Ocurrió un problema procesando tu solicitud. Por favor, intenta nuevamente más tarde.'
                ]);
            }
        }
    );

//....................MENU......................//

// Función genérica para manejar "volver" o "menu"
const manejarRedireccion = async (ctx, gotoFlow) => {
    if (ctx.body.toLowerCase() === "volver" || ctx.body.toLowerCase() === "menu") {
        return await gotoFlow(menuFlow);
    }
};

// Cargar el menú desde un archivo
const menuPath = path.join(__dirname, "mensajes", "menu.txt");
const menu = fs.readFileSync(menuPath, "utf-8");
const menuFlow = addKeyword(["menu", "volver"])

    // Flujo del Menú
    .addAnswer(menu, { capture: true }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        manejarRedireccion(ctx, gotoFlow);
        const opcionesValidas = ["1", "2", "3", "4", "0"];
        if (!opcionesValidas.includes(ctx.body)) {
            return fallBack("❌ Opción no válida. Por favor selecciona una opción válida.");
        }

        switch (ctx.body) {
            case "1":
                return gotoFlow(flowVenta);
            case "2":
                return gotoFlow(flowCuenta);
            case "3":
                return gotoFlow(flowQuejas);
            case "4":
                return gotoFlow(flowAsesor);
            case "0":
                return await flowDynamic("Saliendo... Puedes volver al menú escribiendo '*menu*'.");
        }
    });
//..................BIENVENIDAS....................//
// Flujo Principal 
const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
.addAnswer(["🙌 ¡Hola! Bienvenido a *Atlantis Constructora Ltda.*",
    "Gracias por contactarnos.",
    "Estamos aquí para ayudarte a construir tus sueños."
])
.addAnswer(
    "¿Cuéntanos en qué podemos ayudarte?", 
    { capture: true }, // Captura la respuesta del usuario
    async (ctx, { flowDynamic, gotoFlow }) => {
        // Captura lo que el usuario escribe
        const consultaUsuario = ctx.body;
        console.log(`Consulta del usuario: ${consultaUsuario}`);

        // Envía el menú después de la respuesta
        await flowDynamic("Aquí tienes nuestras opciones:");
        return gotoFlow(menuFlow); // Redirige al flujo del menú
    }
);

    const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer(["🙌 ¡Hola! Bienvenido a *Atlantis Constructora Ltda.*",
        "Gracias por contactarnos.",
        "Estamos aquí para ayudarte a construir tus sueños."
    ])
    .addAnswer(
        "¿Cuéntanos en qué podemos ayudarte?", 
        { capture: true }, // Captura la respuesta del usuario
        async (ctx, { flowDynamic, gotoFlow }) => {
            // Captura lo que el usuario escribe
            const consultaUsuario = ctx.body;
            console.log(`Consulta del usuario: ${consultaUsuario}`);

            // Envía el menú después de la respuesta
            await flowDynamic("Aquí tienes nuestras opciones:");
            return gotoFlow(menuFlow); // Redirige al flujo del menú
        }
    );
// Inicialización del Bot
const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowWelcome, menuFlow, flowVenta, flowCuenta, flowAsesor, flowQuejas, flowGracias]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
