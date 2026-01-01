export default {
    title: "Liens utiles",
    // Label for the CV download button/title
    cvLabel: "Télécharger le CV (FR)",
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
            qr: "qr/qr_GitHub.png"
        },
        linkedin: {
            name: "LinkedIn",
            short: "Mon profil professionnel — CV et réseau.",
            url: "https://www.linkedin.com/in/benelhadjhamdi/",
            qr: "qr/qr_LinkedIn.png"
        },
        email: {
            name: "Email",
            short: "Envoyez-moi directement un message par e-mail.",
            qr: "qr/qr_Email.png",
            // store as "42bhamdi[at]gmail.com" and decode in the component
            address: "42bhamdi[at]gmail.com"
        },
        contact: {
            name: "Me contacter",
            short: "Formulaire de contact ou message direct.",
            url: "mailto:42bhamdi[at]gmail.com",
            qr: "qr/qr_Contact.png",
            form: {
                nameLabel: "Votre nom",
                emailLabel: "Votre e-mail (optionnel)",
                messageLabel: "Votre message",
                subjectLabel: "Objet (optionnel)",
                missingSubject: "Sans objet",
                missingName: "Sans nom",
                missingEmail: "Sans email",
                optionalHint: "optionnel",
                requiredHint: "obligatoire",
                attachLabel: "Joindre des fichiers (optionnel)",
                attachLimitWarning: "Limite Email (≈ 50KB) dépassée : les fichiers ne seront pas joints. Les noms seront inclus dans le message.",
                removeAttachment: "Supprimer la pièce jointe",
                submitLabel: "Envoyer",
                success: "Message envoyé — merci !",
                error: "Erreur lors de l'envoi"
            }
        }
    }
};