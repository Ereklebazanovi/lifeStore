import React from 'react';
import { FileText, Truck, ShieldAlert, CreditCard, Scale, Lock, Info } from 'lucide-react';
import { SITE_CONFIG, ADMIN_CONFIG } from '../config/constants';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            წესები და პირობები
          </h1>
          <p className="text-stone-500 flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            {/* ✅ სტატიკური თარიღი */}
            ბოლოს განახლდა: 2025 წლის 15 დეკემბერი
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          
          {/* Intro Banner */}
          <div className="bg-stone-900 text-white p-6 md:p-8">
            <h2 className="text-xl font-bold mb-2">
              მომსახურების პირობები
            </h2>
            <p className="text-stone-300 leading-relaxed text-sm md:text-base">
              კეთილი იყოს თქვენი მობრძანება {SITE_CONFIG.SITE_NAME}-ზე. ეს დოკუმენტი წარმოადგენს იურიდიულ შეთანხმებას თქვენსა და {SITE_CONFIG.SITE_NAME}-ს შორის. ვებგვერდის გამოყენებით, პროდუქციის დათვალიერებით ან შეძენით, თქვენ ეთანხმებით ამ წესებს.
            </p>
          </div>

          <div className="p-6 md:p-10 space-y-10">

            {/* 1. ზოგადი დებულებები და ქცევა */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                1. მომხმარებლის ვალდებულებები და ქცევა
              </h3>
              <div className="prose prose-stone text-stone-600 leading-relaxed text-sm md:text-base">
                <p>მომხმარებელი ვალდებულია დაიცვას კეთილსინდისიერების პრინციპები ვებგვერდით სარგებლობისას. კატეგორიულად აკრძალულია:</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong>ყალბი ინფორმაციის მიწოდება:</strong> შეკვეთის გაფორმებისას სხვისი პერსონალური მონაცემების, მისამართის ან საკონტაქტო ინფორმაციის გამოყენება.</li>
                  <li><strong>სისტემური მანიპულაცია:</strong> ვებგვერდის უსაფრთხოების სისტემების გვერდის ავლის მცდელობა, მონაცემთა ავტომატური შეგროვება (Scraping) ან სერვერზე კიბერშეტევა.</li>
                  <li><strong>არაკეთილსინდისიერი შეკვეთა:</strong> პროდუქციის შეკვეთა შეძენის განზრახვის გარეშე (ე.წ. "ყალბი შეკვეთები"), რაც აფერხებს კომპანიის საქმიანობას.</li>
                </ul>
              </div>
            </section>

   {/* 5. დაბრუნების პოლიტიკა */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Info className="w-5 h-5 text-emerald-600" />
                2. დაბრუნების და გაცვლის პირობები
              </h3>
              <p className="text-stone-600 leading-relaxed">
                საქართველოს კანონმდებლობის შესაბამისად, მომხმარებელს უფლება აქვს დააბრუნოს შეძენილი ნივთი 14 დღის განმავლობაში. დაბრუნების დეტალური პირობები, გამონაკლისები და პროცედურები გაწერილია ჩვენს 
                <Link to="/refund-policy" className="text-emerald-600 font-bold hover:underline mx-1">
                  თანხის დაბრუნების პოლიტიკაში
                </Link>,
                რომელიც წარმოადგენს ამ ხელშეკრულების განუყოფელ ნაწილს.
              </p>
            </section>

           

          {/* 3. გადახდა და ანგარიშსწორება */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                3. გადახდა და ანგარიშსწორება
              </h3>
              <div className="text-stone-600 space-y-3">
                <p>
                  ჩვენთან მოქმედებს ანგარიშსწორების მოქნილი სისტემა. მომხმარებელს შეუძლია აირჩიოს მისთვის სასურველი მეთოდი:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>ადგილზე გადახდა:</strong> თანხის გადახდა კურიერთან, ნივთის ჩაბარებისას (ნაღდი ანგარიშსწორებით).</li>
                  <li><strong>ონლაინ გადახდა:</strong> Visa / Mastercard ბარათებით საიტზევე (დაცული საბანკო არხებით).</li>
                  <li>შეკვეთა ითვლება მიღებულად დადასტურების შეტყობინების (ელ-ფოსტის ან SMS) მიღების შემდეგ.</li>
                </ul>
              </div>
            </section>

            {/* 4. მიწოდების სერვისი */}
            <section className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Truck className="w-5 h-5 text-emerald-600" />
                4. მიწოდების სერვისი
              </h3>
              <div className="text-stone-600 space-y-3">
                <p>
                  კომპანია უზრუნველყოფს პროდუქციის მიწოდებას საქართველოს მასშტაბით პარტნიორი საკურიერო კომპანიების მეშვეობით.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>ვადები:</strong> სტანდარტული მიწოდების ვადა შეადგენს 2-5 სამუშაო დღეს, რეგიონის მიხედვით.</li>
                  <li><strong>მისამართი:</strong> მომხმარებელი პასუხისმგებელია მისამართისა და საკონტაქტო ნომრის სისწორეზე. არასწორი მონაცემების გამო შეფერხებულ მიწოდებაზე კომპანია პასუხს არ აგებს.</li>
                  <li><strong>მიღება:</strong> ნივთის ჩაბარებისას მომხმარებელი ვალდებულია ვიზუალურად დაათვალიეროს შეფუთვა.</li>
                </ul>
              </div>
            </section>

          {/* 5. ინტელექტუალური საკუთრება */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Lock className="w-5 h-5 text-emerald-600" />
                5. ინტელექტუალური საკუთრება
              </h3>
              <p className="text-stone-600 leading-relaxed">
                ვებგვერდზე განთავსებული ვიზუალური მასალა, პროდუქციის აღწერილობები, ლოგო, დიზაინი და პროგრამული კოდი წარმოადგენს {SITE_CONFIG.SITE_NAME}-ის ინტელექტუალურ საკუთრებას. აკრძალულია აღნიშნული მასალების გამოყენება კომერციული მიზნებისთვის კომპანიის წერილობითი ნებართვის გარეშე.
              </p>
            </section>

            {/* 6. პასუხისმგებლობის შეზღუდვა */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Scale className="w-5 h-5 text-emerald-600" />
                6. პასუხისმგებლობის შეზღუდვა
              </h3>
              <p className="text-stone-600 leading-relaxed">
                {SITE_CONFIG.SITE_NAME} არ აგებს პასუხს ზარალზე, რომელიც გამოწვეულია პროდუქციის არადანიშნულებისამებრ გამოყენებით. ასევე, კომპანია არ არის პასუხისმგებელი შეფერხებებზე, რომლებიც გამოწვეულია ფორს-მაჟორული სიტუაციებით (სტიქია, პანდემია, საომარი მოქმედებები და სხვა).
              </p>
            </section>

            {/* 7. დასკვნითი დებულებები */}
            <section>
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                7. დავების გადაწყვეტა
              </h3>
              <p className="text-stone-600 leading-relaxed">
                წინამდებარე პირობები რეგულირდება საქართველოს მოქმედი კანონმდებლობით. მხარეთა შორის წარმოშობილი ნებისმიერი დავა წყდება ურთიერთმოლაპარაკების გზით. შეთანხმების მიუღწევლობის შემთხვევაში, დავა განიხილება საქართველოს საერთო სასამართლოების მიერ.
              </p>
            </section>

            <hr className="border-stone-200" />

            <div className="text-sm text-stone-500">
              <p>საკონტაქტო ინფორმაცია:</p>
              <p>ელ-ფოსტა: {ADMIN_CONFIG.BUSINESS_EMAIL}</p>
              <p>ტელეფონი: {ADMIN_CONFIG.BUSINESS_PHONE}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;