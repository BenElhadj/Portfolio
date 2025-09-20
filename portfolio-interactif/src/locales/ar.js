// ar.js
export default {
  navbar: {
    timeline: "السيرة الزمنية",
    diplomas: "الشهادات",
    experiences: "الخبرات",
    skills: "المهارات التقنية",
    softSkills: "المهارات السلوكية",
    projects: "المشاريع",
    links: "روابط مفيدة",
  },
  diplomas: {
    title: "الشهادات",
    list: [
      {
        period: "2016 - 2023",
        institution: "مدرسة 42 — باريس",
        degree: "مهندس خبير في الحوسبة هندسة تكنولوجيا المعلومات: هندسة تكنولوجيا المعلومات و قواعد البيانات"
      },
      {
        period: "2017 - 2019",
        institution: "GRETA — باريس",
        degree: "مؤهل تقني سامي في الأنظمة الرقمية و المعلوماتية و الشبكات"
      },
      {
        period: "2011 - 2013",
        institution: "CSFIEE — تونس",
        degree: "مؤهل تقني سامي في الإنتاج الإلكتروني"
      },
      {
        period: "2006 - 2008",
        institution: "CSFIEE — تونس",
        degree: "مؤهل تقني مهني في تصنيع الإلكتروني"
      },
      {
        period: "2003 - 2005",
        institution: "IPH — تونس",
        degree: "مؤهل تقني مهني في صيانة الحاسوب"
      }
    ]
  },
  experiences: {
    title: "الخبرات",
    yearsLabel: "سنوات خبرة",
    list: [
      {
        title: "التطوير",
        years: 4,
        experiences: [
          {
            dates: "2024 – الآن",
            company: "عمل حر",
            role: "مطور ذكاء اصطناعي / تعلم آلي",
            details: [
              "مشاريع الذكاء الاصطناعي: تصنيف الصور / البيانات، كشف الشذوذ",
              "الشبكات العصبية، معالجة اللغة الطبيعية (NLP)، التعلم المراقب وغير المراقب",
              "التقنيات: Python، NumPy، Pandas، Scikit-learn، TensorFlow، OpenCV"
            ]
          },
          {
            dates: "2022 – 2023",
            company: "KEAKR",
            role: "مطور Full Stack",
            details: [
              "صيانة وتحسين تطبيق وموقع ويب (Vue.js، C#)",
              "إعداد التكامل المستمر / النشر المستمر (CI/CD) باستخدام Jenkins",
              "المشاركة في منصة Web3 (NFTs)"
            ]
          },
          {
            dates: "2019 – 2020",
            company: "معهد الدماغ والحبل الشوكي (ICM)",
            role: "مطور تطبيقات موبايل",
            details: [
              "تصميم وتطوير تطبيق CONNECT (مخصص لمرضى السكتة الدماغية)",
              "تعاون مع مستشفى بريست الجامعي، مستشفى Pitié-Salpêtrière ومدرسة 42"
            ]
          },
          {
            dates: "2019",
            company: "Multiserv Plus",
            role: "متدرب مطور ويب",
            details: [
              "إنشاء موقع تجارة إلكترونية للأفلام",
              "العمل على قاعدة البيانات وواجهة المستخدم"
            ]
          }
        ]
      },
      {
        title: "فني وصيانة الحواسيب",
        years: 8,
        experiences: [
          {
            dates: "2020 – 2021",
            company: "AP-HP (مستشفى شارل فوا)",
            role: "فني دعم ميداني",
            details: ["إدارة أجهزة الحاسوب في المستشفى", "صيانة الأنظمة والشبكات"]
          },
          {
            dates: "2018 – 2020",
            company: "DIM، LVMH، CHANEL",
            role: "فني دعم VIP / لوجستي (بعثات HELPLINE)",
            details: [
              "دعم المستخدمين VIP",
              "إعداد الحواسيب والهواتف الذكية (Masterisation)",
              "إدارة أصول تكنولوجيا المعلومات"
            ]
          },
          {
            dates: "2017 – 2018",
            company: "Parkeon",
            role: "فني ميداني",
            details: [
              "صيانة محطات التذاكر الإلكترونية",
              "الشبكات، الإلكترونيات، الميكانيك"
            ]
          },
          {
            dates: "2016",
            company: "Solutions30، Fnac",
            role: "فني صيانة",
            details: [
              "صيانة الأجهزة والبرمجيات",
              "دعم فني متنقل (SAV)"
            ]
          },
          {
            dates: "2010 – 2014",
            company: "Global Info (تونس)",
            role: "مدير وفني",
            details: [
              "تجميع وإصلاح الحواسيب",
              "البيع وخدمات ما بعد البيع",
              "تركيب الطابعات والماسحات الضوئية وآلات النسخ"
            ]
          },
          {
            dates: "2007 – 2013",
            company: "تدريبات مختلفة (STIE، TRANSTU، Retronix، Sagemcom، Microlux، Tekne)",
            role: "فني إلكترونيات / صيانة",
            details: [
              "تجميع وإصلاح الحواسيب",
              "صيانة صناعية وإلكترونية",
              "إنتاج إلكتروني وأسلاك (Câblage)"
            ]
          }
        ]
      }
    ]
  },
  skills: {
    title: "المهارات التقنية",
    labels: {
      level: "المستوى",
      details: "التفاصيل",
      years: "الخبرة",
      yearsUnit: "سنة",
      link: "عرض المشروع",
    },
    groups: {
      frontend: "واجهة المستخدم",
      backend: "الخلفية",
      devops: "DevOps",
      tools: "أدوات أخرى",
    },
    items: {
      vue: { name: "Vue.js", level: "إتقان", info: "مستخدم في محفظتي التفاعلية والعديد من مشاريع الويب." },
      html: { name: "HTML5", level: "إتقان", info: "أساس جميع مشاريع الويب الخاصة بي." },
      svelte: { name: "Svelte", level: "متوسط", info: "مستخدم في مشاريع تجريبية." },
      css: { name: "CSS3", level: "إتقان", info: "تصميم متجاوب وتأثيرات بصرية." },
      javascript: { name: "JavaScript", level: "إتقان", info: "اللغة الأساسية في مسيرتي." },
      reactnative: { name: "React Native", level: "متقدم", info: "تطوير تطبيقات موبايل طبية وموسيقية." },
      php: { name: "PHP", level: "إتقان", info: "مستخدم لموقع تجارة إلكترونية." },
      node: { name: "Node.js", level: "متقدم", info: "مستخدم في مشاريع Full-Stack وواجهات API REST." },
      python: { name: "Python", level: "متقدم", info: "مستخدم للذكاء الاصطناعي وعلوم البيانات." },
      java: { name: "Java", level: "متوسط", info: "خبرة أكاديمية ومشاريع Android." },
      arangodb: { name: "ArangoDB", level: "إتقان", info: "قاعدة بيانات NoSQL لمشاريع معقدة." },
      mysql: { name: "MySQL", level: "متقدم", info: "مستخدم في عدة مشاريع ويب ومدرسية." },
      mongodb: { name: "MongoDB", level: "متقدم", info: "مستخدم في عدة مشاريع Full-Stack." },
      git: { name: "Git", level: "إتقان", info: "مستخدم يوميًا (GitHub، GitLab)." },
      docker: { name: "Docker", level: "متقدم", info: "إعداد بيئات التطوير." },
      jenkins: { name: "Jenkins", level: "متوسط", info: "مستخدم في CI/CD." },
      ad: { name: "Active Directory", level: "إتقان", info: "إدارة المستخدمين والخوادم." },
      powershell: { name: "PowerShell", level: "متقدم", info: "سكربتات أتمتة تقنية المعلومات." },
      cisco: { name: "VOIP / Cisco", level: "متقدم", info: "إدارة الشبكات والهاتف." },
      bash: { name: "Bash", level: "متقدم", info: "مستخدم في مشاريع Linux." },
      c: { name: "C", level: "إتقان", info: "لغة تم تعلمها في 42 للبرمجة منخفضة المستوى." },
      cpp: { name: "C++", level: "إتقان", info: "خبرة أكاديمية ومشاريع شخصية." },
      csharp: { name: "C#", level: "إتقان", info: "مشاريع سطح المكتب والاختبارات." },
      vscode: { name: "VS Code", level: "إتقان", info: "بيئة تطوير رئيسية." },
      visualstudio: { name: "Visual Studio", level: "إتقان", info: "بيئة تطوير لمشاريع سطح المكتب." },
      intellij: { name: "IntelliJ", level: "متقدم", info: "مستخدم لمشاريع Java." },
      photoshop: { name: "Photoshop", level: "متوسط", info: "تحرير الرسومات." },
      illustrator: { name: "Illustrator", level: "متوسط", info: "إنشاء تصاميم بصرية." },
      qt: { name: "Qt Creator", level: "متوسط", info: "مشاريع أكاديمية." },
      blender: { name: "Blender", level: "متوسط", info: "مشاريع ثلاثية الأبعاد شخصية." },
      unreal: { name: "Unreal Engine", level: "متوسط", info: "تم استكشافه للنمذجة الأولية." },
      ios: { name: "iOS", level: "متقدم", info: "تطوير تطبيقات الموبايل." },
      android: { name: "Android", level: "متقدم", info: "تطوير تطبيقات الموبايل." },
      macos: { name: "MacOS", level: "متقدم", info: "استخدام يومي." },
      windows: { name: "Windows", level: "إتقان", info: "نظام التشغيل الرئيسي لصيانة تكنولوجيا المعلومات." },
      linux: { name: "Linux", level: "متقدم", info: "مستخدم للخوادم والتطوير." },
      virtualbox: { name: "VirtualBox", level: "متقدم", info: "اختبار الأنظمة والبيئات الافتراضية." },
    },
  },
  softSkills: {
    title: "المهارات السلوكية",
  },
  projects: {
    title: "المشاريع",
  },
  links: {
    title: "روابط مفيدة",
  },
};
