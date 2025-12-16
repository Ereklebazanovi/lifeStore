import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import { ADMIN_CONFIG } from "../config/constants";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // 1. ძირითადი ნავიგაცია
  const navigationLinks = [
    { to: "/", label: "მთავარი" },
    { to: "/products", label: "პროდუქტები" },
    { to: "/about", label: "ჩვენ შესახებ" },
  ];

  // 2. ✅ დახმარება & სამართლებრივი (სრული სია)
  const supportLinks = [
   
    { to: "/refund-policy", label: "დაბრუნების პოლიტიკა" },
    { to: "/terms", label: "წესები და პირობები" },
    { to: "/privacy-policy", label: "კონფიდენციალურობა" }, // 👈 ეს დავამატე
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: "https://www.facebook.com/lifestore.ge",
      label: "Facebook",
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/lifestore.ge",
      label: "Instagram",
    },
  ];

  return (
    <footer className="bg-white border-t border-stone-200 !mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* 1. Brand Section */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-stone-900 tracking-tight">
                  LifeStore
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed text-sm">
                ეკო-მეგობრული ნივთები შენი სახლისთვის. ბუნებრივი მასალები და
                მდგრადი ცხოვრება.
              </p>
            </motion.div>

            {/* 2. Navigation Section */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold text-stone-900 tracking-tight text-lg">
                ნავიგაცია
              </h3>
              <ul className="space-y-3">
                {navigationLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className="text-stone-600 hover:text-emerald-600 transition-colors font-medium text-sm block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* 3. Support / Legal Section */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold text-stone-900 tracking-tight text-lg">
                დახმარება
              </h3>
              <ul className="space-y-3">
                {supportLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className="text-stone-600 hover:text-emerald-600 transition-colors font-medium text-sm block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* 4. Contact Info Section */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold text-stone-900 tracking-tight text-lg">
                საკონტაქტო
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <Mail className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-stone-600 font-medium text-sm break-all">
                    {ADMIN_CONFIG?.BUSINESS_EMAIL || "info@lifestore.ge"}
                  </span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <Phone className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-stone-600 font-medium text-sm">
                    {ADMIN_CONFIG?.BUSINESS_PHONE || "+995 511 72 72 57"}
                  </span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-stone-600 font-medium text-sm">
                    თბილისი, საქართველო
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-stone-200 py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-stone-500 font-medium text-sm">
              &copy; {currentYear} LifeStore. ყველა უფლება დაცულია.
            </p>

            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-stone-50 hover:bg-emerald-600 rounded-full flex items-center justify-center text-stone-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;