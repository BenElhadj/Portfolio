export default {
    title: "Useful links",
    // Label for the CV download button/title
    cvLabel: "Download CV (EN)",
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
            url: "https://github.com/BenElhadj",
            qr: "qr/qr_GitHub.webp"
        },
        linkedin: {
            name: "LinkedIn",
            short: "My professional profile — CV & network.",
            url: "https://www.linkedin.com/in/benelhadjhamdi/",
            qr: "qr/qr_LinkedIn.webp"
        },
        email: {
            name: "Email",
            short: "Send me a message directly by email.",
            qr: "qr/qr_Email.webp",
            // store as "42bhamdi[at]gmail.com" and decode in the component
            address: "42bhamdi[at]gmail.com"
        },
        contact: {
            name: "Contact me",
            short: "Contact form or direct message.",
            url: "mailto:42bhamdi[at]gmail.com",
            qr: "qr/qr_Contact.webp",
            form: {
                nameLabel: "Your name",
                emailLabel: "Your email (optional)",
                messageLabel: "Your message",
                subjectLabel: "Subject (optional)",
                missingSubject: "No subject",
                missingName: "No name",
                missingEmail: "No email",
                optionalHint: "optional",
                requiredHint: "required",
                attachLabel: "Attach files (optional)",
                attachLimitWarning: "Email limit (~50KB) exceeded: files won't be attached. File names will be included in the message.",
                removeAttachment: "Remove attachment",
                submitLabel: "Send",
                success: "Message sent — thank you!",
                error: "Error while sending"
            }
        }
    }
};