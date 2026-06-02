// scripts/update-category-seo.mjs
// One-time script: writes seoContent / seoContentEn / seoContentRu into the
// `categories` collection. Matches documents by `slug` (no doc IDs needed).
//
// Run from project root:   node scripts/update-category-seo.mjs
// Requires ./serviceAccountKey.json (see instructions in chat).

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ─────────────────────────────────────────────────────────────────────────────
// slug → SEO content (ka / en / ru). HTML hierarchy preserved across languages.
// ⚠️ Confirm each `slug` matches your Firestore (the script prints them on run).
// ─────────────────────────────────────────────────────────────────────────────
const ENTRIES = [
  {
    slug: "sapureebi",
    seoContent: `<h2>რატომ არის მნიშვნელოვანი ხარისხიანი საპურის შერჩევა?</h2>
<p>სწორად შერჩეული საპურე არ არის მხოლოდ სამზარეულოს დეკორაცია — ის პურის სიახლის შენარჩუნების მთავარი პირობაა. ხარისხიანი მასალა ბუნებრივად არეგულირებს ტენიანობას, რაც ხელს უშლის პურის გამოშრობას ან ობის გაჩენას. ღია სივრცეში ან პოლიეთილენის პარკში შენახული პური მალე კარგავს გემოვნურ თვისებებს, ხოლო საპურეში ის ინარჩუნებს რბილ ტექსტურას და არომატს.</p>
<h2>როგორ ავირჩიოთ საუკეთესო მოდელი?</h2>
<ul>
<li><strong>მასალა:</strong> ხის და ბამბუკის მოდელები საუკეთესოდ "სუნთქავენ", ხოლო მეტალის საპურეები იდეალურია თანამედროვე ინტერიერისთვის.</li>
<li><strong>ვენტილაცია:</strong> დარწმუნდით, რომ მოდელს აქვს ჰაერის მიმოქცევის სისტემა.</li>
<li><strong>მოცულობა:</strong> შეარჩიეთ ზომა თქვენი ოჯახის ყოველდღიური მოხმარებიდან გამომდინარე, რათა შიგნით ჰაერმა თავისუფლად იმოძრაოს.</li>
</ul>`,
    seoContentEn: `<h2>Why does choosing a quality bread box matter?</h2>
<p>A well-chosen bread box is not just kitchen decor — it is the key to keeping bread fresh. Quality material naturally regulates humidity, preventing bread from drying out or developing mold. Bread stored in the open or in a plastic bag quickly loses its taste, while in a bread box it keeps its soft texture and aroma.</p>
<h2>How to choose the best model?</h2>
<ul>
<li><strong>Material:</strong> Wood and bamboo models "breathe" best, while metal bread boxes are ideal for a modern interior.</li>
<li><strong>Ventilation:</strong> Make sure the model has an air-circulation system.</li>
<li><strong>Capacity:</strong> Choose the size based on your family's daily consumption, so that air can move freely inside.</li>
</ul>`,
    seoContentRu: `<h2>Почему важно выбрать качественную хлебницу?</h2>
<p>Правильно выбранная хлебница — это не просто украшение кухни, а главное условие сохранения свежести хлеба. Качественный материал естественным образом регулирует влажность, не давая хлебу засохнуть или заплесневеть. Хлеб, хранящийся в открытом виде или в полиэтиленовом пакете, быстро теряет вкусовые качества, а в хлебнице он сохраняет мягкость и аромат.</p>
<h2>Как выбрать лучшую модель?</h2>
<ul>
<li><strong>Материал:</strong> Модели из дерева и бамбука лучше всего «дышат», а металлические хлебницы идеальны для современного интерьера.</li>
<li><strong>Вентиляция:</strong> Убедитесь, что в модели есть система циркуляции воздуха.</li>
<li><strong>Объём:</strong> Выбирайте размер исходя из ежедневного потребления вашей семьи, чтобы воздух свободно циркулировал внутри.</li>
</ul>`,
  },

  {
    slug: "lanchboksebi",
    seoContent: `<h2>კომფორტული და უსაფრთხო ლანჩბოქსები ყოველდღიურობისთვის</h2>
<p>ჯანსაღი კვება სახლის გარეთ სწორი ლანჩბოქსით იწყება. სკოლაში, ოფისსა თუ პიკნიკზე, მნიშვნელოვანია, რომ საკვებმა შეინარჩუნოს ტემპერატურა, ფორმა და არომატი. თანამედროვე საკვები კონტეინერები მზადდება ეკოლოგიურად სუფთა მასალებისგან (BPA-free), რაც მათ სრულად უსაფრთხოს ხდის ბავშვებისა და მოზრდილებისთვის.</p>
<h2>რა უნდა გავითვალისწინოთ ყიდვისას?</h2>
<ul>
<li><strong>ტიხრები და სექციები:</strong> იდეალურია სხვადასხვა პროდუქტის (მაგ: სალათი და სენდვიჩი) ერთმანეთისგან იზოლირებულად შესანახად.</li>
<li><strong>ჰერმეტულობა:</strong> სილიკონის რგოლები და მყარი საკეტები უზრუნველყოფს, რომ სითხე არ დაიღვაროს.</li>
<li><strong>მიკროტალღურთან თავსებადობა:</strong> შეამოწმეთ, რამდენად უსაფრთხოა კონტეინერის გაცხელება.</li>
</ul>`,
    seoContentEn: `<h2>Comfortable and safe lunchboxes for everyday life</h2>
<p>Healthy eating away from home starts with the right lunchbox. At school, the office or on a picnic, it is important that food keeps its temperature, shape and aroma. Modern food containers are made from eco-friendly, BPA-free materials, which makes them completely safe for both children and adults.</p>
<h2>What to consider when buying?</h2>
<ul>
<li><strong>Dividers and compartments:</strong> Ideal for storing different foods (e.g. salad and a sandwich) separately.</li>
<li><strong>Leak resistance:</strong> Silicone rings and sturdy locks ensure that liquids do not spill.</li>
<li><strong>Microwave compatibility:</strong> Check how safe it is to heat the container.</li>
</ul>`,
    seoContentRu: `<h2>Удобные и безопасные ланчбоксы для каждого дня</h2>
<p>Здоровое питание вне дома начинается с правильного ланчбокса. В школе, офисе или на пикнике важно, чтобы еда сохраняла температуру, форму и аромат. Современные пищевые контейнеры изготавливаются из экологически чистых материалов (BPA-free), что делает их полностью безопасными для детей и взрослых.</p>
<h2>Что учесть при покупке?</h2>
<ul>
<li><strong>Перегородки и секции:</strong> Идеальны для раздельного хранения разных продуктов (например, салата и сэндвича).</li>
<li><strong>Герметичность:</strong> Силиконовые кольца и надёжные замки не дают жидкости пролиться.</li>
<li><strong>Совместимость с микроволновкой:</strong> Проверьте, насколько безопасно разогревать контейнер.</li>
</ul>`,
  },

  {
    slug: "minis-konteinerebi",
    seoContent: `<h2>რატომ უნდა ავირჩიოთ მინის კონტეინერები?</h2>
<p>მინა არის ყველაზე ჰიგიენური და ეკოლოგიური მასალა საკვების შესანახად. პლასტმასისგან განსხვავებით, ის არ იწოვს სუნს, არ იცვლის ფერს და არ გამოყოფს ტოქსიკურ ნივთიერებებს გაცხელებისას. მინის კონტეინერები იდეალურია როგორც მაცივარში შესანახად, ისე ღუმელში მოსამზადებლად, რაც სამზარეულოს რუტინას ბევრად ამარტივებს.</p>
<h2>მინის კონტეინერების უპირატესობები</h2>
<ul>
<li><strong>უნივერსალურობა:</strong> უძლებს ტემპერატურის მკვეთრ ცვალებადობას (საყინულიდან პირდაპირ მიკროტალღურში).</li>
<li><strong>გამჭვირვალობა:</strong> ყოველთვის ზუსტად იცით, რა ინახება კონტეინერში, თავსახურის მოხდის გარეშე.</li>
<li><strong>ხანგრძლივი მოხმარება:</strong> არ იკაწრება მარტივად და ინარჩუნებს პირვანდელ იერს წლების განმავლობაში.</li>
</ul>`,
    seoContentEn: `<h2>Why choose glass containers?</h2>
<p>Glass is the most hygienic and eco-friendly material for storing food. Unlike plastic, it does not absorb odors, does not change color and does not release toxic substances when heated. Glass containers are ideal both for storage in the fridge and for cooking in the oven, which greatly simplifies your kitchen routine.</p>
<h2>Advantages of glass containers</h2>
<ul>
<li><strong>Versatility:</strong> Withstands sharp temperature changes (straight from the freezer to the microwave).</li>
<li><strong>Transparency:</strong> You always know exactly what is stored inside without removing the lid.</li>
<li><strong>Long-lasting use:</strong> Does not scratch easily and keeps its original look for years.</li>
</ul>`,
    seoContentRu: `<h2>Почему стоит выбрать стеклянные контейнеры?</h2>
<p>Стекло — самый гигиеничный и экологичный материал для хранения продуктов. В отличие от пластика, оно не впитывает запахи, не меняет цвет и не выделяет токсичных веществ при нагревании. Стеклянные контейнеры идеальны как для хранения в холодильнике, так и для приготовления в духовке, что значительно упрощает кухонную рутину.</p>
<h2>Преимущества стеклянных контейнеров</h2>
<ul>
<li><strong>Универсальность:</strong> Выдерживает резкие перепады температуры (прямо из морозилки в микроволновку).</li>
<li><strong>Прозрачность:</strong> Вы всегда точно знаете, что хранится внутри, не снимая крышку.</li>
<li><strong>Долгий срок службы:</strong> Не царапается легко и сохраняет первоначальный вид годами.</li>
</ul>`,
  },

  {
    slug: "bambukis-kalatebi",
    seoContent: `<h2>ბამბუკის კალათები: სტილი და პრაქტიკულობა თქვენს სახლში</h2>
<p>ბამბუკი ბუნებრივი, განახლებადი და უაღრესად გამძლე მასალაა, რომელიც ინტერიერს სითბოსა და სიმყუდროვეს სძენს. ბამბუკის კალათები შესანიშნავი გამოსავალია სივრცის ორგანიზებისთვის — იქნება ეს აბაზანაში პირსახოცების შენახვა, საძინებელში ნივთების დახარისხება თუ სამზარეულოში ხილის განთავსება.</p>
<h2>პრაქტიკული გამოყენება</h2>
<ul>
<li><strong>ეკოლოგიურობა:</strong> სრულად ბიოდეგრადირებადი და უსაფრთხო მასალა, რომელიც არ აზიანებს გარემოს.</li>
<li><strong>ჰაერგამტარობა:</strong> ბამბუკის წნული სტრუქტურა იცავს შიგთავსს ჩახუთვისგან.</li>
<li><strong>სიმსუბუქე და სიმყარე:</strong> ადვილია გადასაადგილებლად, მაგრამ უძლებს მძიმე ნივთებს.</li>
</ul>`,
    seoContentEn: `<h2>Bamboo baskets: style and practicality in your home</h2>
<p>Bamboo is a natural, renewable and highly durable material that brings warmth and coziness to any interior. Bamboo baskets are an excellent solution for organizing space — whether storing towels in the bathroom, sorting items in the bedroom or holding fruit in the kitchen.</p>
<h2>Practical use</h2>
<ul>
<li><strong>Eco-friendliness:</strong> Fully biodegradable and safe material that does not harm the environment.</li>
<li><strong>Breathability:</strong> The woven bamboo structure protects the contents from stuffiness.</li>
<li><strong>Light yet sturdy:</strong> Easy to move, yet able to hold heavy items.</li>
</ul>`,
    seoContentRu: `<h2>Бамбуковые корзины: стиль и практичность в вашем доме</h2>
<p>Бамбук — это натуральный, возобновляемый и очень прочный материал, который придаёт интерьеру тепло и уют. Бамбуковые корзины — отличное решение для организации пространства: будь то хранение полотенец в ванной, сортировка вещей в спальне или размещение фруктов на кухне.</p>
<h2>Практическое применение</h2>
<ul>
<li><strong>Экологичность:</strong> Полностью биоразлагаемый и безопасный материал, не наносящий вреда окружающей среде.</li>
<li><strong>Воздухопроницаемость:</strong> Плетёная структура бамбука защищает содержимое от затхлости.</li>
<li><strong>Лёгкость и прочность:</strong> Легко переносить, но выдерживает тяжёлые предметы.</li>
</ul>`,
  },

  {
    slug: "faifuris-nakrebebi",
    seoContent: `<h2>რატომ ავირჩიოთ ფაიფურის ჭურჭელი?</h2>
<p>ფაიფური საუკუნეებია ხარისხისა და დახვეწილობის სიმბოლოა. მისი მკვრივი, არაფოროვანი სტრუქტურა არ შთანთქავს სუნსა და ფერს, რაც მას ჰიგიენურსა და გემოვნურად ნეიტრალურს ხდის. ხარისხიანი ფაიფურის ნაკრები სუფრას დახვეწილ იერს სძენს — როგორც ყოველდღიური კვებისთვის, ისე სტუმრების მისაღებად.</p>
<h2>როგორ შევარჩიოთ ნაკრები?</h2>
<ul>
<li><strong>დანიშნულება:</strong> ყოველდღიური მოხმარებისთვის აირჩიეთ გამძლე, სქელი ფაიფური; სადღესასწაულოდ — დახვეწილი დიზაინის ნაკრები.</li>
<li><strong>კომპლექტაცია:</strong> გაითვალისწინეთ ოჯახის წევრების რაოდენობა — თეფშების, ფინჯნებისა და სასადილო ნივთების რაოდენობა.</li>
<li><strong>მოვლა:</strong> შეამოწმეთ, არის თუ არა ნაკრები ჭურჭლის სარეცხ მანქანასა და მიკროტალღურთან თავსებადი.</li>
</ul>`,
    seoContentEn: `<h2>Why choose porcelain tableware?</h2>
<p>Porcelain has been a symbol of quality and refinement for centuries. Its dense, non-porous structure does not absorb odors or color, which makes it hygienic and neutral in taste. A quality porcelain set gives the table an elegant look — both for everyday meals and for hosting guests.</p>
<h2>How to choose a set?</h2>
<ul>
<li><strong>Purpose:</strong> For everyday use choose durable, thicker porcelain; for special occasions, a set with a refined design.</li>
<li><strong>Set composition:</strong> Consider the number of family members — the count of plates, cups and dining pieces.</li>
<li><strong>Care:</strong> Check whether the set is dishwasher- and microwave-safe.</li>
</ul>`,
    seoContentRu: `<h2>Почему стоит выбрать фарфоровую посуду?</h2>
<p>Фарфор веками остаётся символом качества и изысканности. Его плотная, непористая структура не впитывает запахи и цвет, что делает его гигиеничным и нейтральным по вкусу. Качественный фарфоровый набор придаёт столу элегантный вид — как для повседневной трапезы, так и для приёма гостей.</p>
<h2>Как выбрать набор?</h2>
<ul>
<li><strong>Назначение:</strong> Для повседневного использования выбирайте прочный, толстый фарфор; для торжеств — набор с изысканным дизайном.</li>
<li><strong>Комплектация:</strong> Учитывайте количество членов семьи — число тарелок, чашек и столовых предметов.</li>
<li><strong>Уход:</strong> Проверьте, совместим ли набор с посудомоечной машиной и микроволновой печью.</li>
</ul>`,
  },
];

async function run() {
  // 1) Print every category so you can verify slugs before writing
  const all = await db.collection("categories").get();
  console.log(`\nCategories in Firestore (${all.size}):`);
  all.forEach((d) => {
    const c = d.data();
    console.log(`  • slug="${c.slug}"  name="${c.name}"  [${d.id}]`);
  });
  console.log("");

  // 2) Update each entry, matched by slug
  let ok = 0;
  for (const e of ENTRIES) {
    const snap = await db.collection("categories").where("slug", "==", e.slug).limit(1).get();
    if (snap.empty) {
      console.warn(`⚠️  SKIPPED: no category found with slug "${e.slug}" — fix the slug in ENTRIES.`);
      continue;
    }
    await snap.docs[0].ref.update({
      seoContent: e.seoContent,
      seoContentEn: e.seoContentEn,
      seoContentRu: e.seoContentRu,
      updatedAt: new Date(),
    });
    console.log(`✅ Updated "${e.slug}"`);
    ok++;
  }
  console.log(`\nDone. ${ok}/${ENTRIES.length} categories updated.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
