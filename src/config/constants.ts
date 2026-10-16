// src/config/constants.ts
// აპლიკაციის კონსტანტები - ცენტრალურად მართვისთვის

export const DELIVERY_CITIES = ["თბილისი", "რუსთავი", "ბათუმი", "ქუთაისი", "სხვა"] as const;
export type DeliveryCity = (typeof DELIVERY_CITIES)[number];

export const ADMIN_CONFIG = {
  // ადმინის მეილი - შეცვალე როცა საჭიროა
  EMAIL: "lifestoreorders@gmail.com",
  // ბიზნეს ინფორმაცია
  BUSINESS_NAME: "LifeStore",
  //511 72 72 57

  BUSINESS_PHONE: "+995 511 72 72 57", 
  BUSINESS_EMAIL: "info@lifestore.ge", 
};

export const SITE_CONFIG = {
  // ✅ შეცვალე კონკრეტული დომენით:
  BASE_URL: "https://lifestore.ge",

  // საიტის მეტაინფო
  SITE_NAME: "LifeStore",
  DESCRIPTION: "ონლაინ მაღაზია სახლის ნივთებისთვის",
};

