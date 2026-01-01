export default {
    title: "روابط مفيدة",
    // Label for the CV download button/title
    cvLabel: "تحميل السيرة الذاتية (EN)",
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
                subjectLabel: "الموضوع (اختياري)",
                missingSubject: "بدون موضوع",
                missingName: "بدون اسم",
                missingEmail: "بدون بريد إلكتروني",
                optionalHint: "اختياري",
                requiredHint: "إلزامي",
                attachLabel: "إرفاق ملفات (اختياري)",
                attachLimitWarning: "تم تجاوز حد Email (≈ 50KB): لن تُرفق الملفات. ستُدرج أسماء الملفات داخل الرسالة.",
                removeAttachment: "إزالة المرفق",
                submitLabel: "إرسال",
                success: "تم إرسال الرسالة — شكراً!",
                error: "خطأ أثناء الإرسال"
            }
        }
    }
};