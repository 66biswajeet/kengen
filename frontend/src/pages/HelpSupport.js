import React from "react";
import AppHeader from "../components/AppHeader";
import { MessageCircle, Mail, Phone, ExternalLink } from "lucide-react";

export default function HelpSupport() {
  return (
    <div className="app-shell pb-8" data-testid="help-screen">
      <AppHeader title="Help & Support" />
      <div className="px-5 pt-6 space-y-4">
        <div className="card p-5">
          <div className="text-slate text-sm">Have a question or facing an issue? Our support team is here to help — 7 days a week, 9am–9pm.</div>
        </div>

        <a href="https://wa.me/919999900000" target="_blank" rel="noreferrer" className="card p-4 flex items-center gap-4 hover:border-success/30 transition-colors" data-testid="help-whatsapp">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><MessageCircle size={22} className="text-success" /></div>
          <div className="flex-1">
            <div className="font-semibold text-charcoal">Chat on WhatsApp</div>
            <div className="text-xs text-slate">+91 99999 00000 · usually replies in 5 min</div>
          </div>
          <ExternalLink size={16} className="text-slate" />
        </a>

        <a href="mailto:support@aquaserve.com" className="card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors" data-testid="help-email">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Mail size={22} className="text-primary" /></div>
          <div className="flex-1">
            <div className="font-semibold text-charcoal">Email support</div>
            <div className="text-xs text-slate">support@aquaserve.com</div>
          </div>
          <ExternalLink size={16} className="text-slate" />
        </a>

        <a href="tel:+919999900000" className="card p-4 flex items-center gap-4 hover:border-accent/30 transition-colors" data-testid="help-call">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><Phone size={22} className="text-accent-dark" /></div>
          <div className="flex-1">
            <div className="font-semibold text-charcoal">Call us</div>
            <div className="text-xs text-slate">+91 99999 00000</div>
          </div>
          <ExternalLink size={16} className="text-slate" />
        </a>

        <div className="text-xs text-slate text-center pt-4">This app does not have in-app chat. Use WhatsApp or email above for support.</div>
      </div>
    </div>
  );
}
