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
// 🔹 Flujo de Asesoría (Redirige al submenú)
const flowAsesor = addKeyword(EVENTS.ACTION)
    .addAnswer("📞 *Hablar con un Asesor*", null, async (_, { flowDynamic, gotoFlow }) => {
        if (!validarHorarioLaboral()) {
            await flowDynamic([
                '⏳ *Fuera de horario laboral*\n'+
                '🕒 Nuestro horario de atención es:\n'+
                '• Lunes a Viernes: de 7:00 AM a 6:00 PM\n'+
                '• Jueves y Viernes (horario especial): de 7:00 AM a 5:00 PM\n'+
                '• Sábado: de 8:00 AM a 11:45 AM\n'+
                '• Domingo: Cerrado\n'+
                '📌 Deja tu consulta y un asesor te atenderá en el siguiente día hábil.'
            ]);
        } else {
            await flowDynamic('✅ Estamos en horario laboral. Puedes contactarte con un asesor.');
        }

        return gotoFlow(flowSubmenuAsesor); // ✅ Retorna correctamente al submenú
    });

// 🔹 Submenú del asesor
const flowSubmenuAsesor = addKeyword(['submenuasesor'])
    .addAnswer([
        '📌 *Selecciona una opción:*\n'+
        '\n1️⃣ *Asesor de Ventas*'+
        '\n2️⃣ *Asesor de Arriendos*'+
        '\n3️⃣ *Llamar a un Asesor*\n'+
        '\n🔙 Escribe *volver* para regresar al menú principal.'
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        if (ctx.body === '1') {
            await flowDynamic([
                '✅ *Asesor de Ventas:*\n'+
                '\n💬 Contacta a *Laura*: https://wa.me/3016886282'+
                '\n💬 Contacta a *Ingrid*: https://wa.me/3156817798'
            ]);
        } else if (ctx.body === '2') {
            await flowDynamic([
                '✅ *Asesor de Arriendos:*\n'+
                '\n💬 Contacta a *Alexandra*: https://wa.me/3005907784'
            ]);
        } else if (ctx.body === '3') {
            await flowDynamic([
                '📞 *Llamar a un Asesor*'+
                '\n👉 *[Llamar ahora](tel:+573016886282)*'+
                '\n👉 *[Llamar ahora](tel:+573156817798)*'
            ]);
        } else if (ctx.body.toLowerCase() === 'volver') {
            return gotoFlow(menuFlow); // ✅ Ahora regresa correctamente al menú principal
        } else {
            await flowDynamic('❌ Opción inválida. Escribe *1*, *2*, *3* o *volver*.');
        }
    });
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
        '🔍 Para consultar tu Estado de Cuenta, necesito que envíes un mensaje al siguiente correo con los siguientes datos:',
        '*Nombre:*'+
        '\n*Identificación:*'+
        '\n*Nombre del proyecto:*'+
        '\n⚠️ Todo en un solo mensaje.'+
        '\n📧 *Correo:* Tesoreria@atlantisconstructora.com'+
        '\n✅ Nuestro equipo revisará tu solicitud y te responderá en breve.'
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
        "🔍 Para consultar nuestros proyectos disponibles, por favor visita nuestra páginas en redes sociales:\n" +
        "👉 [Facebook](https://www.facebook.com/AtlantisConstructora)\n" +
        "👉 [Instagram](https://www.instagram.com/atlantisconstructora)"
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
                return gotoFlow(flowAsesor);
            case "3":
                return gotoFlow(flowCuenta);
            case "4":
                return gotoFlow(flowQuejas);
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
    const adapterFlow = createFlow([flowPrincipal, flowWelcome, menuFlow, flowVenta, flowCuenta, flowAsesor, flowQuejas, flowGracias, flowSubmenuAsesor]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
