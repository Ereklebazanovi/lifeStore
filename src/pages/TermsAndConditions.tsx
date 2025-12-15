import React from 'react';
import { 
  FileText, Truck, ShieldAlert, CreditCard, Scale, Lock, Info, 
  ShieldCheck, RefreshCw, AlertCircle, Phone, Mail, Eye, Server, Share2, Database,
  CheckCircle2
} from 'lucide-react';
import { SITE_CONFIG, ADMIN_CONFIG } from '../config/constants';

const TermsAndConditions = () => {
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            სამართლებრივი დოკუმენტაცია
          </h1>
          <p className="text-stone-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            ბოლოს განახლდა: 2025 წლის 15 დეკემბერი
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 sticky top-4 z-10 bg-stone-50/90 backdrop-blur-sm p-2 rounded-2xl shadow-sm border border-stone-200">
          <button 
            onClick={() => scrollToSection('terms')}
            className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            📜 წესები და პირობები
          </button>
          <button 
            onClick={() => scrollToSection('refund')}
            className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            💸 თანხის დაბრუნება
          </button>
          <button 
            onClick={() => scrollToSection('privacy')}
            className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            🔒 კონფიდენციალურობა
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden divide-y divide-stone-100">
          
          {/* 1. TERMS & CONDITIONS */}
          <div id="terms" className="scroll-mt-24">
            <div className="bg-stone-900 text-white p-6 md:p-8">
               <h2 className="text-xl font-bold mb-2">მომსახურების პირობები</h2>
               <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                კეთილი იყოს თქვენი მობრძანება {SITE_CONFIG.SITE_NAME}-ზე. ეს დოკუმენტი წარმოადგენს იურიდიულ შეთანხმებას თქვენსა და {SITE_CONFIG.SITE_NAME}-ს შორის. ვებგვერდის გამოყენებით, პროდუქციის დათვალიერებით ან შეძენით, თქვენ ეთანხმებით ამ წესებს.
               </p>
            </div>

            <div className="p-6 md:p-10 space-y-10">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  1. მომხმარებლის ვალდებულებები და ქცევა
                </h3>
                <div className="prose prose-stone text-stone-600 leading-relaxed text-sm md:text-base">
                  <p>მომხმარებელი ვალდებულია დაიცვას კეთილსინდისიერების პრინციპები ვებგვერდით სარგებლობისას. კატეგორიულად აკრძალულია:</p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li><strong>ყალბი ინფორმაციის მიწოდება:</strong> შეკვეთის გაფორმებისას სხვისი პერსონალური მონაცემების, მისამართის ან საკონტაქტო ინფორმაციის გამოყენება.</li>
                    <li><strong>სისტემური მანიპულაცია:</strong> ვებგვერდის უსაფრთხოების სისტემების გვერდის ავლის მცდელობა.</li>
                    <li><strong>არაკეთილსინდისიერი შეკვეთა:</strong> პროდუქციის შეკვეთა შეძენის განზრახვის გარეშე (ე.წ. "ყალბი შეკვეთები"), რაც აფერხებს კომპანიის საქმიანობას.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  2. ინტელექტუალური საკუთრება
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  ვებგვერდზე განთავსებული ვიზუალური მასალა, პროდუქციის აღწერილობები და ლოგო წარმოადგენს {SITE_CONFIG.SITE_NAME}-ის ინტელექტუალურ საკუთრებას.
                </p>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  3. გადახდა და ანგარიშსწორება
                </h3>
                <div className="text-stone-600 space-y-3">
                  <p>ჩვენთან მოქმედებს ანგარიშსწორების მოქნილი სისტემა:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>ადგილზე გადახდა:</strong> თანხის გადახდა კურიერთან (ნაღდი/ბარათი).</li>
                    <li><strong>ონლაინ გადახდა:</strong> Visa / Mastercard ბარათებით.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  4. მიწოდების სერვისი
                </h3>
                <div className="text-stone-600 space-y-3">
                  <p>კომპანია უზრუნველყოფს პროდუქციის მიწოდებას საქართველოს მასშტაბით.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>ვადები:</strong> სტანდარტული მიწოდების ვადა შეადგენს 2-5 სამუშაო დღეს.</li>
                    <li><strong>მისამართი:</strong> მომხმარებელი პასუხისმგებელია მისამართის სისწორეზე.</li>
                    <li><strong>მიღება:</strong> ნივთის ჩაბარებისას მომხმარებელი ვალდებულია ვიზუალურად დაათვალიეროს შეფუთვა.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Info className="w-5 h-5 text-emerald-600" />
                  5. დაბრუნების და გაცვლის პირობები
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  საქართველოს კანონმდებლობის შესაბამისად, მომხმარებელს უფლება აქვს დააბრუნოს შეძენილი ნივთი 14 დღის განმავლობაში. დეტალური პირობები იხილეთ ქვემოთ.
                </p>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  6. პასუხისმგებლობის შეზღუდვა
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {SITE_CONFIG.SITE_NAME} არ აგებს პასუხს ზარალზე, რომელიც გამოწვეულია პროდუქციის არადანიშნულებისამებრ გამოყენებით.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-stone-900 mb-4">
                  7. დავების გადაწყვეტა
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  წინამდებარე პირობები რეგულირდება საქართველოს მოქმედი კანონმდებლობით. დავა წყდება ურთიერთმოლაპარაკების გზით, ან საქართველოს სასამართლოში.
                </p>
              </section>
            </div>
          </div>

          {/* 2. REFUND POLICY (Domino-ს დამატებებით) */}
          <div id="refund" className="scroll-mt-24">
             <div className="bg-emerald-50 p-6 md:p-8 border-t border-b border-emerald-100">
               <div className="flex gap-4 items-start">
                 <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-600 hidden md:block">
                   <ShieldCheck className="w-8 h-8" />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-stone-900 mb-2">
                     გადახდის დაბრუნების პირობები
                   </h2>
                   <p className="text-stone-600 leading-relaxed">
                     ეს დოკუმენტი არეგულირებს {SITE_CONFIG.SITE_NAME}-ის ინტერნეტ მაღაზიაში შეძენილი პროდუქციის უკან დაბრუნების პირობებს.
                   </p>
                 </div>
               </div>
            </div>

            <div className="p-6 md:p-10 space-y-10">
               <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <RefreshCw className="w-5 h-5 text-emerald-600" />
                  დაბრუნების ზოგადი პირობები
                </h3>
                <div className="prose prose-stone text-stone-600 leading-relaxed">
                  <p>
                    საქართველოს კანონმდებლობის შესაბამისად, თქვენ გაქვთ უფლება მოითხოვოთ შეძენილი ნივთის დაბრუნება მისი მიღებიდან <strong>14 კალენდარული დღის</strong> განმავლობაში.
                  </p>
                  <ul className="mt-4 space-y-2 list-none pl-0">
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>ნივთი უნდა იყოს უხმარი და პირვანდელ მდგომარეობაში.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>შენარჩუნებული უნდა იყოს სასაქონლო იერსახე, ეტიკეტი და შეფუთვა.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>წარმოდგენილი უნდა იყოს გადახდის დამადასტურებელი ქვითარი.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* ✅ აქ დავამატეთ Domino-ს პუნქტები */}
              <section className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  გამონაკლისები (რა არ ბრუნდება)
                </h3>
                <p className="text-stone-600 mb-4">
                  თანხის დაბრუნება ან ნივთის გადაცვლა <span className="font-bold text-stone-800">არ ხორციელდება</span> შემდეგ შემთხვევებში:
                </p>
                <ul className="space-y-3 text-stone-600 text-sm md:text-base">
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    ნივთი დაზიანებულია მომხმარებლის მიერ.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    გასულია კანონით დადგენილი 14 დღიანი ვადა.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    ნივთი განეკუთვნება ჰიგიენურ კატეგორიას (გახსნილი შეფუთვით).
                  </li>
                  {/* 👇 Domino Inspired Points */}
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    დეკორატიული და საახალწლო ნივთები (თუ გამოყენების კვალი ემჩნევა).
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    ჭურჭელი და სამზარეულოს ატრიბუტიკა (გამოყენებული).
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    ინდივიდუალური შეკვეთით დამზადებული  პროდუქცია.
                  </li>
                </ul>
              </section>

               <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                   💳 თანხის ანაზღაურების პროცედურა
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-stone-200 p-4 rounded-xl">
                    <span className="block text-sm text-stone-400 font-bold uppercase mb-1">დაბრუნების ვადა</span>
                    <span className="text-stone-900 font-medium">ნივთის მიღებიდან 2-5 სამუშაო დღე</span>
                  </div>
                  <div className="bg-white border border-stone-200 p-4 rounded-xl">
                    <span className="block text-sm text-stone-400 font-bold uppercase mb-1">ტრანსპორტირება</span>
                    <span className="text-stone-900 font-medium">ანაზღაურდება მომხმარებლის მიერ*</span>
                    <p className="text-xs text-stone-400 mt-2">
                      * პროდუქციის დაბრუნების შემთხვევაში პირვანდელი ტრანსპორტირების თანხა უკან არ ბრუნდება.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* 3. PRIVACY POLICY */}
          <div id="privacy" className="scroll-mt-24">
             <div className="bg-stone-900 text-white p-6 md:p-8">
               <div className="flex gap-4 items-start">
                 <div className="bg-stone-800 p-3 rounded-xl hidden md:block">
                   <ShieldCheck className="w-8 h-8 text-emerald-500" />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold mb-2">თქვენი მონაცემები დაცულია</h2>
                   <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                     კეთილი იყოს თქვენი მობრძანება {SITE_CONFIG.SITE_NAME}-ზე. ეს დოკუმენტი განმარტავს, თუ როგორ ვამუშავებთ თქვენს პირად ინფორმაციას.
                   </p>
                 </div>
               </div>
            </div>

            <div className="p-6 md:p-10 space-y-10">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Eye className="w-5 h-5 text-emerald-600" />
                  1. რა ინფორმაციას ვაგროვებთ?
                </h3>
                <div className="prose prose-stone text-stone-600 leading-relaxed text-sm md:text-base">
                  <p>მომსახურების გასაწევად ჩვენ გვჭირდება მხოლოდ:</p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li><strong>საკონტაქტო:</strong> სახელი, გვარი, ტელეფონის ნომერი (კურიერისთვის).</li>
                    <li><strong>მიწოდება:</strong> ფაქტობრივი მისამართი.</li>
                    <li><strong>ისტორია:</strong> ინფორმაცია შეძენილი ნივთების შესახებ.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Server className="w-5 h-5 text-emerald-600" />
                  2. მონაცემების გამოყენების მიზანი
                </h3>
                <p className="text-stone-600 mb-3">თქვენი მონაცემები გამოიყენება მხოლოდ:</p>
                <ul className="list-disc pl-5 space-y-2 text-stone-600 text-sm md:text-base">
                  <li>შეკვეთის დასამუშავებლად და ინვოისის მოსამზადებლად.</li>
                  <li>კურიერისთვის მისამართის გადასაცემად.</li>
                  <li>თქვენთან დასაკავშირებლად.</li>
                </ul>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  3. ვის გადაეცემა მონაცემები?
                </h3>
                <p className="text-stone-600 mb-3">ინფორმაცია გადაეცემა მხოლოდ:</p>
                <ul className="list-disc pl-5 space-y-2 text-stone-600">
                  <li><strong>საკურიერო კომპანიას:</strong> მხოლოდ სახელი, მისამართი და ტელეფონი.</li>
                  <li><strong>სახელმწიფო უწყებებს:</strong> მხოლოდ კანონით გათვალისწინებულ გამონაკლის შემთხვევებში.</li>
                </ul>
              </section>
              
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Database className="w-5 h-5 text-emerald-600" />
                  4. ტექნიკური უსაფრთხოება
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  ვებგვერდის გამართული მუშაობისთვის, ჩვენ ვიყენებთ ბრაუზერის მეხსიერებას (Cookies/Local Storage). ეს აუცილებელია იმისთვის, რომ საიტმა შეძლოს თქვენი მომსახურება.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-stone-900 mb-4">
                  5. თქვენი უფლებები და მონაცემთა წაშლა
                </h3>
                <p className="text-stone-600 leading-relaxed mb-4">
                  თქვენ უფლება გაქვთ მოითხოვოთ თქვენი პირადი მონაცემების წაშლა ნებისმიერ დროს.
                </p>
                <p className="text-stone-600 text-sm italic">
                  შენიშვნა: ინფორმაცია განხორციელებული შეკვეთების (ინვოისების) შესახებ ინახება შიდა საბუღალტრო მიზნებისთვის.
                </p>
              </section>
            </div>
          </div>

          {/* Contact Footer */}
          <div className="bg-stone-900 text-stone-400 p-8 text-sm">
            <p className="font-bold text-white mb-4 text-lg">დაგვიკავშირდით:</p>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                   <Mail className="w-4 h-4 text-emerald-400" /> 
                </div>
                <a href={`mailto:${ADMIN_CONFIG.BUSINESS_EMAIL}`} className="hover:text-white transition-colors">{ADMIN_CONFIG.BUSINESS_EMAIL}</a>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                   <Phone className="w-4 h-4 text-emerald-400" /> 
                </div>
                <a href={`tel:${ADMIN_CONFIG.BUSINESS_PHONE}`} className="hover:text-white transition-colors">{ADMIN_CONFIG.BUSINESS_PHONE}</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;