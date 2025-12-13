import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { to: "/", label: "მთავარი" },
    { to: "/products", label: "პროდუქტები" },
    { to: "/about", label: "ჩვენს შესახებ" },
    { to: "/contact", label: "კონტაქტი" },
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
    <footer className="bg-white border-t border-stone-200 !mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
            {/* Brand Section */}
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
              <p className="text-stone-600 leading-relaxed max-w-sm">
                ეკო-მეგობრული ნივთები შენი სახლისთვის. ბუნებრივი მასალები და
                მდგრადი ცხოვრება.
              </p>
            </motion.div>

            {/* Navigation */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-stone-900 tracking-tight">
                ნავიგაცია
              </h3>
              <ul className="space-y-2">
                {navigationLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className="text-stone-600 hover:text-emerald-600 transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-stone-900 tracking-tight">
                კონტაქტი
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span className="text-stone-600 font-medium">
                    info@lifestore.ge
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="text-stone-600 font-medium">
                    +995 511 72 72 57
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-stone-600 font-medium">
                    თბილისი, საქართველო
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-stone-200 py-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-stone-500 font-medium">
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
                    className="w-9 h-9 bg-stone-100 hover:bg-emerald-600 rounded-xl flex items-center justify-center text-stone-600 hover:text-white transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    <IconComponent className="w-4 h-4" />
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
