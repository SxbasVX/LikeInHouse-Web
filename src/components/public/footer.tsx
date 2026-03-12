"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Map, Instagram, Facebook, Youtube, Twitter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");

  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const getSetting = (key: string, fallback: string) => {
    if (!settings) return fallback;
    const record = settings as Record<string, string>;
    return record[key] || fallback;
  };

  const address = getSetting("address", "Av. El Sol 456, Cusco, Peru");
  const phone = getSetting("phone", "+51 84 123 456");
  const email = getSetting("contactEmail", "info@perutours.com");

  return (
    <footer className="bg-white border-t border-gray-100 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 pt-20 pb-10 sm:px-6 lg:px-12">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 xl:gap-16 mb-20">
          
          {/* Brand Info */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Map className="h-6 w-6 text-brand-teal" />
              <span className="text-xl font-heading font-semibold text-brand-darkRed tracking-tight">LikeInHouse</span>
            </div>
            <p className="text-[15px] font-light text-gray-500 leading-relaxed">
              {t("description", { fallback: "We provide curated travel experiences with expert local guides, safe transportation, and unforgettable moments." })}
            </p>
          </div>

          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Quick Links */}
            <div className="flex flex-col gap-5">
              <h3 className="text-[15px] font-medium text-brand-darkRed">
                {t("quick_links", { fallback: "Quick Links" })}
              </h3>
              <ul className="space-y-4">
                {[
                  { label: tc("home", { fallback: "Home" }), href: "/" },
                  { label: tc("tours", { fallback: "Packages" }), href: "/tours" },
                  { label: tc("about", { fallback: "About" }), href: "/nosotros" },
                  { label: tc("faq", { fallback: "How it works" }), href: "/faq" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] font-light text-gray-500 hover:text-brand-orange transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-5">
              <h3 className="text-[15px] font-medium text-brand-darkRed">
                {t("contact_info", { fallback: "Contact Info" })}
              </h3>
              <ul className="space-y-4 text-[14px] font-light text-gray-500">
                <li className="hover:text-brand-orange transition-colors cursor-pointer">
                  {email}
                </li>
                <li className="hover:text-brand-orange transition-colors cursor-pointer">
                  {phone}
                </li>
                <li className="hover:text-brand-orange transition-colors cursor-pointer leading-tight max-w-[150px]">
                  {address}
                </li>
              </ul>
            </div>

            {/* Subscribe & Socials */}
            <div className="flex flex-col gap-6 lg:items-end">
               <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[300px]">
                  <input 
                     type="email" 
                     placeholder="Enter your email address" 
                     className="flex-1 h-12 rounded-full border border-gray-200 px-5 text-[14px] outline-none focus:border-brand-teal transition-colors"
                  />
                  <Button className="h-12 rounded-full bg-[#111] hover:bg-black text-white px-6 font-medium">
                     Subscribe
                  </Button>
               </div>
               
               <div className="flex items-center gap-3 w-full max-w-[300px] lg:justify-end mt-2">
                 {[
                   { icon: <Youtube className="h-4 w-4" />, name: "youtube" },
                   { icon: <Facebook className="h-4 w-4" />, name: "facebook" },
                   { icon: <Instagram className="h-4 w-4" />, name: "instagram" },
                   { icon: <Twitter className="h-4 w-4" />, name: "twitter" }
                 ].map((social) => (
                   <a 
                     key={social.name}
                     href="#"
                     className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-600 hover:border-brand-orange hover:text-brand-orange transition-all hover:-translate-y-1"
                   >
                     {social.icon}
                   </a>
                 ))}
               </div>
            </div>
          </div>
          
        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center lg:justify-start">
          <p className="text-[13px] font-light text-gray-500 text-center">
            &copy; {CURRENT_YEAR} LikeInHouse. {tc("all_rights", { fallback: "All rights reserved." })}
          </p>
        </div>
      </div>
    </footer>
  );
}
