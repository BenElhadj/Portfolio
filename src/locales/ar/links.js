export default {
    title: "روابط مفيدة",
    open: "فتح",
    emailMe: "أرسل بريداً إلكترونياً",
    contactMe: "اتصل بي",
    groups: {
        part1: "كود ومشاريع",
        part2: "شبكة مهنية",
        part3: "البريد الإلكتروني",
        part4: "اتصال مباشر"
    },
    items: {
        github: {
            name: "GitHub",
            short: "مشاريعي المفتوحة المصدر ومساهماتي.",
            url: "https://github.com/USERNAME",
            qr: "qr/qr_GitHub.png"
        },
        linkedin: {
            name: "LinkedIn",
            short: "ملفي المهني — السيرة الذاتية والشبكة.",
            url: "https://www.linkedin.com/in/USERNAME",
            qr: "qr/qr_LinkedIn.png"
        },
        email: {
            name: "البريد الإلكتروني",
            short: "أرسل رسالة مباشرة عبر البريد الإلكتروني.",
            qr: "qr/qr_Email.png",
            // store as "42bhamdi[at]gmail.com" and decode in the component
            address: "42bhamdi[at]gmail.com"
        },
        contact: {
            name: "تواصل معي",
            short: "نموذج الاتصال أو رسالة مباشرة.",
            url: "mailto:42bhamdi[at]gmail.com",
            qr: "qr/qr_Contact.png",
            form: {
                nameLabel: "اسمك",
                emailLabel: "بريدك الإلكتروني (اختياري)",
                messageLabel: "رسالتك",
                submitLabel: "إرسال",
                success: "تم إرسال الرسالة — شكراً!",
                error: "خطأ أثناء الإرسال"
            }
        }
    }
};