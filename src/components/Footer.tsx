import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ADMIN_CONFIG } from "../config/constants";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/products", label: t("nav.products") },
    { to: "/about", label: t("nav.about") },
  ];

  const supportLinks = [
    { to: "/refund-policy", label: t("footer.refundPolicy") },
    { to: "/terms", label: t("footer.terms") },
    { to: "/privacy-policy", label: t("footer.privacy") },
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
                {t("footer.tagline")}
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
                {t("footer.navigation")}
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
                {t("footer.support")}
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
                {t("footer.contact")}
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
                    {t("footer.location")}
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom Section - განახლებული იურიდიული ინფორმაციით */}
        <motion.div
          className="border-t border-stone-200 py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0">

            {/* Copyright და იურიდიული ინფორმაცია */}
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-stone-500 font-medium text-sm text-center md:text-left">
              <p>&copy; {currentYear} LifeStore. {t("footer.rights")}.</p>

              {/* გამყოფი ხაზი/წერტილი მხოლოდ დიდ ეკრანებზე */}
              <span className="hidden md:block w-1 h-1 bg-stone-400 rounded-full"></span>

              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
                <span>შპს ლაიფ სთორი</span>
                <span className="hidden sm:inline text-stone-300">|</span>
                <span>ს/ნ 438125574</span>
              </div>

              <span className="hidden md:block w-1 h-1 bg-stone-400 rounded-full"></span>

              <span className="text-stone-400 text-xs font-normal">
                Designed by{" "}
                <a
                  href="https://vifadigital.ge"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-stone-600 transition-colors"
                >
                  VIFA Digital
                </a>
              </span>
            </div>

            {/* სოციალური ქსელები */}
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