'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, MessageSquare, Mail, HelpCircle,
  ShieldCheck, Search, ChevronDown, FileText, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface FAQItem {
  question: string;
  answer: string;
  category: 'booking' | 'maid' | 'payment' | 'safety';
}

const FAQS: FAQItem[] = [
  {
    category: 'booking',
    question: 'How do I book a maid on MaidEasy?',
    answer: 'Select your location and desired service category, browse verified maid profiles, select date and time slot, choose pricing option (hourly, daily, or monthly), and complete checkout securely.',
  },
  {
    category: 'booking',
    question: 'Can I reschedule or cancel my booking?',
    answer: 'Yes, you can cancel or reschedule up to 2 hours before the service start time directly from your My Bookings tab without any cancellation fee.',
  },
  {
    category: 'maid',
    question: 'How are maids background-checked and verified?',
    answer: 'Every maid undergoes a multi-step verification process including Government Aadhaar identity validation, live camera photo verification, and manual admin profile review before becoming active.',
  },
  {
    category: 'maid',
    question: 'What if the maid does not show up on time?',
    answer: 'If your maid is delayed or unable to attend, you can contact them directly or request an instant free replacement/full refund via our support hotline.',
  },
  {
    category: 'payment',
    question: 'What payment methods are accepted?',
    answer: 'We support all major payment options via secure checkout including UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Completion.',
  },
  {
    category: 'payment',
    question: 'When is payment released to the maid?',
    answer: 'Payment is securely held by MaidEasy and only released to the service provider after successful job completion and customer confirmation.',
  },
  {
    category: 'safety',
    question: 'Is my personal and address information safe?',
    answer: 'Yes, address details are only shared with the assigned maid for active bookings. Sensitive data like Aadhaar is encrypted and never exposed publicly.',
  },
  {
    category: 'safety',
    question: 'What safety measures are in place for customers and maids?',
    answer: 'We enforce strict identity verification, track booking status progression in real time, and offer 24/7 dedicated support for any emergency or conflict resolution.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery = searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-dvh bg-[var(--background)] flex flex-col">
      {/* Top Header */}
      <header className="w-full px-5 py-4 flex items-center justify-between border-b border-[var(--border)] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/home">
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <BrandLogo size="md" />
        </div>
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="size-3.5 text-[var(--success-600)]" /> 24/7 Support
        </Badge>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 py-4"
        >
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">How can we help you?</h1>
          <p className="text-sm text-[var(--text-secondary)]">Search our help center or choose a contact option below</p>
          
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
            <Input
              type="text"
              placeholder="Search help topics, FAQs, safety..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white shadow-xs"
            />
          </div>
        </motion.div>

        {/* Contact Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 flex items-center gap-3 bg-white border-[var(--border)] shadow-xs hover:border-[var(--primary-400)] transition-all">
            <div className="size-10 rounded-xl bg-[var(--primary-50)] text-[var(--primary-600)] flex items-center justify-center shrink-0">
              <Phone className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-secondary)]">Call Support</div>
              <a href="tel:+911800123456" className="text-sm font-black text-[var(--text-primary)] hover:underline">
                1800-123-456
              </a>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3 bg-white border-[var(--border)] shadow-xs hover:border-[var(--success-500)] transition-all">
            <div className="size-10 rounded-xl bg-[var(--success-50)] text-[var(--success-600)] flex items-center justify-center shrink-0">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-secondary)]">WhatsApp Support</div>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-sm font-black text-[var(--text-primary)] hover:underline">
                +91 98765 43210
              </a>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3 bg-white border-[var(--border)] shadow-xs hover:border-[var(--accent-500)] transition-all">
            <div className="size-10 rounded-xl bg-[var(--accent-50)] text-[var(--accent-600)] flex items-center justify-center shrink-0">
              <Mail className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-secondary)]">Email Support</div>
              <a href="mailto:support@maideasy.in" className="text-sm font-black text-[var(--text-primary)] hover:underline">
                support@maideasy.in
              </a>
            </div>
          </Card>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'booking', label: 'Bookings & Scheduling' },
            { id: 'maid', label: 'Maid & Verification' },
            { id: 'payment', label: 'Pricing & Payments' },
            { id: 'safety', label: 'Safety & Privacy' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[var(--primary-600)] text-white shadow-xs'
                  : 'bg-white text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--gray-50)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <Card className="p-2 border-[var(--border)] bg-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <HelpCircle className="size-5 text-[var(--primary-600)]" /> Frequently Asked Questions
            </CardTitle>
            <CardDescription>Find quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <HelpCircle className="size-10 text-[var(--text-muted)] mx-auto" />
                <div className="text-sm font-bold text-[var(--text-secondary)]">No FAQs match your search</div>
                <div className="text-xs text-[var(--text-muted)]">Try searching with different keywords or contact support above</div>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-[var(--border)] rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left font-bold text-sm text-[var(--text-primary)] flex items-center justify-between gap-3 hover:bg-[var(--gray-50)] cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`size-4 text-[var(--text-muted)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-light)] bg-[var(--gray-50)]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Policies Links */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[var(--text-secondary)] pt-4">
          <Link href="/terms" className="hover:underline flex items-center gap-1">
            <FileText className="size-3.5" /> Terms of Service
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:underline flex items-center gap-1">
            <CheckCircle className="size-3.5" /> Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
