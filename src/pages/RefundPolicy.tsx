import {
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { ADMIN_CONFIG, SITE_CONFIG } from "../config/constants";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            თანხის დაბრუნების პოლიტიკა
          </h1>
          <p className="text-stone-500 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {/* ✅ სტატიკური თარიღი */}
            ბოლოს განახლდა: 2025 წლის 15 დეკემბერი
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          {/* Introduction Banner */}
          <div className="bg-emerald-50 p-6 md:p-8 border-b border-emerald-100">
            <div className="flex gap-4 items-start">
              <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-600 hidden md:block">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">
                  გადახდის დაბრუნების პირობები და პროცედურები
                </h2>
                <p className="text-stone-600 leading-relaxed">
                  ეს დოკუმენტი არეგულირებს {SITE_CONFIG.SITE_NAME}-ის ინტერნეტ
                  მაღაზიაში შეძენილი პროდუქციის უკან დაბრუნებისა და თანხის
                  ანაზღაურების პირობებს. გთხოვთ, ყურადღებით გაეცნოთ ქვემოთ
                  მოცემულ პუნქტებს შეკვეთის გაფორმებამდე.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-10">
            {/* Section 1: General Policy */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                დაბრუნების ზოგადი პირობები
              </h3>
              <div className="prose prose-stone text-stone-600 leading-relaxed">
                <p>
                  ჩვენი მიზანია მომხმარებლის მაქსიმალური კმაყოფილება.
                  საქართველოს კანონმდებლობის შესაბამისად, თქვენ გაქვთ უფლება
                  მოითხოვოთ შეძენილი ნივთის დაბრუნება ან გადაცვლა მისი მიღებიდან{" "}
                  <strong>14 კალენდარული დღის</strong> განმავლობაში.
                </p>
                <ul className="mt-4 space-y-2 list-none pl-0">
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>
                      ნივთი უნდა იყოს უხმარი და პირვანდელ მდგომარეობაში.
                    </span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>
                      შენარჩუნებული უნდა იყოს სასაქონლო იერსახე, ეტიკეტი და
                      შეფუთვა.
                    </span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>
                      წარმოდგენილი უნდა იყოს გადახდის დამადასტურებელი ქვითარი
                      (ინვოისი).
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2: Exceptions (Updated with Domino logic) */}
            <section className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                გამონაკლისები და შეზღუდვები
              </h3>
              <p className="text-stone-600 mb-4">
                თანხის დაბრუნება ან ნივთის გადაცვლა{" "}
                <span className="font-bold text-stone-800">არ ხორციელდება</span>{" "}
                შემდეგ შემთხვევებში:
              </p>
              <ul className="space-y-3 text-stone-600">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  ნივთი დაზიანებულია მომხმარებლის მიერ არასწორი ექსპლუატაციის
                  შედეგად.
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  გასულია კანონით დადგენილი 14 დღიანი ვადა.
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  ნივთი განეკუთვნება ჰიგიენურ ან მალფუჭებად კატეგორიას (გარდა
                  ქარხნული წუნისა).
                </li>
                {/* 👇 ახალი პუნქტები Domino-ს მსგავსად */}
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  დეკორატიული და საახალწლო ნივთები (თუ გამოყენების კვალი ემჩნევა).
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  ჭურჭელი და სამზარეულოს ატრიბუტიკა (თუ გამოყენებულია).
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  ინდივიდუალური შეკვეთით დამზადებული პროდუქცია.
                </li>
              </ul>
            </section>

            {/* Section 3: Refund Process */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                💳 თანხის ანაზღაურების პროცედურა
              </h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                ნივთის დაბრუნების დადასტურების შემთხვევაში, თანხა დაგიბრუნდებათ
                იმავე საბანკო ანგარიშზე, საიდანაც მოხდა გადახდა.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border border-stone-200 p-4 rounded-xl">
                  <span className="block text-sm text-stone-400 font-bold uppercase mb-1">
                    დაბრუნების ვადა
                  </span>
                  <span className="text-stone-900 font-medium">
                    ნივთის მიღებიდან 2-5 სამუშაო დღე
                  </span>
                </div>
                <div className="bg-white border border-stone-200 p-4 rounded-xl">
                  <span className="block text-sm text-stone-400 font-bold uppercase mb-1">
                    ტრანსპორტირების ხარჯი
                  </span>
                  <span className="text-stone-900 font-medium">
                    ანაზღაურდება მომხმარებლის მიერ*
                  </span>
                  <p className="text-xs text-stone-400 mt-2 italic">
                    * პროდუქციის დაბრუნების შემთხვევაში პირვანდელი ტრანსპორტირების თანხა უკან არ ბრუნდება.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-stone-100" />

            {/* Footer: Contact Info */}
            <section>
              <h3 className="text-lg font-bold text-stone-900 mb-6">
                დაგვიკავშირდით
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                  <div className="bg-white p-3 rounded-full text-emerald-600 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-bold uppercase">
                      ელ. ფოსტა
                    </p>
                    <a
                      href={`mailto:${ADMIN_CONFIG.BUSINESS_EMAIL}`}
                      className="text-stone-900 font-medium hover:text-emerald-600 transition-colors"
                    >
                      {ADMIN_CONFIG.BUSINESS_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                  <div className="bg-white p-3 rounded-full text-emerald-600 shadow-sm">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-bold uppercase">
                      ტელეფონი
                    </p>
                    <a
                      href={`tel:${ADMIN_CONFIG.BUSINESS_PHONE}`}
                      className="text-stone-900 font-medium hover:text-emerald-600 transition-colors"
                    >
                      {ADMIN_CONFIG.BUSINESS_PHONE}
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;