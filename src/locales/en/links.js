export default {
    title: "Useful links",
    open: "Open",
    emailMe: "Send email",
    contactMe: "Contact",
    groups: {
        part1: "Code & Projects",
        part2: "Professional network",
        part3: "Email",
        part4: "Direct contact"
    },
    items: {
        github: {
            name: "GitHub",
            short: "My open-source projects and contributions.",
            url: "https://github.com/USERNAME",
            qr: "qr/qr_GitHub.png"
        },
        linkedin: {
            name: "LinkedIn",
            short: "My professional profile — CV & network.",
            url: "https://www.linkedin.com/in/USERNAME",
            qr: "qr/qr_LinkedIn.png"
        },
        email: {
            name: "Email",
            short: "Send me a message directly by email.",
            qr: "qr/qr_Email.png",
            // store as "42bhamdi[at]gmail.com" and decode in the component
            address: "42bhamdi[at]gmail.com"
        },
        contact: {
            name: "Contact me",
            short: "Contact form or direct message.",
            url: "mailto:42bhamdi[at]gmail.com",
            qr: "qr/qr_Contact.png",
            form: {
                nameLabel: "Your name",
                emailLabel: "Your email (optional)",
                messageLabel: "Your message",
                submitLabel: "Send",
                success: "Message sent — thank you!",
                error: "Error while sending"
            }
        }
    }
};