export default {
    title: "Liens utiles",
    open: "Ouvrir",
    emailMe: "Envoyer un e-mail",
    contactMe: "Contacter",
    groups: {
        part1: "Code & Projets",
        part2: "Réseau professionnel",
        part3: "E-mail",
        part4: "Contact direct"
    },
    items: {
        github: {
            name: "GitHub",
            short: "Mes projets open-source et contributions.",
            url: "https://github.com/BenElhadj",
            qr: "/qr/qr_GitHub.png"
        },
        linkedin: {
            name: "LinkedIn",
            short: "Mon profil professionnel — CV et réseau.",
            url: "https://www.linkedin.com/in/benelhadjhamdi/",
            qr: "/qr/qr_LinkedIn.png"
        },
        email: {
            name: "Email",
            short: "Envoyez-moi directement un message par e-mail.",
            qr: "/qr/qr_Email.png",
            // escape @ to avoid vue-i18n linked-format parsing issues
            address: "42bhamdi\\@gmail.com"
        },
        contact: {
            name: "Me contacter",
            short: "Formulaire de contact ou message direct.",
            url: "mailto:you@example.com",
            qr: "/qr/qr_Contact.png",
            form: {
                nameLabel: "Votre nom",
                emailLabel: "Votre e-mail (optionnel)",
                messageLabel: "Votre message",
                submitLabel: "Envoyer",
                success: "Message envoyé — merci !",
                error: "Erreur lors de l'envoi"
            }
        }
    }
};