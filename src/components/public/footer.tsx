"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
            <Link href="/" className="mb-2 inline-block">
              <Image
                src="/Logo-Azul.svg"
                alt="Like In House Logo"
                width={180}
                height={60}
                className="h-14 w-auto"
              />
            </Link>
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
                   {
                     name: "youtube",
                     icon: (
                       <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                         <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                       </svg>
                     ),
                   },
                   {
                     name: "facebook",
                     icon: (
                       <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                         <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                       </svg>
                     ),
                   },
                   {
                     name: "instagram",
                     icon: (
                       <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                         <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                       </svg>
                     ),
                   },
                   {
                     name: "tiktok",
                     icon: (
                       <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                         <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                       </svg>
                     ),
                   },
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
