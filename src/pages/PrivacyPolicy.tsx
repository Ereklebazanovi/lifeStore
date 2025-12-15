//PrivacyPolicy.tsx
import { Lock, Eye, Server, Share2, ShieldCheck, Mail, Phone, Database } from 'lucide-react';
import { SITE_CONFIG, ADMIN_CONFIG } from '../config/constants';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            კონფიდენციალურობის პოლიტიკა
          </h1>
          <p className="text-stone-500 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {/* ✅ სტატიკური თარიღი */}
            ბოლოს განახლდა: 2025 წლის 15 დეკემბერი
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          
          <div className="bg-stone-900 text-white p-6 md:p-8">
            <div className="flex gap-4 items-start">
              <div className="bg-stone-800 p-3 rounded-xl hidden md:block">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">
                  თქვენი მონაცემები დაცულია
                </h2>
                <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                  კეთილი იყოს თქვენი მობრძანება {SITE_CONFIG.SITE_NAME}-ზე. ეს დოკუმენტი განმარტავს, თუ როგორ ვამუშავებთ მხოლოდ იმ ინფორმაციას, რომელიც აუცილებელია თქვენი შეკვეთის შესასრულებლად.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-10">

            {/* 1. ინფორმაციის შეგროვება */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Eye className="w-5 h-5 text-emerald-600" />
                1. რა ინფორმაციას ვაგროვებთ?
              </h3>
              <div className="prose prose-stone text-stone-600 leading-relaxed text-sm md:text-base">
                <p>მომსახურების გასაწევად ჩვენ გვჭირდება მხოლოდ ის მონაცემები, რაც აუცილებელია ნივთის მოსატანად:</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong>საკონტაქტო:</strong> სახელი, გვარი, ტელეფონის ნომერი (კურიერისთვის).</li>
                  <li><strong>მიწოდება:</strong> ფაქტობრივი მისამართი, სადაც გსურთ ამანათის მიღება.</li>
                  <li><strong>შეკვეთის ისტორია:</strong> ინფორმაცია თქვენს მიერ შეძენილი ნივთების შესახებ.</li>
                </ul>
              </div>
            </section>

            {/* 2. გამოყენება */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Server className="w-5 h-5 text-emerald-600" />
                2. მონაცემების გამოყენების მიზანი
              </h3>
              <p className="text-stone-600 mb-3">
                თქვენი მონაცემები გამოიყენება მხოლოდ:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-stone-600 text-sm md:text-base">
                <li>შეკვეთის დასამუშავებლად და ინვოისის მოსამზადებლად.</li>
                <li>კურიერისთვის მისამართის გადასაცემად.</li>
                <li>თქვენთან დასაკავშირებლად, თუ შეკვეთასთან დაკავშირებით კითხვა გაჩნდა.</li>
              </ul>
            </section>

            {/* 3. გაზიარება */}
            <section className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Share2 className="w-5 h-5 text-emerald-600" />
                3. ვის გადაეცემა მონაცემები?
              </h3>
              <p className="text-stone-600 mb-3">
                ჩვენ არ ვყიდით და არ ვასაჯაროებთ თქვენს მონაცემებს. ინფორმაცია გადაეცემა მხოლოდ:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-stone-600">
                <li><strong>საკურიერო კომპანიას:</strong> მხოლოდ სახელი, მისამართი და ტელეფონი (ამანათის ჩასაბარებლად).</li>
                <li><strong>სახელმწიფო უწყებებს:</strong> მხოლოდ კანონით გათვალისწინებულ გამონაკლის შემთხვევებში (მაგალითად, ოფიციალური შემოწმებისას).</li>
              </ul>
            </section>

            {/* 4. ტექნიკური დეტალები */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Database className="w-5 h-5 text-emerald-600" />
                4. ტექნიკური უსაფრთხოება
              </h3>
              <p className="text-stone-600 leading-relaxed">
                ვებგვერდის გამართული მუშაობისთვის (მაგალითად: კალათაში ნივთების დამახსოვრება ან ავტორიზაცია), ჩვენ ვიყენებთ ბრაუზერის მეხსიერებას (Cookies/Local Storage). ეს ტექნოლოგია აუცილებელია იმისთვის, რომ საიტმა შეძლოს თქვენი მომსახურება.
              </p>
            </section>

            {/* 5. მონაცემთა წაშლა */}
            <section>
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                5. თქვენი უფლებები და მონაცემთა წაშლა
              </h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                თქვენ უფლება გაქვთ მოითხოვოთ თქვენი პირადი მონაცემების წაშლა ან შესწორება ნებისმიერ დროს.
              </p>
              <p className="text-stone-600 text-sm italic">
                შენიშვნა: ანგარიშის გაუქმების შემთხვევაში, ინფორმაცია განხორციელებული შეკვეთების (ინვოისების) შესახებ შესაძლოა შენარჩუნდეს შიდა საბუღალტრო მიზნებისთვის.
              </p>
            </section>

            <hr className="border-stone-200" />

            <div className="text-sm text-stone-500 pt-4">
              <p className="font-bold text-stone-900 mb-2">საკონტაქტო ინფორმაცია:</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {ADMIN_CONFIG.BUSINESS_EMAIL}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {ADMIN_CONFIG.BUSINESS_PHONE}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;