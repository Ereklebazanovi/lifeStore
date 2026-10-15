# 🛠️ ადმინ პანელის განახლება (ოქტომბერი 2026): შესრულების გეგმა

> **სტატუსი:** დაგეგმილია · კლიენტთან (ოთარი, LifeStore-ის დამფუძნებელი) შეთანხმებულია PDF-ით
> **თარიღი:** 2026-10-14 (განახლდა 2026-10-16) · **ვადა:** 2026-10-25 (თავდაპირველად 10-20; 10-15 checkout-ის ხარვეზებმა გადაწია)
> **Stack:** Vite + React 19 + TS SPA · Firebase/Firestore (client SDK) · Vercel `/api/*` serverless
> **სამუშაო პროცესი:** კოდს წერს Codex → Codex ამოწმებს ემულატორის ტესტებით (`.verify/`, gitignored) → Claude ამოწმებს (review) → ერეკლე ტესტავს Preview branch-ზე → merge main-ში → push (Vercel ავტომატურად აკეთებს deploy-ს)

## 📌 რა შეიცვალა 10-15-ის შემდეგ (checkout-ის გამაგრება, უკვე production-ზეა)
- `createOrder` ატომურია: მარაგის ჩამოკლება + შეკვეთის ჩაწერა ერთ `runTransaction`-შია (`deductInventoryInTransaction` + `transaction.set`), rollback აღარ არის. retry-ზე `checkOrderSaved` (`exists | missing | unknown`) იცავს ორმაგი ჩამოკლებისგან.
- შეკვეთის items[].product-ში `stockHistory` აღარ ინახება (`toOrderProductSnapshot`).
- `generateOrderNumber`: `LS-YYYY-` + 8 ციფრი დროიდან + 2 შემთხვევითი (ფორმატი მხოლოდ ციფრებია, `api/payment/create.ts` regex-ის გამო).
- `createManualOrder`: rollback მხოლოდ მაშინ, როცა მარაგი ნამდვილად ჩამოიჭრა (`inventoryDeducted`).
- cron (`api/cleanup/expired-orders.ts`) ეძებს მხოლოდ `paymentMethod in [flitt, tbc_bank]` შეკვეთებს.
- `firestore.rules` → users: როლს მხოლოდ admin ცვლის. live rules ახლა repo-ს ემთხვევა (10-15).
- **ფაზა 2-ისთვის მნიშვნელოვანია:** shipping-ის ცვლილება `createOrder`-ში ამ ატომურ ტრანზაქციას არ უნდა დაარღვიოს. `shippingCost` გამოითვლება ტრანზაქციამდე და payload-ში უცვლელად შედის.

## 🧯 ცნობილი ძველი ხარვეზები (არ ასწორო ამ სამუშაოს ფარგლებში — ცალკე „ნაბიჯი 4“)
ხელით შეკვეთის რედაქტირება/შექმნა არაატომურია; cron-ის პარალელური გაშვება შეიძლება ორჯერ დააბრუნებს; სტუმარს `isValidStockUpdate`-ით მარაგის პირდაპირ შეცვლა შეუძლია; არააქტიური პროდუქტი/უარყოფითი quantity ტრანზაქციაში არ მოწმდება; checkout-ის idempotency key თავიდან ცდისას. დეტალები: `.verify/REPORT-3.md`.

---

## ⚠️ ძირითადი წესები (წაიკითხე, სანამ კოდს შეეხები)

1. **საიტი production-ზეა** და რეალური გაყიდვები მიდის. ცვლილებები უნდა იყოს პატარა და მიზნობრივი, ერთი ფაზა ერთ ჯერზე. სტილი უნდა ემთხვეოდეს არსებულ კოდს: კომენტარები ქართულად, Tailwind, `OrderService`-ის static class pattern.
2. **გადახდის flow-ს არ შეეხო:** `api/payment/*`, `paymentService.ts`, Flitt-ის ლოგიკა. ერთადერთი გამონაკლისი ფაზა 2-ის shipping-ის ნაწილია და იქ წესები ცალკე წერია.
3. **მარაგი (stock) იცვლება მხოლოდ Firestore `runTransaction`-ით.** read-then-batch მიდგომა არ გამოიყენო. ყოველ ცვლილებას `stockHistory` ჩანაწერი სჭირდება, გასაგები `reason`-ით.
4. **commit/push-ს agent-ები არ აკეთებენ.** ამას ერეკლე აკეთებს. (Co-Authored-By trailer-იან commit-ზე Vercel-მა deploy არ გააკეთა.)
5. **`firestore.rules`-ს ბრმად deploy ნუ გაუკეთებ.** repo-ს და live-ს ვერსიები ადრე განსხვავებული იყო. სანამ deploy-ს გააკეთებ, შეადარე Firebase Console-ში არსებულს. deploy-ს ერეკლე აკეთებს ხელით.
6. **12 ოქტომბრის გასწორებები არ უნდა გატყდეს** (წაშლისას მარაგის დაბრუნება, რედაქტირების stock check). დეტალები ქვემოთ, „არსებული helper-ები“.
7. **ყოველი ფაზის ბოლოს:** `npm run build` უნდა გადიოდეს. repo-ში lint error-ები ისედაც არის, ახლის დამატება არ შეიძლება. UI ტექსტები ქართულადაა.
8. **ფარგლებს არ გასცდე.** ვაკეთებთ მხოლოდ იმას, რაც PDF-ში წერია (იხ. ქვემოთ). ზედმეტი „bonus“ ფუნქციები არ დაამატო.

## 🧰 არსებული helper-ები (ხელახლა გამოიყენე, არ დააკოპირო)

| helper | ფაილი | რას აკეთებს |
|---|---|---|
| `OrderService.isStockReturned(order)` | `src/services/orderService.ts` | მარაგი უკვე დაბრუნებულია? (`stockRestored` ან cron-ის `paymentStatus: "cancelled"`) |
| `OrderService.restoreInventoryInTransaction(tx, items, reason)` (private) | იგივე | მარაგის დაბრუნება ტრანზაქციის შიგნით (ჯერ კითხულობს, მერე წერს) |
| `OrderService.deductInventoryInTransaction(tx, items, orderNumber)` (private) | იგივე | მარაგის ჩამოკლება **არსებული** ტრანზაქციის შიგნით (უარყოფით რიცხვამდე ვერ ჩავა). `updateProductInventory` მისი wrapper-ია საკუთარი ტრანზაქციით |
| `adjustInventoryForOrderEdit(old, new, orderNumber)` (private) | იგივე | diff-ზე დაფუძნებული stock ცვლილება რედაქტირებისას (`sumByKey`-ით ჯამავს ერთი პროდუქტის რამდენიმე ხაზს) |
| `getReservedQuantity(...)`, `ReservedStockItem` | `src/utils/stock.ts` | რედაქტირებისას ჩანაწერის საკუთარი რაოდენობა ხელმისაწვდომ მარაგში ჩაითვლება |
| `ProductSelector` / `ProductSelectModal` (`reservedItems` prop) | `src/components/admin/` | პროდუქტის/ვარიანტის არჩევა რაოდენობით |
| `CreateManualOrderModal` | `src/pages/admin/components/` | ფორმის ნიმუში: create/edit mode, stock validation |

> stock-ის ლოგიკა მაღაზიისთვისაც (ფაზა 3) საჭიროა. სჯობს `OrderService`-ის private ფუნქციები საერთო inventory helper-ში გადაიტანო, მაგალითად `src/services/inventoryService.ts`-ში, და ორივე ადგილას ის გამოიყენო. ასე ლოგიკა არ დაკოპირდება. გადატანის შემდეგ შეკვეთების ქცევა 1:1 უნდა დარჩეს.

---

## 📋 ფარგლები (რაც კლიენტს დავპირდით)

1. საკურიერო ტარიფების მართვა პარამეტრებიდან + ონლაინ შეკვეთაზე მიტანის თანხის ჩასწორება
2. მაღაზია „ცინცაძის 2“: გატანა, დაბრუნება, სია, რედაქტირება/წაშლა (მხოლოდ ადმინისთვის)
3. მაღაზია ანალიტიკაში (ცალკე ბლოკი) + ბრუნვით უწყისში სვეტი „გადატანა მაღაზიაში“
4. შეკვეთების ფილტრი ქალაქით (რამდენიმე ქალაქის ერთად მონიშვნით)
5. ვინ გაატარა შეკვეთა: ადმინკაში და Excel-ში

**არ შედის:** Optimo-სთან (მაღაზიის სისტემა) ინტეგრაცია, მაღაზიის ნაშთის აღრიცხვა, ფილტრი თანამშრომლის მიხედვით, მაღაზიის ახალი როლი.

---

## 🔢 ფაზების თანმიმდევრობა

თითოეული ფაზა ცალკე იტესტება და ცალკე იტვირთება production-ზე.

| ფაზა | რა | რისკი |
|---|---|---|
| 0 | Firestore rules ახალი კოლექციებისთვის | საშუალო: deploy ხელით, live-თან შედარების შემდეგ |
| 1 | ვინ გაატარა + ქალაქის ფილტრი | დაბალი |
| 2 | საკურიერო ტარიფები + თანხის ჩასწორება | **მაღალი: checkout/გადახდა** |
| 3 | მაღაზიის მოდული | საშუალო: stock |
| 4 | ანალიტიკის ბლოკი + ბრუნვითი უწყისი | დაბალი-საშუალო |

---

## ფაზა 0: Firestore rules

repo-ს `firestore.rules`-ს ემატება:

```
match /settings/{docId} {
  allow read: if true;          // checkout-ს სტუმარიც კითხულობს ტარიფებს
  allow write: if isAdmin();
}
match /stores/{storeId} {
  allow read, write: if isAdmin();
}
match /storeTransfers/{transferId} {
  allow read, write: if isAdmin();
}
```

- ჯერ შეადარე repo-ს ფაილი Firebase Console-ში live rules-ს. თუ live-ში რამე დამატებითი წერია, ის repo-შიც გადმოიტანე და მხოლოდ ამის შემდეგ დაამატე ახალი ბლოკები.
- deploy: `firebase deploy --only firestore:rules`. ამას ერეკლე აკეთებს.
- products-ზე rule არ იცვლება: ადმინს `update` უფლება უკვე აქვს.

---

## ფაზა 1ა: ვინ გაატარა შეკვეთა

**მონაცემი:** `Order`-ს (`src/types/index.ts`) ემატება:
```ts
createdBy?: { uid: string; email: string; name?: string };
updatedBy?: { uid: string; email: string; name?: string };
```
- `CreateManualOrderRequest` / `UpdateManualOrderRequest`-ს ემატება `createdBy` / `updatedBy`. მნიშვნელობას ავსებს `CreateManualOrderModal` `useAuthStore`-ის `user`-იდან.
- `createManualOrder` ინახავს `createdBy`-ს, `updateManualOrder` ინახავს `updatedBy`-ს. ორივე `cleanObject`-ში გადის.
- `createOrderObject` (orderService) ამ ველებს უნდა აბრუნებდეს.
- ვებსაიტის შეკვეთებზე `createdBy` არ არის.

**UI (`OrdersManager.tsx`):**
- სიაში (desktop ცხრილი + mobile ბარათი) და შეკვეთის დეტალებში: „გაატარა: email“.
- ვებსაიტის შეკვეთაზე: „ვებსაიტი“.
- ძველ ხელით შეკვეთაზე `createdBy` არ არის, ამიტომ არაფერი ჩანს. შეცდომა არ უნდა ამოაგდოს.

**Excel (`src/utils/excelExporter.ts`, შეკვეთების ექსპორტი):** ემატება სვეტი „გაატარა“, იმავე ლოგიკით.

## ფაზა 1ბ: ქალაქის ფილტრი

- `OrdersManager.tsx`-ში, `orderTypeFilter`-ის გვერდით (≈ხაზი 1490), ემატება ქალაქების multi-select. ჩეკბოქსებიანი dropdown-ის ვარიანტები: თბილისი, რუსთავი, ბათუმი, ქუთაისი, სხვა.
- ქალაქების სია ერთ ადგილას გაიტანე (მაგ. `src/config/constants.ts` → `DELIVERY_CITIES`). იმავე სიას გამოიყენებს ფაზა 2-ც.
- ძველ შეკვეთებში შეიძლება სხვა ქალაქის მნიშვნელობა ეწეროს. ყველაფერი, რაც პირველ ოთხში არ არის, ფილტრში „სხვა“-დ ითვლება.
- ფილტრი ემატება `getFilteredOrders`-ს (≈ხაზი 1140), „ფილტრის გასუფთავება“ ღილაკს და `visibleCount` reset-ის effect-ის dependency-ებს.
- არსებული „ყველას მონიშვნა“, Excel ექსპორტი და ლეიბლები უცვლელად უნდა მუშაობდეს გაფილტრულ სიაზე.

**ტესტი:** აირჩიე „ბათუმი“ → ჩანს მხოლოდ ბათუმის შეკვეთები. აირჩიე „თბილისი + რუსთავი“ → ჩანს ორივე. „ყველას მონიშვნა“ → Excel/ლეიბლები მხოლოდ მათზე.

---

## ფაზა 2: საკურიერო ტარიფები (⚠️ checkout)

### ახლანდელი მდგომარეობა: 5/10₾ hardcoded არის 4 ადგილას
- `src/pages/CheckoutPage.tsx:69`: `shippingCost` (ეკრანზე ნაჩვენები ჯამი **და Flitt-ის გადახდის თანხა** `grandTotal`, ხაზი ≈187)
- `src/services/orderService.ts`: `calculateShippingCost(city)`. აქედან ითვლება შეკვეთის `totalAmount` (`createOrder`).
- `src/pages/admin/components/CreateManualOrderModal.tsx:97`: `calculateShippingCost` + `<option>`-ის წარწერები (5 ₾ / 10 ₾)
- `src/i18n/locales/{ka,en,ru}.json`: `checkout.cityTbilisi` … `cityOther`, მაგ. `"თბილისი (მიწოდება: 5₾)"`

### 🔴 უცვლელი პირობა (invariant)
**ეკრანზე ნაჩვენები ჯამი = Flitt-ზე გაგზავნილი თანხა = შეკვეთის `totalAmount`.** ახლა ეს სამი რიცხვი ორ ადგილას ცალ-ცალკე ითვლება. თუ ერთი პარამეტრებიდან წაიკითხავს, მეორე კი default-ს გამოიყენებს, კლიენტს სხვა თანხა ჩამოეჭრება და შეკვეთაში სხვა ეწერება.
- გადაწყვეტა: `CheckoutPage` ტარიფებს **ერთხელ** კითხულობს და `shippingCost`-ს ითვლის. იგივე რიცხვი გადაეცემა `createOrder`-ს: `CreateOrderRequest`-ს ემატება optional `shippingCost`. `createOrder` იყენებს ამ მნიშვნელობას, თუ ის არის; თუ არ არის, `calculateShippingCost`-ს. `grandTotal` რჩება იგივე ფორმულით.
- `api/payment/*` **არ იცვლება.**

### მონაცემი
`settings/shipping` დოკუმენტი:
```ts
{ rates: { "თბილისი": 5, "რუსთავი": 5, "ბათუმი": 10, "ქუთაისი": 10, "სხვა": 10 }, updatedAt, updatedBy }
```
- `src/utils/shipping.ts`: `DEFAULT_SHIPPING_RATES` (ზემოთ მოცემული მნიშვნელობები) + `getShippingCost(city, rates)`. უცნობი ქალაქი ითვლება როგორც „სხვა“.
- `src/services/settingsService.ts`: `getShippingRates()`. **ნებისმიერ შეცდომაზე ან დოკუმენტის არარსებობისას აბრუნებს `DEFAULT_SHIPPING_RATES`-ს.** checkout არასდროს უნდა გაჩერდეს ტარიფების გამო. `saveShippingRates(rates, user)` მხოლოდ ადმინისთვისაა.
- ტარიფების ჩატვირთვამდე checkout-ის „შეკვეთის გაფორმება“ ღილაკი გამორთულია, ან default ტარიფი ჩანს. არ უნდა მოხდეს ისე, რომ ერთი ფასი ჩანდეს და მეორე გაიგზავნოს.

### UI
- **პარამეტრები (`ParametersPage.tsx`, მხოლოდ ადმინი):** ბლოკი „მიტანის ტარიფები“. 5 ქალაქი, თითოეულზე რიცხვის ველი (≥0) და „შენახვა“ ღილაკი.
- **Checkout:** ტარიფი გამოითვლება `getShippingCost`-ით. i18n წარწერები გადაიყვანე interpolation-ზე, მაგ. `"თბილისი (მიწოდება: {{price}}₾)"`, სამივე ენაში.
- **ხელით შეკვეთის ფორმა:** default თანხა მოდის ტარიფებიდან, `<option>`-ის წარწერებიც დინამიკურია. ხელით ჩაწერა ისევ მუშაობს (`isShippingCostManuallySet` ლოგიკა არ შეიცვალოს). რედაქტირებისას შენახული თანხა არ უნდა გადაიწეროს.
- **მიტანის თანხის ჩასწორება ნებისმიერ შეკვეთაზე (ძირითადად ონლაინ შეკვეთებისთვის):** `OrdersManager`-ის შეკვეთის დეტალებში ღილაკი „მიტანის თანხის შეცვლა“ → ველი → შენახვა.
  - `OrderService.updateShippingCost(orderId, cost)`: ერთ `updateDoc`-ში ახლდება `shippingCost`, `deliveryInfo.shippingCost`, `totalAmount = subtotal + cost` და `updatedAt` (+ `updatedBy`).
  - თუ შეკვეთა ბარათით არის გადახდილი (`paymentStatus === "paid"` და `paymentMethod !== "cash"`), ჩანს გაფრთხილება: „თანხა მხოლოდ ჩანაწერში შეიცვლება; კლიენტს ფული ავტომატურად არ დაუბრუნდება / არ ჩამოეჭრება.“
  - ხელმისაწვდომია ადმინისა და მენეჯერისთვის: rules-ით ორივეს აქვს orders update.

**ტესტი:**
1. პარამეტრებში თბილისი 5→6 → საიტის checkout-ზე წარწერა და ჯამი 6 (ka/en/ru).
2. **ნაღდი ფულით** სატესტო შეკვეთა → შეკვეთის `totalAmount` = ეკრანზე ნაჩვენები ჯამი.
3. **ბარათით** სატესტო შეკვეთა → Flitt-ის გვერდზე თანხა = ეკრანზე ნაჩვენები ჯამი = `totalAmount`. გადახდა არ დაასრულო, ან გააკეთე პატარა თანხით.
4. `settings/shipping` წაშალე ან rules გამორთე → checkout default 5/10-ით მუშაობს.
5. ტარიფი ისევ 5-ზე დააბრუნე.

---

## ფაზა 3: მაღაზიის მოდული

### მონაცემი
```ts
// stores/{storeId}: ერთი ჩანაწერი seed-ად: { name: "ცინცაძის 2", address: "ცინცაძის 2", isActive: true, createdAt }
interface Store { id: string; name: string; address: string; isActive: boolean; createdAt: Date }

// storeTransfers/{id}
interface StoreTransfer {
  id: string;
  transferNumber: string;           // "ST-2026-xxxxxx" (orderNumber-ის მსგავსად)
  type: "out" | "return";           // out = საწყობი→მაღაზია (−stock), return = მაღაზია→საწყობი (+stock)
  storeId: string; storeName: string; storeAddress: string;   // snapshot
  items: { productId: string; variantId?: string; name: string; quantity: number; price: number }[];
                                    // price = გასაყიდი ფასის snapshot გატანის მომენტში (ანალიტიკისთვის)
  totalQuantity: number;
  totalValue: number;
  note?: string;
  date: Date;                       // გატანის თარიღი (default დღეს, ხელით შეცვლადი, როგორც orderDate)
  createdAt: Date;                  // რეალური შეყვანის დრო
  createdBy: { uid: string; email: string; name?: string };
  updatedAt?: Date; updatedBy?: { uid: string; email: string; name?: string };
}
```
- რეალური პროდუქტების გარდა („manual_“-ით დაწყებული ჩანაწერები) აქ არაფერი შეიძლება. მაღაზიაში მხოლოდ საწყობის პროდუქტი გადის.
- **`orders` კოლექციაში არ ჩაწერო.** თუ იქ მოხვდება, ანალიტიკა, შემოსავალი და Excel გატანას გაყიდვად ჩათვლის.

### stock ლოგიკა (`src/services/storeTransferService.ts`, ყველაფერი `runTransaction`-ით)
| მოქმედება | out | return |
|---|---|---|
| შექმნა | −qty (არასაკმარისი მარაგი = შეცდომა) | +qty |
| რედაქტირება | diff (როგორც `adjustInventoryForOrderEdit`, `sumByKey`-ით) | საპირისპირო ნიშნის diff |
| წაშლა | +qty (მარაგი ბრუნდება) | −qty (თუ საწყობში საკმარისი არ არის, შეცდომა და წაშლა არ ხდება) |

- `stockHistory.reason`: `Store transfer #ST-…`, `Store return #ST-…`, `Store transfer edit #ST-…`, `Store transfer deleted #ST-…`. ფაზა 4-ის ბრუნვითი უწყისი ამ prefix-ებით ცნობს მაღაზიის მოძრაობას.
- დოკუმენტის ჩაწერა/წაშლა და stock ერთ ტრანზაქციაშია: ან ორივე ხდება, ან არცერთი.

### UI
- `AdminLayout.tsx` nav: ახალი ჩანართი „მაღაზია“ (id `store`), **მხოლოდ admin role-ზე**. `AdminPage.tsx`-ში ემატება `case "store"` + admin-ის შემოწმება, ისე როგორც სხვა admin-only გვერდებზე.
- **სიის გვერდი** (`StoreManager.tsx`): მაღაზიის სახელი და მისამართი ზემოთ; ღილაკები „+ გატანა მაღაზიაში“ და „დაბრუნება საწყობში“; სია თარიღით (უახლესი ზემოთ), ტიპის ნიშნით (გატანა/დაბრუნება), პროდუქტების რაოდენობით და ვინ გააკეთა; თარიღის ფილტრი; ძებნა პროდუქტის სახელით. ხაზზე დაჭერა ხსნის დეტალებს (პროდუქტები × რაოდენობა); იქვეა რედაქტირება და წაშლა (confirm-ით).
- **ფორმა** (`StoreTransferModal.tsx`): `CreateManualOrderModal`-ის მსგავსი, მაგრამ მარტივი. კლიენტის, მიტანის და გადახდის ველები არ არის. არის თარიღი, პროდუქტების ხაზები (`ProductSelector`), რაოდენობა და შენიშვნა.
  - `out` რეჟიმში stock validation ზუსტად ისეა, როგორც შეკვეთაში, edit-ზე `reservedItems`-ით.
  - `return` რეჟიმში ზედა ზღვარი საწყობის მარაგით არ არის. `ProductSelectModal`-ს სჭირდება prop, მაგ. `ignoreStockLimit`, და მისი default ქცევა არ უნდა შეიცვალოს.
- ყველგან ჩანს მხოლოდ რაოდენობები. ფასები მხოლოდ ანალიტიკაში ჩანს.

**ტესტი** (სატესტო პროდუქტი, მარაგი 10):
1. გატანა 4 → საწყობში 6.
2. რედაქტირება 4→6 → 4.
3. რედაქტირება ორ ხაზად (3 + 3) → 4 (უცვლელი).
4. დაბრუნება 2 → 6.
5. გატანის წაშლა → +6.
6. დაბრუნების წაშლა, როცა საწყობში საკმარისი არ არის → შეცდომა და არაფერი იცვლება.
7. შეკვეთების ანალიტიკა/შემოსავალი არ შეცვლილა.
8. მენეჯერის ანგარიშზე ჩანართი არ ჩანს.

---

## ფაზა 4: ანალიტიკა + ბრუნვითი უწყისი

### ანალიტიკის ბლოკი „მაღაზია“
- `AnalyticsDashboard.tsx` იყენებს იმავე `dateRange`-ს (preset/custom). `storeTransfers` იტვირთება ცალკე (subscribe ან get), `date` ველით ფილტრდება.
- ნაჩვენებია: გატანების რაოდენობა, გატანილი ცალი, დაბრუნებული ცალი, წმინდა რაოდენობა, ღირებულება (`price` snapshot-ით, წარწერით „ღირებულება გასაყიდი ფასით“ და არა „შემოსავალი“) და ცხრილი პროდუქტი → ცალი.
- **არსებული KPI-ები, შემოსავლის გრაფიკები და ტოპ პროდუქტები არ იცვლება.** მაღაზიის მონაცემი მათში არ შედის.

### ბრუნვითი უწყისი (`exportTurnoverToExcel`, `src/utils/excelExporter.ts` ≈ხაზი 633; მოძრაობის დათვლა ≈ხაზი 60-150)
- ახლა ყოველი კლება „გაყიდვად“ (`outgoing`) ითვლება, ყოველი მატება კი „მიღებად“ (`incoming`). ცვლილება ითვლება წინა ჩანაწერის `quantity`-სთან სხვაობით.
- ჩანაწერები, რომელთა `reason` იწყება `Store transfer` / `Store return` prefix-ით, გადადის ცალკე სვეტში **„გადატანა მაღაზიაში“** (წმინდა: გატანა − დაბრუნება). ისინი „გაყიდვასა“ და „მიღებაში“ აღარ ითვლება.
- ჯამური სტრიქონი და toast-ის შეჯამება (`InventoryManagerVariants.tsx` ≈ხაზი 822) ახალ სვეტს უნდა ითვალისწინებდეს. ნაშთის ფორმულა: საწყისი + მიღება − გაყიდვა − გადატანა = საბოლოო.

**ტესტი:** ფაზა 3-ის სატესტო მოძრაობების შემდეგ ბრუნვით უწყისში სატესტო პროდუქტს გაყიდვა 0 აქვს, გადატანა შესაბამისი რიცხვია და საბოლოო ნაშთი ემთხვევა საწყობს.

---

## ✅ Claude-ის review checklist (ყოველ ფაზაზე)

- [ ] `npm run build` გადის; ახალი lint error არ დამატებულა (repo-ში უკვე არსებულს არ ვითვლით).
- [ ] stock ცვლილება მხოლოდ `runTransaction`-ით; ყველა read ხდება write-მდე; ყველგან არის `stockHistory` + `reason`.
- [ ] ერთი პროდუქტი რამდენიმე ხაზზე სწორად ჯამდება (create, edit, delete).
- [ ] `api/payment/*` და `paymentService.ts` diff-ში არ ჩანს. ფაზა 2-ში invariant დაცულია: ეკრანზე ჯამი = Flitt-ის თანხა = `totalAmount`.
- [ ] checkout მუშაობს, როცა `settings/shipping` არ არსებობს.
- [ ] 12 ოქტომბრის გასწორებები უცვლელად მუშაობს: შეკვეთის edit-ზე „ბოლო ცალები“, წაშლის checkbox, „მარაგი უკვე დაბრუნებულია“.
- [ ] role-ები: მაღაზია და ტარიფების პარამეტრები მხოლოდ admin-ისთვისაა (UI + rules); manager-ს რჩება მხოლოდ შეკვეთები + საწყობის ნახვა.
- [ ] ძველი დოკუმენტები ახალი ველების გარეშე (`createdBy`, `settings`) შეცდომას არ აგდებს.
- [ ] diff ფარგლებს არ სცდება: არ არის ზედმეტი refactor ან „bonus“ ფუნქცია.
- [ ] Firestore rules-ის ცვლილება მოხდა მხოლოდ ფაზა 0-ში და deploy-მდე live-ს შეედარა.
